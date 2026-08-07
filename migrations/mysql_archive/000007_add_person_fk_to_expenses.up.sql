ALTER TABLE expenses ADD COLUMN person_id INT NULL;

UPDATE expenses SET person_id = (SELECT id FROM people WHERE is_default = TRUE LIMIT 1);

ALTER TABLE expenses MODIFY person_id INT NOT NULL;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_person
  FOREIGN KEY (person_id) REFERENCES people(id);
