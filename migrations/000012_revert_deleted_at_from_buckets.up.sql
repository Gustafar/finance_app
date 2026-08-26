DROP INDEX buckets_name_key;
ALTER TABLE buckets ADD CONSTRAINT buckets_name_key UNIQUE (name);

ALTER TABLE buckets DROP COLUMN deleted_at;
