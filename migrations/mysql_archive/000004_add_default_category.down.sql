DELETE FROM categories WHERE is_default = TRUE;

ALTER TABLE categories DROP COLUMN is_default;
