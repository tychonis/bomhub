package serve

import (
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tychonis/cyanotype/core/scene"
	"github.com/tychonis/cyanotype/model"
)

func (s *Server) GetDisassembledScene(ctx *gin.Context) {
	tag := ctx.Param("id")
	digest := ctx.Param("digest")
	catalog, err := s.getCatalog(tag)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	parent, err := catalog.Get(digest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	rendered, err := scene.RenderSymbol(catalog, parent, false)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, rendered)
}

func (s *Server) GetRepresentation(ctx *gin.Context) {
	digest, err := hex.DecodeString(ctx.Param("digest"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	typ := ctx.Query("type")
	if typ == "" {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	obj, err := s.DB.GetRepresentation(ctx, digest, typ)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	objhex := hex.EncodeToString(obj)
	ctx.Redirect(http.StatusFound, s.StorageAPIBase+"/object/"+objhex)
}

func (s *Server) SaveRepresentation(ctx *gin.Context) {
	digest, err := hex.DecodeString(ctx.Param("digest"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	var body model.Artifact
	err = ctx.BindJSON(&body)
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	objectDigest, err := hex.DecodeString(body.Digest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	err = s.DB.SaveRepresentation(ctx, digest, objectDigest, body.Tag)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	ctx.Status(http.StatusOK)
}
