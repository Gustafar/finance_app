CREATE TABLE payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'slate',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO payment_methods (name, color, is_default) VALUES
    ('Pix', 'emerald', TRUE),
    ('Crédito', 'violet', TRUE),
    ('Débito', 'sky', TRUE),
    ('Dinheiro', 'amber', TRUE);
