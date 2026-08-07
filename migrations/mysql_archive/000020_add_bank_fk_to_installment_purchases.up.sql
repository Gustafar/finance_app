ALTER TABLE installment_purchases ADD COLUMN bank_id INT NULL;

UPDATE installment_purchases SET bank_id = (
    SELECT id FROM banks WHERE is_default = TRUE LIMIT 1
);

ALTER TABLE installment_purchases MODIFY bank_id INT NOT NULL;

ALTER TABLE installment_purchases
  ADD CONSTRAINT fk_installment_purchases_bank
  FOREIGN KEY (bank_id) REFERENCES banks(id);
