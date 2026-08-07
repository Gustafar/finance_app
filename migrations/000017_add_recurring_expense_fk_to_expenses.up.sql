ALTER TABLE expenses
  ADD COLUMN recurring_expense_id INT NULL AFTER installment_number;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_recurring_expense
  FOREIGN KEY (recurring_expense_id) REFERENCES recurring_expenses(id)
  ON DELETE SET NULL;

CREATE INDEX idx_expenses_recurring_expense ON expenses(recurring_expense_id);
