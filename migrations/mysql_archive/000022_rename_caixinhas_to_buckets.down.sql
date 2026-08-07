ALTER TABLE expenses DROP FOREIGN KEY fk_expenses_bucket;
ALTER TABLE installment_purchases DROP FOREIGN KEY fk_installment_purchases_bucket;
ALTER TABLE recurring_expenses DROP FOREIGN KEY fk_recurring_expenses_bucket;

ALTER TABLE expenses CHANGE COLUMN bucket_id caixinha_id INT NOT NULL;
ALTER TABLE installment_purchases CHANGE COLUMN bucket_id caixinha_id INT NOT NULL;
ALTER TABLE recurring_expenses CHANGE COLUMN bucket_id caixinha_id INT NOT NULL;

RENAME TABLE buckets TO caixinhas;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_caixinha
  FOREIGN KEY (caixinha_id) REFERENCES caixinhas(id);

ALTER TABLE installment_purchases
  ADD CONSTRAINT fk_installment_purchases_caixinha
  FOREIGN KEY (caixinha_id) REFERENCES caixinhas(id);

ALTER TABLE recurring_expenses
  ADD CONSTRAINT fk_recurring_expenses_caixinha
  FOREIGN KEY (caixinha_id) REFERENCES caixinhas(id);
