package serve

import (
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"

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

func run(cmd *cobra.Command, args []string) {
	dbpool := setup.CreateDefaultDBPool()
	dbc := db.NewClient(dbpool)

	server, err := serve.NewServer(dbc, 256)
	if err != nil {
		slog.Error("failed to create server", "err", err)
		return
	}

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
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/boms"))
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/item/:id"))

	router.POST("/definition/:digest", server.SaveDefinition)
	router.GET("/definition/:digest", server.GetDefinition)
	auth.GrantMemberAccess(auth.ResourceFromPath("POST", "/definition/:digest"))
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/definition/:digest"))

	router.POST("/metadata/:digest", server.SaveMetadata)
	router.GET("/metadata/:digest", server.GetMetadata)
	auth.GrantMemberAccess(auth.ResourceFromPath("POST", "/metadata/:digest"))
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/metadata/:digest"))

	router.POST("/bom_index/:id", server.SaveIndex)
	router.GET("/bom_index/:id", server.GetIndex)
	auth.GrantMemberAccess(auth.ResourceFromPath("POST", "/bom_index/:id"))
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/bom_index/:id"))

	router.GET("/catalog/:id", server.GetCatalog)
	router.GET("/tree/:id/:digest", server.GetBOMTree)
	router.GET("/models/:id/:digest", server.GetToRenderMeshes)
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/catalog/:id"))
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/tree/:id/:digest"))
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/models/:id/:digest"))

	router.GET("/workspace/:id", server.GetWorkspaceSummary)
	router.POST("/workspace/:id", server.SaveWorkspaceSummary)
	router.GET("/workspace/:id/roots", server.GetRoots)
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/workspace/:id"))
	auth.GrantMemberAccess(auth.ResourceFromPath("POST", "/workspace/:id"))
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/workspace/:id/roots"))

	s := setup.CreateDefaultStorage()
	router.GET("/object/*key", storage.ServeObjectHandler(s))
	router.POST("/object/*key", storage.UploadObjectHandler(s))
	auth.GrantMemberAccess(auth.ResourceFromPath("GET", "/object/*key"))
	auth.GrantMemberAccess(auth.ResourceFromPath("POST", "/object/*key"))

	setup.WaitOnOSSignals()
}
