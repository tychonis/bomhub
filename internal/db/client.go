package db

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Client struct {
	pool *pgxpool.Pool
}

func NewClient(pool *pgxpool.Pool) *Client {
	return &Client{
		pool: pool,
	}
}

type BOMItem struct {
	Name string `json:"name"`
	Repo string `json:"repo"`
	BPC  string `json:"bpc"`
}

func (c *Client) GetBOMItems(ctx context.Context) ([]*BOMItem, error) {
	sql := "SELECT name, repo, bpc FROM bom"
	rows, _ := c.pool.Query(ctx, sql)
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (*BOMItem, error) {
		var item BOMItem
		err := row.Scan(&item.Name, &item.Repo, &item.BPC)
		return &item, err
	})
}
