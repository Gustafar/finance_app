ALTER TABLE expenses ADD COLUMN category VARCHAR(100) NULL;

UPDATE expenses e
JOIN categories c ON c.id = e.category_id
SET e.category = c.name;

ALTER TABLE expenses MODIFY category VARCHAR(100) NOT NULL;

ALTER TABLE expenses DROP FOREIGN KEY fk_expenses_category;

ALTER TABLE expenses DROP COLUMN category_id;
