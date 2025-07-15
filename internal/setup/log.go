package setup

import (
	"log/slog"
	"os"

	"github.com/spf13/viper"
)

func SetLogFormatter() {
	lvl := slog.LevelInfo
	if viper.GetBool("debug") || viper.GetString("stage") != "production" {
		lvl = slog.LevelDebug
	}
	slogger := slog.New(
		slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: lvl}),
	)
	slog.SetDefault(slogger)
}
