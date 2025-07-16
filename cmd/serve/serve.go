package serve

import (
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	"github.com/tychonis/bomhub/internal/setup"
)

var Cmd = &cobra.Command{
	Use:   "serve",
	Short: "start bomhub backend",
	Run:   run,
}

func run(cmd *cobra.Command, args []string) {
	router := setup.CreateDefaultRouter()
	router.GET("/test", func(ctx *gin.Context) { ctx.JSON(200, gin.H{"msg": "to be implemented."}) })

	setup.WaitOnOSSignals()
}
