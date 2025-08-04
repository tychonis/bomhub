package db

import (
	"context"

	"github.com/google/uuid"
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
	sql := "SELECT name, repo, bpc FROM bom;"
	rows, _ := c.pool.Query(ctx, sql)
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (*BOMItem, error) {
		var item BOMItem
		err := row.Scan(&item.Name, &item.Repo, &item.BPC)
		return &item, err
	})
}

func (c *Client) GetItemDetails(ctx context.Context, itemID uuid.UUID) (map[string]any, error) {
	const sql = "SELECT details FROM item WHERE item_uuid= $1;"
	row := c.pool.QueryRow(ctx, sql, itemID)
	var details map[string]any
	err := row.Scan(&details)
	return details, err
}
