ALTER TABLE expenses
  ADD COLUMN installment_purchase_id INT NULL AFTER type,
  ADD COLUMN installment_number SMALLINT NULL AFTER installment_purchase_id;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_installment_purchase
  FOREIGN KEY (installment_purchase_id) REFERENCES installment_purchases(id);

CREATE INDEX idx_expenses_installment_purchase ON expenses(installment_purchase_id);
