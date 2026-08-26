ALTER TABLE subcategories ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE subcategories DROP CONSTRAINT uq_subcategories_category_name;
CREATE UNIQUE INDEX uq_subcategories_category_name ON subcategories (category_id, name) WHERE deleted_at IS NULL;
