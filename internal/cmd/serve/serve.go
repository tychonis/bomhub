package serve

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	lru "github.com/hashicorp/golang-lru/v2"
	"golang.org/x/sync/singleflight"

	"github.com/tychonis/cyanotype/core/catalog"
	"github.com/tychonis/cyanotype/model"

	"github.com/tychonis/bomhub/internal/db"
	"github.com/tychonis/bomhub/internal/setup"
)

type BOMTreeCacheKey struct {
	Revision model.RevisionID
	Root     model.Digest
}

func (k BOMTreeCacheKey) String() string {
	return fmt.Sprintf("%s-%s", k.Revision, k.Root)
}

type CatalogCacheKey model.RevisionID

type Server struct {
	DB *db.Client

	bomTreeCache *lru.Cache[BOMTreeCacheKey, []byte]
	bomTreeGroup singleflight.Group
	catalogCache *lru.Cache[CatalogCacheKey, *catalog.Catalog]
	catalogGroup singleflight.Group
}

const CatalogCacheSize = 8

func NewServer(db *db.Client, bomTreeCacheSize int) (*Server, error) {
	bomTreeCache, err := lru.New[BOMTreeCacheKey, []byte](bomTreeCacheSize)
	if err != nil {
		return nil, err
	}
	catalogCache, err := lru.New[CatalogCacheKey, *catalog.Catalog](CatalogCacheSize)
	if err != nil {
		return nil, err
	}
	return &Server{
		DB:           db,
		bomTreeCache: bomTreeCache,
		bomTreeGroup: singleflight.Group{},
		catalogCache: catalogCache,
		catalogGroup: singleflight.Group{},
	}, nil
}

func (s *Server) GetBOMs(ctx *gin.Context) {
	boms, err := s.DB.GetBOMItems(ctx)
	if err != nil {
		slog.Error("Error getting items", "error", err)
		ctx.JSON(http.StatusInternalServerError, nil)
		return
	}
	ctx.JSON(http.StatusOK, boms)
}

func (s *Server) GetDefinition(ctx *gin.Context) {
	digest, err := hex.DecodeString(ctx.Param("digest"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	obj, err := s.DB.GetDefinition(ctx, digest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", obj)
}

func (s *Server) SaveDefinition(ctx *gin.Context) {
	digest, err := hex.DecodeString(ctx.Param("digest"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	defer ctx.Request.Body.Close()
	data, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	_, err = s.DB.SaveDefinition(ctx, digest, json.RawMessage(data))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	ctx.Status(http.StatusAccepted)
}

func (s *Server) GetMetadata(ctx *gin.Context) {
	digest, err := hex.DecodeString(ctx.Param("digest"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	obj, err := s.DB.GetMetadata(ctx, digest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", obj)
}

func (s *Server) SaveMetadata(ctx *gin.Context) {
	digest, err := hex.DecodeString(ctx.Param("digest"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	defer ctx.Request.Body.Close()
	data, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	_, err = s.DB.SaveMetadata(ctx, digest, json.RawMessage(data))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	ctx.Status(http.StatusAccepted)
}

func (s *Server) getCatalogRevision(tag string, rev model.RevisionID) (*catalog.Catalog, error) {
	key := CatalogCacheKey(rev)
	if catalog, ok := s.catalogCache.Get(key); ok {
		return catalog, nil
	}
	value, err, _ := s.catalogGroup.Do(rev, func() (interface{}, error) {
		if catalog, ok := s.catalogCache.Get(key); ok {
			return catalog, nil
		}
		catalog := setup.CreateDefaultCatalog(tag)
		ordinaryRev, err := catalog.GetLatestRevision()
		if err != nil {
			return nil, err
		}
		// Use the actual revision of the catalog to cache.
		s.catalogCache.Add(CatalogCacheKey(ordinaryRev.Digest), catalog)
		return catalog, nil
	})
	if err != nil {
		return nil, err
	}
	catalog, ok := value.(*catalog.Catalog)
	if !ok {
		return nil, fmt.Errorf("invalid catalog type")
	}
	return catalog, nil
}

func (s *Server) getCatalog(tag string) (*catalog.Catalog, error) {
	head, err := s.GetCatalogHead(tag)
	if err != nil {
		// This is a hacky way to make sure we fetch new catalog.
		head = model.RevisionID("invalid")
	}
	return s.getCatalogRevision(tag, head)
}

func (s *Server) GetCatalog(ctx *gin.Context) {
	tag := ctx.Param("id")
	catalog, err := s.getCatalog(tag)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	content, err := catalog.Export()
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	ctx.JSON(http.StatusOK, json.RawMessage(content))
}

func (s *Server) getBOMTree(catalog *catalog.Catalog, digest model.Digest) ([]byte, error) {
	root, err := catalog.Get(digest)
	if err != nil {
		return nil, err
	}
	rootItem, ok := root.(*model.Item)
	if !ok {
		return nil, fmt.Errorf("item not found")
	}
	instantiator := setup.CreateDefaultInstantiator()
	rootNode, err := instantiator.InstantiateTreeFromItem(catalog, "root", rootItem)
	if err != nil {
		return nil, err
	}
	return rootNode.Export()
}

func (s *Server) GetBOMTree(ctx *gin.Context) {
	tag := ctx.Param("id")
	digest := ctx.Param("digest")
	catalog, err := s.getCatalog(tag)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	latestRevision, err := catalog.GetLatestRevision()
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	key := BOMTreeCacheKey{
		Revision: latestRevision.Digest,
		Root:     digest,
	}

	content, ok := s.bomTreeCache.Get(key)
	if ok {
		ctx.JSON(http.StatusOK, json.RawMessage(content))
		return
	}

	value, err, _ := s.bomTreeGroup.Do(key.String(), func() (interface{}, error) {
		if content, ok := s.bomTreeCache.Get(key); ok {
			return content, nil
		}
		content, err = s.getBOMTree(catalog, model.Digest(digest))
		if err != nil {
			return nil, err
		}
		s.bomTreeCache.Add(key, content)
		return content, nil
	})
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	contentBytes, ok := value.([]byte)
	if !ok {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	ctx.JSON(http.StatusOK, json.RawMessage(contentBytes))
}

func (s *Server) GetCatalogHead(tag string) (model.RevisionID, error) {
	id, err := strconv.ParseInt(tag, 10, 32)
	if err != nil {
		return "", err
	}
	summary, err := s.DB.GetWorkspaceSummary(context.TODO(), int(id))
	if err != nil {
		return "", err
	}
	type content struct {
		LatestRevision model.RevisionID `json:"latest_revision"`
	}
	var c content
	err = json.Unmarshal(summary, &c)
	if err != nil {
		return "", err
	}
	return c.LatestRevision, nil
}
