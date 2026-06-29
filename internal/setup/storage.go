package setup

import (
	"github.com/spf13/viper"

	"github.com/tychonis/bomhub/internal/storage"
)

func CreateDefaultStorage() storage.ObjectStore {
	return &storage.LocalObjectStore{
		Root: viper.GetString("storage.root"),
	}
}
