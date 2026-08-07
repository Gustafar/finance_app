ALTER TABLE expenses
  ADD COLUMN type ENUM('income', 'expense', 'investment') NOT NULL DEFAULT 'expense' AFTER caixinha_id;
