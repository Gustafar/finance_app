-- Fresh Postgres schema history. The MySQL migration history that got the
-- app to this exact schema lives in migrations/mysql_archive/ for reference;
-- it is not meant to be replayed.

CREATE TABLE categories (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'slate',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE people (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'slate',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE payment_methods (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'slate',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE buckets (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'slate',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE banks (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'slate',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE investment_boxes (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'slate',
    is_default BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE installment_purchases (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    purchase_date TIMESTAMPTZ NOT NULL,
    installment_count SMALLINT NOT NULL,
    category_id INT NOT NULL,
    person_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    bucket_id INT NOT NULL,
    bank_id INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_installment_purchases_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_installment_purchases_person FOREIGN KEY (person_id) REFERENCES people(id),
    CONSTRAINT fk_installment_purchases_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    CONSTRAINT fk_installment_purchases_bucket FOREIGN KEY (bucket_id) REFERENCES buckets(id),
    CONSTRAINT fk_installment_purchases_bank FOREIGN KEY (bank_id) REFERENCES banks(id)
);

CREATE TABLE recurring_expenses (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'investment')),
    day_of_month SMALLINT NOT NULL,
    category_id INT NOT NULL,
    person_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    bucket_id INT NOT NULL,
    bank_id INT NOT NULL,
    last_generated_year SMALLINT NULL,
    last_generated_month SMALLINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_recurring_expenses_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_recurring_expenses_person FOREIGN KEY (person_id) REFERENCES people(id),
    CONSTRAINT fk_recurring_expenses_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    CONSTRAINT fk_recurring_expenses_bucket FOREIGN KEY (bucket_id) REFERENCES buckets(id),
    CONSTRAINT fk_recurring_expenses_bank FOREIGN KEY (bank_id) REFERENCES banks(id)
);

CREATE TABLE expenses (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category_id INT NOT NULL,
    person_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    bucket_id INT NOT NULL,
    bank_id INT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense', 'investment')),
    date TIMESTAMPTZ NOT NULL,
    installment_purchase_id INT NULL,
    installment_number SMALLINT NULL,
    recurring_expense_id INT NULL,
    investment_box_id INT NULL,
    CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_expenses_person FOREIGN KEY (person_id) REFERENCES people(id),
    CONSTRAINT fk_expenses_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    CONSTRAINT fk_expenses_bucket FOREIGN KEY (bucket_id) REFERENCES buckets(id),
    CONSTRAINT fk_expenses_bank FOREIGN KEY (bank_id) REFERENCES banks(id),
    CONSTRAINT fk_expenses_installment_purchase FOREIGN KEY (installment_purchase_id) REFERENCES installment_purchases(id),
    CONSTRAINT fk_expenses_recurring_expense FOREIGN KEY (recurring_expense_id) REFERENCES recurring_expenses(id) ON DELETE SET NULL,
    CONSTRAINT fk_expenses_investment_box FOREIGN KEY (investment_box_id) REFERENCES investment_boxes(id)
);

CREATE INDEX idx_expenses_installment_purchase ON expenses(installment_purchase_id);
CREATE INDEX idx_expenses_recurring_expense ON expenses(recurring_expense_id);

INSERT INTO categories (name, color, is_default) VALUES ('Sem categoria', 'slate', TRUE);
INSERT INTO people (name, color, is_default) VALUES ('Casal', 'slate', TRUE);
INSERT INTO payment_methods (name, color, is_default) VALUES
    ('Pix', 'emerald', TRUE),
    ('Crédito', 'violet', TRUE),
    ('Débito', 'sky', TRUE),
    ('Dinheiro', 'amber', TRUE);
INSERT INTO buckets (name, color, is_default) VALUES ('Essencial', 'indigo', TRUE);
INSERT INTO banks (name, color, is_default) VALUES ('Outros', 'slate', TRUE);
INSERT INTO investment_boxes (name, color, is_default) VALUES ('Outros', 'slate', TRUE);
