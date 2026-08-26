ALTER TABLE investment_boxes ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE investment_boxes DROP CONSTRAINT investment_boxes_name_key;
CREATE UNIQUE INDEX investment_boxes_name_key ON investment_boxes (name) WHERE deleted_at IS NULL;
