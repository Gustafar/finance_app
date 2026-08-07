ALTER TABLE expenses DROP FOREIGN KEY fk_expenses_caixinha;
ALTER TABLE installment_purchases DROP FOREIGN KEY fk_installment_purchases_caixinha;
ALTER TABLE recurring_expenses DROP FOREIGN KEY fk_recurring_expenses_caixinha;

RENAME TABLE caixinhas TO buckets;

ALTER TABLE expenses CHANGE COLUMN caixinha_id bucket_id INT NOT NULL;
ALTER TABLE installment_purchases CHANGE COLUMN caixinha_id bucket_id INT NOT NULL;
ALTER TABLE recurring_expenses CHANGE COLUMN caixinha_id bucket_id INT NOT NULL;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_bucket
  FOREIGN KEY (bucket_id) REFERENCES buckets(id);

ALTER TABLE installment_purchases
  ADD CONSTRAINT fk_installment_purchases_bucket
  FOREIGN KEY (bucket_id) REFERENCES buckets(id);

ALTER TABLE recurring_expenses
  ADD CONSTRAINT fk_recurring_expenses_bucket
  FOREIGN KEY (bucket_id) REFERENCES buckets(id);
