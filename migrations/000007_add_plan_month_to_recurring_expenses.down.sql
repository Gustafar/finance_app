DROP INDEX IF EXISTS idx_expenses_recurring_expense_unique;

ALTER TABLE recurring_expenses ADD COLUMN last_generated_year SMALLINT NULL;
ALTER TABLE recurring_expenses ADD COLUMN last_generated_month SMALLINT NULL;

DROP INDEX IF EXISTS idx_recurring_expenses_plan_month;
ALTER TABLE recurring_expenses DROP CONSTRAINT IF EXISTS chk_recurring_expenses_plan_month;
ALTER TABLE recurring_expenses DROP COLUMN plan_year;
ALTER TABLE recurring_expenses DROP COLUMN plan_month;
