DROP INDEX investment_boxes_name_key;
ALTER TABLE investment_boxes ADD CONSTRAINT investment_boxes_name_key UNIQUE (name);

ALTER TABLE investment_boxes DROP COLUMN deleted_at;
