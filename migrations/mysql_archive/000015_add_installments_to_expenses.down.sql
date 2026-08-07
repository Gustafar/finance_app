ALTER TABLE expenses DROP FOREIGN KEY fk_expenses_installment_purchase;

ALTER TABLE expenses DROP COLUMN installment_number;
ALTER TABLE expenses DROP COLUMN installment_purchase_id;
