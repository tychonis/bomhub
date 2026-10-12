package db

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tychonis/cyanotype/core/catalog"
	"github.com/tychonis/cyanotype/model"
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
}

func (c *Client) GetBOMItems(ctx context.Context) ([]*BOMItem, error) {
	q := `
SELECT
	bom_id,
	COALESCE(summary->>'name', 'unknown'),
	COALESCE(summary->>'repo', 'unknown')
FROM bom
WHERE active = true;
`
	rows, err := c.pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (*BOMItem, error) {
		var item BOMItem
		err := row.Scan(&item.ID, &item.Name, &item.Repo)
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

func (c *Client) SaveMetadata(ctx context.Context, bom_id int, digest []byte, content any) (json.RawMessage, error) {
	body, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}

	const q = `
INSERT INTO metadata (bom_id, definition_id, content)
SELECT $1, d.definition_id, val.content
FROM (VALUES ($2::bytea, $3::jsonb)) AS val(digest, content)
	LEFT JOIN definition d
    ON val.digest = d.symbol_digest
ON CONFLICT (bom_id, definition_id)
DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = now()
RETURNING content;
`

	var ret json.RawMessage
	err = c.pool.QueryRow(ctx, q, bom_id, digest, body).
		Scan(&ret)
	if err != nil {
		return nil, err
	}

	return ret, nil
}

func (c *Client) GetMetadata(ctx context.Context, bomID int, digest []byte) (json.RawMessage, error) {
	const q = `
SELECT m.content
FROM metadata m
  LEFT JOIN definition d
    ON m.definition_id = d.definition_id
WHERE m.bom_id = $1 AND d.symbol_digest = $2;
`
	var raw json.RawMessage
	err := c.pool.QueryRow(ctx, q, bomID, digest).Scan(&raw)
	return raw, err
}

func (c *Client) GetRepresentation(ctx context.Context, item []byte, typ string) ([]byte, error) {
	const q = `
SELECT object_digest
FROM representation r
WHERE r.symbol_digest = $1 AND r.type = $2;
`
	var thumbnailDigest []byte
	err := c.pool.QueryRow(ctx, q, item, typ).Scan(&thumbnailDigest)
	return thumbnailDigest, err
}

func (c *Client) SaveRepresentation(ctx context.Context, item []byte, objectDigest []byte, typ string) error {
	const q = `
INSERT INTO representation (symbol_digest, type, object_digest)
VALUES ($1, $2, $3)
ON CONFLICT (symbol_digest, type)
DO UPDATE SET
    object_digest = EXCLUDED.object_digest,
    updated_at = now();
`
	_, err := c.pool.Exec(ctx, q, item, typ, objectDigest)
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

type SearchResult struct {
	BOM     int                  `json:"bom_id"`
	Digest  model.Digest         `json:"digest"`
	Content model.ConcreteSymbol `json:"content"`
}

func (c *Client) Search(ctx context.Context, query string) ([]*SearchResult, error) {
	const q = `
SELECT bom_id, encode(symbol_digest, 'hex') AS digest, d.content
FROM definition d
  LEFT JOIN metadata m
    ON d.definition_id = m.definition_id
WHERE d.content->'content'->>'name' ILIKE '%' || $1 || '%'
   OR encode(symbol_digest, 'hex') ILIKE '%' || $1 || '%'
LIMIT 11;
`
	rows, err := c.pool.Query(ctx, q, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*SearchResult
	for rows.Next() {
		var bomID int
		var digestHex string
		var content []byte
		err := rows.Scan(&bomID, &digestHex, &content)
		if err != nil {
			return nil, err
		}
		result, err := catalog.DeserializeSymbol("", digestHex, content)
		if err != nil {
			return nil, err
		}
		results = append(results, &SearchResult{
			BOM:     bomID,
			Digest:  digestHex,
			Content: result,
		})
	}
	return results, nil
}
