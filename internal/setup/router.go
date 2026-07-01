package setup

import (
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

func CreateDefaultRouter() *gin.Engine {
	router := gin.Default()
	router.Use(CORSMiddleware())
	if viper.GetString("env") != "local" {
		auth := CreateDefaultAuthConfig()
		auth.RegisterTo(router)
	}
	viper.SetDefault("router.address", ":8080")
	slog.Info("server running", "address", viper.GetString("router.address"))
	go router.Run(viper.GetString("router.address"))
	return router
}
