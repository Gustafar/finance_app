ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE categories DROP CONSTRAINT categories_name_key;
CREATE UNIQUE INDEX categories_name_key ON categories (name) WHERE deleted_at IS NULL;
