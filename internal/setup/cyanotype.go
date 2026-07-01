package setup

import (
	"github.com/spf13/viper"
	"github.com/tychonis/cyanotype/core/parser/hcl"
)

func CreateDefaultCyanotype(tag string) *hcl.Core {
	return hcl.NewCoreFromAPI(
		viper.GetString("cyanotype.core"),
		viper.GetString("cyanotype.token"),
		tag,
	)
}
