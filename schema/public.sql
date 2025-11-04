CREATE TABLE IF NOT EXISTS bom (
    bom_id SERIAL PRIMARY KEY,
    name TEXT,
    repo TEXT,
    bpc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item (
    item_id SERIAL PRIMARY KEY,
    item_uuid UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity (
    activity_id SERIAL PRIMARY KEY,
    email TEXT,
    path TEXT,
    activity_time TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS object (
    object_id SERIAL PRIMARY KEY,
    object_digest BYTEA,
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_object_digest_unique ON object(object_digest);

CREATE TABLE IF NOT EXISTS index (
    index_id SERIAL PRIMARY KEY,
    bom_id INT REFERENCES bom(bom_id),
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bom_index ON index(bom_id);

CREATE TABLE IF NOT EXISTS root (
    root_id SERIAL PRIMARY KEY,
    bom_id INT REFERENCES bom(bom_id),
    root_digest BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS root_index ON root(bom_id);
