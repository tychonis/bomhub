package serve

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/spf13/cobra"

	"github.com/tychonis/bomhub/internal/db"
	"github.com/tychonis/bomhub/internal/setup"
)

var Cmd = &cobra.Command{
	Use:   "serve",
	Short: "start bomhub backend",
	Run:   run,
}

func run(cmd *cobra.Command, args []string) {
	dbpool := setup.CreateDefaultDBPool()
	dbc := db.NewClient(dbpool)

	getBOMs := func(ctx *gin.Context) {
		boms, err := dbc.GetBOMItems(ctx)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, nil)
			return
		}
		ctx.JSON(http.StatusOK, boms)
	}

	getItem := func(ctx *gin.Context) {
		itemID := ctx.Param("id")
		parsed, err := uuid.Parse(itemID)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, nil)
			return
		}
		details, err := dbc.GetItemDetails(ctx, parsed)
		if err != nil {
			ctx.JSON(http.StatusNotFound, nil)
			return
		}
		ctx.JSON(http.StatusOK, details)
	}

	router := setup.CreateDefaultRouter()
	router.GET("/boms", getBOMs)
	router.GET("/item/:id", getItem)

	setup.WaitOnOSSignals()
}
