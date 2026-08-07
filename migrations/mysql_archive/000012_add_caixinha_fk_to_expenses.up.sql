ALTER TABLE expenses ADD COLUMN caixinha_id INT NULL;

UPDATE expenses SET caixinha_id = (
    SELECT id FROM caixinhas WHERE is_default = TRUE LIMIT 1
);

ALTER TABLE expenses MODIFY caixinha_id INT NOT NULL;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_caixinha
  FOREIGN KEY (caixinha_id) REFERENCES caixinhas(id);
