package serve

import (
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/tychonis/bomhub/internal/auth"
	"github.com/tychonis/bomhub/internal/cmd/serve"
	"github.com/tychonis/bomhub/internal/db"
	"github.com/tychonis/bomhub/internal/setup"
	"github.com/tychonis/bomhub/internal/storage"
)

var Cmd = &cobra.Command{
	Use:   "serve",
	Short: "start bomhub backend",
	Run:   run,
}

func registerServer(router *gin.Engine, server *serve.Server) {
	router.GET("/boms", server.GetBOMs)
	auth.GrantMemberAccess(auth.GET("/boms"))

	router.POST("/definition/:digest", server.SaveDefinition)
	router.GET("/definition/:digest", server.GetDefinition)
	auth.GrantMemberAccess(auth.POST("/definition/:digest"))
	auth.GrantMemberAccess(auth.GET("/definition/:digest"))

	router.POST("/metadata/:digest", server.SaveMetadata)
	router.GET("/metadata/:digest", server.GetMetadata)
	auth.GrantMemberAccess(auth.POST("/metadata/:digest"))
	auth.GrantMemberAccess(auth.GET("/metadata/:digest"))

	router.GET("/tree/:id/:digest", server.GetBOMTree)
	router.GET("/models/:id/:digest", server.GetDisassembledScene)
	router.GET("/model/:id/:digest", server.GetModel)
	auth.GrantMemberAccess(auth.GET("/tree/:id/:digest"))
	auth.GrantMemberAccess(auth.GET("/models/:id/:digest"))
	auth.GrantMemberAccess(auth.GET("/model/:id/:digest"))

	router.GET("/history/:id/:digest", server.GetHistory)
	auth.GrantMemberAccess(auth.GET("/history/:id/:digest"))

	router.GET("/module/*module", server.GetModule)
	router.POST("/module/*module", server.CreateModule)
	auth.GrantMemberAccess(auth.GET("/module/*module"))
	auth.GrantMemberAccess(auth.POST("/module/*module"))

	router.GET("/workspace/:id", server.GetWorkspaceSummary)
	router.POST("/workspace/:id", server.SaveWorkspaceSummary)
	router.GET("/workspace/:id/catalog", server.GetCatalog)
	router.GET("/workspace/:id/roots", server.GetRoots)
	router.POST("/workspace/:id/index", server.SaveIndex)
	router.GET("/workspace/:id/index", server.GetIndex)
	auth.GrantMemberAccess(auth.GET("/workspace/:id"))
	auth.GrantMemberAccess(auth.POST("/workspace/:id"))
	auth.GrantMemberAccess(auth.GET("/workspace/:id/catalog"))
	auth.GrantMemberAccess(auth.GET("/workspace/:id/roots"))
	auth.GrantMemberAccess(auth.POST("/workspace/:id/index"))
	auth.GrantMemberAccess(auth.GET("/workspace/:id/index"))

	router.GET("/scene/:digest", server.GetScene)
	router.POST("/scene/:digest", server.SaveScene)
	auth.GrantMemberAccess(auth.GET("/scene/:digest"))
	auth.GrantMemberAccess(auth.POST("/scene/:digest"))
}

func registerStorage(router *gin.Engine, s storage.ObjectStore) {
	router.HEAD("/object/*key", storage.ServeObjectHandler(s))
	router.GET("/object/*key", storage.ServeObjectHandler(s))
	router.POST("/object/*key", storage.UploadObjectHandler(s))
	auth.GrantMemberAccess(auth.HEAD("/object/*key"))
	auth.GrantMemberAccess(auth.GET("/object/*key"))
	auth.GrantMemberAccess(auth.POST("/object/*key"))
}

func run(cmd *cobra.Command, args []string) {
	dbpool := setup.CreateDefaultDBPool()
	dbc := db.NewClient(dbpool)

	router := setup.CreateDefaultRouter()
	router.Use(func(ctx *gin.Context) {
		user, ok := ctx.Get("user")
		if !ok {
			user = "unknown"
		}
		dbc.LogActivity(ctx, user.(string), ctx.FullPath())
	})

	server, err := serve.NewServer(dbc, 256, viper.GetString("storage.base"))
	if err != nil {
		slog.Error("failed to create server", "err", err)
		return
	}
	registerServer(router, server)

	s := setup.CreateDefaultStorage()
	registerStorage(router, s)

	setup.WaitOnOSSignals()
}
