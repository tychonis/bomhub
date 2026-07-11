package serve

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	lru "github.com/hashicorp/golang-lru/v2"
	"golang.org/x/sync/singleflight"

	"github.com/tychonis/cyanotype/core/catalog"
	"github.com/tychonis/cyanotype/model"

	"github.com/tychonis/bomhub/internal/db"
	"github.com/tychonis/bomhub/internal/setup"
)

type BOMTreeCacheKey struct {
	Tag      string
	Revision model.RevisionID
	Digest   model.Digest
}

func (k BOMTreeCacheKey) String() string {
	return fmt.Sprintf("%s-%s-%s", k.Tag, k.Revision, k.Digest)
}

type Server struct {
	DB *db.Client

	bomTreeCache *lru.Cache[BOMTreeCacheKey, []byte]
	bomTreeGroup singleflight.Group
}

func NewServer(db *db.Client, bomTreeCacheSize int) (*Server, error) {
	cache, err := lru.New[BOMTreeCacheKey, []byte](bomTreeCacheSize)
	if err != nil {
		return nil, err
	}
	return &Server{
		DB:           db,
		bomTreeCache: cache,
		bomTreeGroup: singleflight.Group{},
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

func (s *Server) GetItem(ctx *gin.Context) {
	itemID := ctx.Param("id")
	parsed, err := uuid.Parse(itemID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, nil)
		return
	}
	details, err := s.DB.GetItemDetails(ctx, parsed)
	if err != nil {
		ctx.JSON(http.StatusNotFound, nil)
		return
	}
	ctx.JSON(http.StatusOK, details)
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

func (s *Server) GetCatalog(ctx *gin.Context) {
	tag := ctx.Param("id")
	catalog := setup.CreateDefaultCatalog(tag)
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
	rootNode, err := instantiator.InstantiateTree(catalog, "root", rootItem)
	if err != nil {
		return nil, err
	}
	return rootNode.Export()
}

func (s *Server) GetBOMTree(ctx *gin.Context) {
	tag := ctx.Param("id")
	digest := ctx.Param("digest")
	catalog := setup.CreateDefaultCatalog(tag)
	latestRevision, err := catalog.GetLatestRevision()
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	key := BOMTreeCacheKey{
		Tag:      tag,
		Digest:   digest,
		Revision: latestRevision.Digest,
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
	return
}
