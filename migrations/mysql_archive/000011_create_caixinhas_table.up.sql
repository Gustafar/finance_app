CREATE TABLE caixinhas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'slate',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO caixinhas (name, color, is_default) VALUES ('Essencial', 'indigo', TRUE);
