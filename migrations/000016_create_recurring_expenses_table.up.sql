CREATE TABLE recurring_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('income', 'expense', 'investment') NOT NULL,
    day_of_month SMALLINT NOT NULL,
    category_id INT NOT NULL,
    person_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    caixinha_id INT NOT NULL,
    last_generated_year SMALLINT NULL,
    last_generated_month SMALLINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recurring_expenses_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_recurring_expenses_person FOREIGN KEY (person_id) REFERENCES people(id),
    CONSTRAINT fk_recurring_expenses_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    CONSTRAINT fk_recurring_expenses_caixinha FOREIGN KEY (caixinha_id) REFERENCES caixinhas(id)
);
