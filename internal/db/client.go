package db

import (
	"context"
	"encoding/json"
	"errors"

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
	sql := "SELECT bom_id, name, repo, bpc FROM bom WHERE active = true;"
	rows, err := c.pool.Query(ctx, sql)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (*BOMItem, error) {
		var item BOMItem
		err := row.Scan(&item.ID, &item.Name, &item.Repo, &item.BPC)
		return &item, err
	})
}

func (c *Client) LogActivity(ctx context.Context, email string, path string) error {
	const sql = "INSERT INTO activity(email, path) VALUES ($1, $2);"
	_, err := c.pool.Exec(ctx, sql, email, path)
	return err
}

func (c *Client) SaveDefinition(ctx context.Context, digest []byte, content any) (json.RawMessage, error) {
	body, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}

	const q = `
INSERT INTO definition (symbol_digest, content)
VALUES ($1, $2::jsonb)
ON CONFLICT (symbol_digest)
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

func (c *Client) GetDefinition(ctx context.Context, digest []byte) (json.RawMessage, error) {
	const q = `SELECT content FROM definition WHERE symbol_digest = $1;`
	var raw json.RawMessage
	err := c.pool.QueryRow(ctx, q, digest).Scan(&raw)
	return raw, err
}

func (c *Client) SaveMetadata(ctx context.Context, digest []byte, content any) (json.RawMessage, error) {
	body, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}

	const q = `
INSERT INTO metadata (definition_id, content)
SELECT d.definition_id, val.content
FROM (VALUES ($1::bytea, $2::jsonb)) AS val(digest, content)
	LEFT JOIN definition d
    ON val.digest = d.symbol_digest
ON CONFLICT (definition_id)
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

func (c *Client) GetMetadata(ctx context.Context, digest []byte) (json.RawMessage, error) {
	const q = `
SELECT m.content
FROM metadata m
  LEFT JOIN definition d
    ON m.definition_id = d.definition_id
WHERE d.symbol_digest = $1;
`
	var raw json.RawMessage
	err := c.pool.QueryRow(ctx, q, digest).Scan(&raw)
	return raw, err
}

func (c *Client) GetScene(ctx context.Context, item []byte) ([]byte, error) {
	const q = `
SELECT object_digest
FROM scene s
  LEFT JOIN definition d
    ON s.definition_id = d.definition_id
WHERE d.symbol_digest = $1;
`
	var sceneDigest []byte
	err := c.pool.QueryRow(ctx, q, item).Scan(&sceneDigest)
	return sceneDigest, err
}

func (c *Client) SaveScene(ctx context.Context, item []byte, objectDigest []byte) error {
	const q = `
INSERT INTO scene (definition_id, object_digest)
SELECT d.definition_id, $2
FROM definition d
WHERE d.symbol_digest = $1
ON CONFLICT (definition_id)
DO UPDATE SET
  object_digest = EXCLUDED.object_digest,
  updated_at = now();
`
	_, err := c.pool.Exec(ctx, q, item, objectDigest)
	return err
}

func (c *Client) GetWorkspaceID(ctx context.Context, module string) (int, error) {
	var id int
	const q = `SELECT bom_id FROM bom WHERE module_name = $1 AND active = true`
	err := c.pool.QueryRow(ctx, q, module).Scan(&id)
	return id, err
}

func (c *Client) CreateModule(ctx context.Context, module string) (int, bool, error) {
	var id int
	const q = `
INSERT INTO bom (module_name)
  VALUES ($1)
    ON CONFLICT (module_name) DO NOTHING
RETURNING bom_id
`
	err := c.pool.QueryRow(ctx, q, module).Scan(&id)

	if err == nil {
		return id, true, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return 0, false, err
	}

	err = c.pool.QueryRow(ctx,
		`SELECT bom_id FROM bom WHERE module_name = $1`, module).Scan(&id)

	return id, false, err
}
