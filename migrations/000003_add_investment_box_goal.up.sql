ALTER TABLE investment_boxes
    ADD COLUMN goal_amount NUMERIC(12, 2) NULL,
    ADD COLUMN goal_month SMALLINT NULL,
    ADD COLUMN goal_year SMALLINT NULL;
