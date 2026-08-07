ALTER TABLE expenses ADD COLUMN investment_box_id INT NULL;

UPDATE expenses SET investment_box_id = (
    SELECT id FROM investment_boxes WHERE is_default = TRUE LIMIT 1
) WHERE type = 'investment';

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_investment_box
  FOREIGN KEY (investment_box_id) REFERENCES investment_boxes(id);
