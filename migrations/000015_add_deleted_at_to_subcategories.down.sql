DROP INDEX uq_subcategories_category_name;
ALTER TABLE subcategories ADD CONSTRAINT uq_subcategories_category_name UNIQUE (category_id, name);

ALTER TABLE subcategories DROP COLUMN deleted_at;
