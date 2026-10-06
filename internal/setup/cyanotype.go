package setup

import (
	"github.com/spf13/viper"

	"github.com/tychonis/cyanotype/core/catalog"
)

func CreateDefaultCatalog(module string) *catalog.Catalog {
	return catalog.NewRemoteCatalog(
		viper.GetString("cyanotype.core"),
		viper.GetString("cyanotype.token"),
		module,
	)
}
