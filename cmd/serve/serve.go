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

	router.POST("/bom_index/:id", server.SaveIndex)
	router.GET("/bom_index/:id", server.GetIndex)

	router.GET("/catalog/:id", server.GetCatalog)
	router.GET("/tree/:id/:digest", server.GetBOMTree)

	router.GET("/workspace/:id", server.GetWorkspaceSummary)
	router.POST("/workspace/:id", server.SaveWorkspaceSummary)
	router.GET("/workspace/:id/roots", server.GetRoots)

	setup.WaitOnOSSignals()
}
