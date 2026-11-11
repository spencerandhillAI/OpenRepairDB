CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS manufacturers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sources (
  id BIGSERIAL PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  canonical_url TEXT,
  author_or_rightsholder TEXT,
  licence_id TEXT,
  licence_url TEXT,
  attribution_text TEXT,
  permitted_use TEXT NOT NULL DEFAULT 'unknown'
    CHECK (permitted_use IN ('link_only','metadata_only','redistribution_allowed','permission_required','unknown')),
  retrieved_at TIMESTAMPTZ,
  notes TEXT,
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
  source_id BIGINT REFERENCES sources(id),
  identifier_type TEXT NOT NULL,
  value_original TEXT NOT NULL,
  value_normalized TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','reported','verified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boards (
  id BIGSERIAL PRIMARY KEY,
  manufacturer_id BIGINT REFERENCES manufacturers(id),
  board_identifier_original TEXT NOT NULL,
  board_identifier_normalized TEXT NOT NULL,
  board_type TEXT,
  revision TEXT,
  notes TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS components (
  id BIGSERIAL PRIMARY KEY,
  manufacturer_id BIGINT REFERENCES manufacturers(id),
  part_number_original TEXT,
  part_number_normalized TEXT,
  marking TEXT,
  component_type TEXT,
  description TEXT,
  datasheet_source_id BIGINT REFERENCES sources(id),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_boards (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'installed_in',
  source_id BIGINT REFERENCES sources(id),
  confidence NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected')),
  UNIQUE (device_id, board_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS board_components (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  component_id BIGINT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  designator TEXT,
  quantity INTEGER CHECK (quantity IS NULL OR quantity > 0),
  source_id BIGINT REFERENCES sources(id),
  confidence NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected'))
);

CREATE TABLE IF NOT EXISTS repair_cases (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT REFERENCES devices(id),
  board_id BIGINT REFERENCES boards(id),
  source_id BIGINT REFERENCES sources(id),
  title TEXT NOT NULL,
  symptoms TEXT,
  fault_code TEXT,
  diagnosis TEXT,
  measurements JSONB NOT NULL DEFAULT '[]'::jsonb,
  repair_actions TEXT,
  parts_used TEXT,
  tools_used TEXT,
  outcome TEXT,
  safety_notes TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','reported','verified')),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_search_text_trgm
  ON devices USING GIN (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_devices_model_trgm
  ON devices USING GIN (canonical_model_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_device_identifiers_normalized
  ON device_identifiers (value_normalized);
CREATE INDEX IF NOT EXISTS idx_boards_identifier_trgm
  ON boards USING GIN (board_identifier_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_components_part_number
  ON components (part_number_normalized);
CREATE INDEX IF NOT EXISTS idx_components_marking_trgm
  ON components USING GIN (marking gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_repair_cases_fault_code
  ON repair_cases (fault_code);
