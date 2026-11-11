CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS manufacturers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  manufacturer_id BIGINT REFERENCES manufacturers(id),
  canonical_model_name TEXT NOT NULL,
  product_category TEXT,
  description TEXT,
  search_text TEXT GENERATED ALWAYS AS (
    lower(coalesce(canonical_model_name,'') || ' ' || coalesce(product_category,'') || ' ' || coalesce(description,''))
  ) STORED,
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_identifiers (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  identifier_type TEXT NOT NULL,
  value_original TEXT NOT NULL,
  value_normalized TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','reported','verified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_search_text_trgm
  ON devices USING GIN (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_devices_model_trgm
  ON devices USING GIN (canonical_model_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_device_identifiers_normalized
  ON device_identifiers (value_normalized);
