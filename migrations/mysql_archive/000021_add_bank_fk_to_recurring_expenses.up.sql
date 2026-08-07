ALTER TABLE recurring_expenses ADD COLUMN bank_id INT NULL;

UPDATE recurring_expenses SET bank_id = (
    SELECT id FROM banks WHERE is_default = TRUE LIMIT 1
);

ALTER TABLE recurring_expenses MODIFY bank_id INT NOT NULL;

ALTER TABLE recurring_expenses
  ADD CONSTRAINT fk_recurring_expenses_bank
  FOREIGN KEY (bank_id) REFERENCES banks(id);
