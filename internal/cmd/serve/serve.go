package serve

import (
	"encoding/hex"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/tychonis/bomhub/internal/db"
)

type Server struct {
	DB *db.Client
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

func (s *Server) GetObject(ctx *gin.Context) {
	digest, err := hex.DecodeString(ctx.Param("digest"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	obj, err := s.DB.GetObject(ctx, digest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", obj)
}

func (s *Server) SaveObject(ctx *gin.Context) {
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
	_, err = s.DB.SaveObject(ctx, digest, json.RawMessage(data))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	ctx.Status(http.StatusOK)
}
