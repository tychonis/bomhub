package serve

import (
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tychonis/cyanotype/core/instantiator"
	"github.com/tychonis/cyanotype/model"
)

func getItemName(item *model.Item) string {
	if item == nil || item.Content == nil {
		return ""
	}
	return item.Content.Name
}

func (s *Server) GetIndex(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	obj, err := s.DB.GetIndex(ctx, id)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", obj)
}

func (s *Server) SaveIndex(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
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
	_, err = s.DB.SaveIndex(ctx, id, json.RawMessage(data))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	ctx.Status(http.StatusAccepted)
}

func (s *Server) GetRoots(ctx *gin.Context) {
	type rootResp struct {
		Digest string `json:"digest"`
		Name   string `json:"name"`
	}
	type rootsResp struct {
		Roots []*rootResp `json:"roots"`
	}
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	roots, err := s.DB.GetRoots(ctx, id)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	resp := rootsResp{
		Roots: make([]*rootResp, 0, len(roots)),
	}
	for _, root := range roots {
		digest := hex.EncodeToString(root)
		def, err := s.DB.GetDefinition(ctx, root)
		if err != nil {
			ctx.AbortWithStatusJSON(
				http.StatusInternalServerError,
				gin.H{
					"error":  "failed to get definition",
					"symbol": digest,
				},
			)
			return
		}
		var item model.Item
		json.Unmarshal(def, &item)
		r := rootResp{
			Digest: digest,
			Name:   getItemName(&item),
		}
		resp.Roots = append(resp.Roots, &r)
	}
	ctx.JSON(http.StatusOK, resp)
}

func (s *Server) CreateRoot(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	defer ctx.Request.Body.Close()
	req := struct {
		Digest string `json:"digest"`
	}{}
	err = ctx.ShouldBind(&req)
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	rawDigest, err := hex.DecodeString(req.Digest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	err = s.DB.CreateRoot(ctx, id, rawDigest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	ctx.Status(http.StatusAccepted)
}

func (s *Server) GetRevisions(ctx *gin.Context) {
	tag := ctx.Param("id")
	catalog, err := s.getCatalog(tag)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	revisions, err := catalog.GetNewerRevisions(nil)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	ctx.JSON(http.StatusOK, revisions)
}

func (s *Server) SaveWorkspaceSummary(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
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
	_, err = s.DB.SaveWorkspaceSummary(ctx, id, json.RawMessage(data))
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	ctx.Status(http.StatusAccepted)
}

func (s *Server) GetWorkspaceSummary(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	obj, err := s.DB.GetWorkspaceSummary(ctx, id)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", obj)
}

func (s *Server) GetHistory(ctx *gin.Context) {
	tag := ctx.Param("id")
	digest := ctx.Param("digest")
	catalog, err := s.getCatalog(tag)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	history, err := instantiator.History(catalog, digest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	ctx.JSON(http.StatusOK, history)
}
