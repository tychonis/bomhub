package setup

import (
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"github.com/tychonis/bomhub/internal/auth"
)

var Version = "unknown"

func HealthCheckHandler(c *gin.Context) {
	c.JSON(200, gin.H{
		"status":  "ok",
		"version": Version,
	})
}

func CreateDefaultRouter() *gin.Engine {
	router := gin.Default()
	router.Use(CORSMiddleware())
	if viper.GetString("env") != "local" {
		auth := CreateDefaultAuthConfig()
		auth.RegisterTo(router)
	}
	router.GET("/healthz", HealthCheckHandler)
	auth.GrantPublicAccess(auth.GET("/healthz"))
	viper.SetDefault("router.address", ":8080")
	slog.Info("server running", "address", viper.GetString("router.address"))
	go router.Run(viper.GetString("router.address"))
	return router
}
