ALTER TABLE recurring_expenses DROP CONSTRAINT fk_recurring_expenses_subcategory;
ALTER TABLE recurring_expenses DROP COLUMN subcategory_id;

ALTER TABLE installment_purchases DROP CONSTRAINT fk_installment_purchases_subcategory;
ALTER TABLE installment_purchases DROP COLUMN subcategory_id;

ALTER TABLE expenses DROP CONSTRAINT fk_expenses_subcategory;
ALTER TABLE expenses DROP COLUMN subcategory_id;

DROP TABLE subcategories;
