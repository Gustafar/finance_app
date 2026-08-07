CREATE TABLE banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'slate',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO banks (name, color, is_default) VALUES ('Outros', 'slate', TRUE);
