package setup

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

func CreateDefaultRouter() *gin.Engine {
	router := gin.Default()
	auth := CreateDefaultAuthConfig()
	auth.RegisterTo(router)
	viper.SetDefault("router.address", ":8080")
	fmt.Printf("addr: %+v", viper.GetString("router.address"))
	go router.Run(viper.GetString("router.address"))
	return router
}
