package serve

import (
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
