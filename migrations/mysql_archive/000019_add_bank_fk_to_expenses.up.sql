ALTER TABLE expenses ADD COLUMN bank_id INT NULL;

UPDATE expenses SET bank_id = (
    SELECT id FROM banks WHERE is_default = TRUE LIMIT 1
);

ALTER TABLE expenses MODIFY bank_id INT NOT NULL;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_bank
  FOREIGN KEY (bank_id) REFERENCES banks(id);
