ALTER TABLE categories ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO categories (name, is_default) VALUES ('Sem categoria', TRUE);
