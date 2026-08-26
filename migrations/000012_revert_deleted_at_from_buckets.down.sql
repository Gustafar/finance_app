ALTER TABLE buckets ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE buckets DROP CONSTRAINT buckets_name_key;
CREATE UNIQUE INDEX buckets_name_key ON buckets (name) WHERE deleted_at IS NULL;
