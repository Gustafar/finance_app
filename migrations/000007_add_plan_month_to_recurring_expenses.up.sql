ALTER TABLE recurring_expenses ADD COLUMN plan_year SMALLINT;
ALTER TABLE recurring_expenses ADD COLUMN plan_month SMALLINT;

-- One-time data migration: every existing rule becomes the plan for the current month
-- at the time this feature ships. Hardcoded literals, not now(), so the migration stays
-- deterministic no matter when it actually runs.
UPDATE recurring_expenses SET plan_year = 2026, plan_month = 8 WHERE plan_year IS NULL;

ALTER TABLE recurring_expenses ALTER COLUMN plan_year SET NOT NULL;
ALTER TABLE recurring_expenses ALTER COLUMN plan_month SET NOT NULL;
ALTER TABLE recurring_expenses ADD CONSTRAINT chk_recurring_expenses_plan_month CHECK (plan_month BETWEEN 1 AND 12);

CREATE INDEX idx_recurring_expenses_plan_month ON recurring_expenses(plan_year, plan_month);

ALTER TABLE recurring_expenses DROP COLUMN last_generated_year;
ALTER TABLE recurring_expenses DROP COLUMN last_generated_month;

-- Historical backfill (being removed by this migration) could link many expenses, across many
-- months, to the same recurring_expenses row. Going forward the link is at most 1:1, so keep only
-- the most recent expense per rule and unlink the rest (the expenses themselves are untouched,
-- they just stop being tagged as "Fixo").
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY recurring_expense_id ORDER BY date DESC, id DESC) AS rn
    FROM expenses
    WHERE recurring_expense_id IS NOT NULL
)
UPDATE expenses e SET recurring_expense_id = NULL
FROM ranked r WHERE e.id = r.id AND r.rn > 1;

-- At most one generated expense per plan row now that generation is immediate rather than a
-- multi-month backfill.
CREATE UNIQUE INDEX idx_expenses_recurring_expense_unique
    ON expenses(recurring_expense_id) WHERE recurring_expense_id IS NOT NULL;
