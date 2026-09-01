-- Parcelamento de dívidas: uma dívida parcelada vira N linhas em debts, uma por mês,
-- ligadas por installment_group_id (valor da sequência abaixo). Cada parcela é quitada
-- e editada como uma dívida comum.

CREATE SEQUENCE IF NOT EXISTS debt_installment_group_seq;

ALTER TABLE debts ADD COLUMN installment_group_id INT;
ALTER TABLE debts ADD COLUMN installment_number INT;
ALTER TABLE debts ADD COLUMN installment_count INT;

CREATE INDEX idx_debts_installment_group ON debts(installment_group_id);
