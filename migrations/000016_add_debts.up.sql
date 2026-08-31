-- Cobrança de dívidas: dinheiro que outras pessoas devem para nós (receivable)
-- ou que devemos para elas (payable), com histórico de pagamentos parciais.
-- Área separada das finanças — não gera transações em expenses.

CREATE TABLE debts (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('receivable', 'payable')),
    counterparty_name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    incurred_on TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE debt_payments (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    debt_id INT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    paid_on TIMESTAMPTZ NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_debt_payments_debt ON debt_payments(debt_id);
