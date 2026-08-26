DROP INDEX categories_name_key;
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);

ALTER TABLE categories DROP COLUMN deleted_at;
