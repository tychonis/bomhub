package db

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
)

func (c *Client) SaveIndex(ctx context.Context, id int, content any) (json.RawMessage, error) {
	body, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}

	const q = `
INSERT INTO index (bom_id, content)
VALUES ($1::int, $2::jsonb)
ON CONFLICT (bom_id)
DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = now()
RETURNING content;
`

	var ret json.RawMessage
	err = c.pool.QueryRow(ctx, q, id, body).
		Scan(&ret)
	if err != nil {
		return nil, err
	}

	return ret, nil
}

func (c *Client) GetIndex(ctx context.Context, id int) (json.RawMessage, error) {
	const q = `SELECT content FROM index WHERE bom_id = $1;`
	var raw json.RawMessage
	err := c.pool.QueryRow(ctx, q, id).Scan(&raw)
	return raw, err
}

func (c *Client) GetRoots(ctx context.Context, id int) ([][]byte, error) {
	const q = `SELECT root_digest FROM root WHERE bom_id = $1;`
	rows, _ := c.pool.Query(ctx, q, id)
	return pgx.CollectRows(rows, pgx.RowTo[[]byte])
}

func (c *Client) GetWorkspaceSummary(ctx context.Context, id int) (json.RawMessage, error) {
	const q = `SELECT summary FROM bom WHERE bom_id = $1;`
	var raw json.RawMessage
	err := c.pool.QueryRow(ctx, q, id).Scan(&raw)
	return raw, err
}
