package setup

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/spf13/viper"
)

func CreateDefaultDBPool() *pgxpool.Pool {
	host := viper.GetString("db.host")
	port := viper.GetInt("db.port")
	name := viper.GetString("db.name")
	user := viper.GetString("db.user")
	password := viper.GetString("db.password")

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s", user, password, host, port, name)

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		slog.Warn("Unable to create DB pool.", "error", err)
		return nil
	}

	return pool
}
