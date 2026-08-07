INSERT INTO categories (name)
SELECT DISTINCT category FROM expenses
WHERE category NOT IN (SELECT name FROM categories);

ALTER TABLE expenses ADD COLUMN category_id INT NULL;

UPDATE expenses e
JOIN categories c ON c.name = e.category
SET e.category_id = c.id;

ALTER TABLE expenses MODIFY category_id INT NOT NULL;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_category
  FOREIGN KEY (category_id) REFERENCES categories(id);

ALTER TABLE expenses DROP COLUMN category;
