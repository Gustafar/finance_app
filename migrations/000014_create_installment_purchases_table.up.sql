CREATE TABLE installment_purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    purchase_date DATETIME NOT NULL,
    installment_count SMALLINT NOT NULL,
    category_id INT NOT NULL,
    person_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    caixinha_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_installment_purchases_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_installment_purchases_person FOREIGN KEY (person_id) REFERENCES people(id),
    CONSTRAINT fk_installment_purchases_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    CONSTRAINT fk_installment_purchases_caixinha FOREIGN KEY (caixinha_id) REFERENCES caixinhas(id)
);
