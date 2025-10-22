package serve

import (
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"

	"github.com/tychonis/bomhub/internal/cmd/serve"
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

	server := serve.Server{DB: dbc}

	router := setup.CreateDefaultRouter()
	router.Use(func(ctx *gin.Context) {
		user, ok := ctx.Get("user")
		if !ok {
			user = "unknown"
		}
		dbc.LogActivity(ctx, user.(string), ctx.FullPath())
	})
	router.GET("/boms", server.GetBOMs)
	router.GET("/item/:id", server.GetItem)

	router.POST("/obj/:digest", server.SaveObject)
	router.GET("/obj/:digest", server.GetObject)

	setup.WaitOnOSSignals()
}
