ALTER TABLE expenses ADD COLUMN payment_method_id INT NULL;

UPDATE expenses SET payment_method_id = (
    SELECT id FROM payment_methods WHERE is_default = TRUE ORDER BY id LIMIT 1
);

ALTER TABLE expenses MODIFY payment_method_id INT NOT NULL;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_payment_method
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id);
