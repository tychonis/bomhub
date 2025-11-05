package db

import (
	"context"
	"encoding/json"

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
	ID   int    `json:"id"`
	Name string `json:"name"`
	Repo string `json:"repo"`
	BPC  string `json:"bpc"`
}

func (c *Client) GetBOMItems(ctx context.Context) ([]*BOMItem, error) {
	sql := "SELECT id, name, repo, bpc FROM bom;"
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

func (c *Client) LogActivity(ctx context.Context, email string, path string) error {
	const sql = "INSERT INTO activity(email, path) VALUES ($1, $2);"
	_, err := c.pool.Exec(ctx, sql, email, path)
	return err
}

func (c *Client) SaveObject(ctx context.Context, digest []byte, content any) (json.RawMessage, error) {
	body, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}

	const q = `
INSERT INTO object (object_digest, content)
VALUES ($1, $2::jsonb)
ON CONFLICT (object_digest)
DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = now()
RETURNING content;
`

	var ret json.RawMessage
	err = c.pool.QueryRow(ctx, q, digest, body).
		Scan(&ret)
	if err != nil {
		return nil, err
	}

	return ret, nil
}

func (c *Client) GetObject(ctx context.Context, digest []byte) (json.RawMessage, error) {
	const q = `SELECT content FROM object WHERE object_digest = $1;`
	var raw json.RawMessage
	err := c.pool.QueryRow(ctx, q, digest).Scan(&raw)
	return raw, err
}
