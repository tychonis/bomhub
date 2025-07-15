package setup

import "github.com/spf13/viper"

func ReadConfig() error {
	viper.AddConfigPath(".")
	viper.SetConfigName("config")
	viper.ReadInConfig()
	return nil
}
