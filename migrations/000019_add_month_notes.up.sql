-- Notas livres associadas a um mês de referência (ano + mês 1-12).
-- Área separada das finanças — não gera transações em expenses.

CREATE TABLE month_notes (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    title VARCHAR(120),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_month_notes_month ON month_notes(year, month);
