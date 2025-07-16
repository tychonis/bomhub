CREATE TABLE IF NOT EXISTS bom (
    bom_id SERIAL PRIMARY KEY,
    name TEXT,
    repo TEXT,
    bpc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
