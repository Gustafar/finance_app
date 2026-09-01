DROP INDEX IF EXISTS idx_debts_installment_group;
ALTER TABLE debts DROP COLUMN IF EXISTS installment_count;
ALTER TABLE debts DROP COLUMN IF EXISTS installment_number;
ALTER TABLE debts DROP COLUMN IF EXISTS installment_group_id;
DROP SEQUENCE IF EXISTS debt_installment_group_seq;
