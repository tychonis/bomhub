package setup

import (
	"github.com/spf13/viper"

	"github.com/tychonis/cyanotype/core/catalog"
	"github.com/tychonis/cyanotype/core/instantiator"
)

func CreateDefaultCatalog(tag string) *catalog.Catalog {
	return catalog.NewRemoteCatalog(
		viper.GetString("cyanotype.core"),
		viper.GetString("cyanotype.token"),
		tag,
	)
}

func CreateDefaultInstantiator() *instantiator.Instantiator {
	return instantiator.New()
}
