CREATE TABLE subcategories (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    CONSTRAINT fk_subcategories_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT uq_subcategories_category_name UNIQUE (category_id, name)
);

ALTER TABLE expenses ADD COLUMN subcategory_id INT NULL;
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;

ALTER TABLE installment_purchases ADD COLUMN subcategory_id INT NULL;
ALTER TABLE installment_purchases ADD CONSTRAINT fk_installment_purchases_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;

ALTER TABLE recurring_expenses ADD COLUMN subcategory_id INT NULL;
ALTER TABLE recurring_expenses ADD CONSTRAINT fk_recurring_expenses_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;

-- Categorias importadas da planilha histórica (a coluna "Sub-Categoria" da planilha, na
-- verdade, é o nível amplo — vira `categories`; "Sem-Categoria" reaproveita a categoria
-- default já existente em vez de duplicá-la).
INSERT INTO categories (name, color) VALUES
    ('Ganhos', 'indigo'),
    ('Comida', 'emerald'),
    ('Cuidado Pessoal', 'orange'),
    ('Geral', 'pink'),
    ('Habitação', 'sky'),
    ('Apartamento', 'amber'),
    ('Besteira', 'violet'),
    ('Eletrônicos', 'lime'),
    ('Decoração', 'slate'),
    ('Saúde', 'indigo'),
    ('Investimento', 'emerald'),
    ('Educação', 'orange'),
    ('Transporte', 'pink'),
    ('Kombi', 'sky'),
    ('Entretenimento', 'amber'),
    ('Comunicação', 'violet');

-- Subcategorias importadas (coluna "Descrição Gasto" da planilha), vinculadas à categoria
-- correspondente pelo nome.
INSERT INTO subcategories (name, category_id)
SELECT v.name, c.id
FROM (VALUES
    ('1º Parte 13º', 'Ganhos'),
    ('2º Parte 13º', 'Ganhos'),
    ('HortiFrut', 'Comida'),
    ('Academia', 'Cuidado Pessoal'),
    ('Acessórios', 'Geral'),
    ('Açougue', 'Comida'),
    ('Adiantamento', 'Ganhos'),
    ('Ajuda Casa', 'Habitação'),
    ('Aluguel', 'Ganhos'),
    ('Apartamento', 'Apartamento'),
    ('Auto-Escola', 'Sem categoria'),
    ('Auxilio', 'Ganhos'),
    ('Bar', 'Besteira'),
    ('Bico', 'Ganhos'),
    ('Cabelereiro', 'Cuidado Pessoal'),
    ('Cafeteria', 'Comida'),
    ('Celular', 'Eletrônicos'),
    ('Cerealista', 'Comida'),
    ('Condomínio', 'Apartamento'),
    ('Construtora', 'Apartamento'),
    ('Cosméticos', 'Cuidado Pessoal'),
    ('CPFL', 'Apartamento'),
    ('Crédito', 'Sem categoria'),
    ('Decoração', 'Decoração'),
    ('Dentista', 'Saúde'),
    ('Diversão', 'Besteira'),
    ('Doce', 'Comida'),
    ('Emergência', 'Investimento'),
    ('Estudo', 'Educação'),
    ('Farmácia', 'Saúde'),
    ('Feira', 'Comida'),
    ('Férias', 'Ganhos'),
    ('Gasolina', 'Transporte'),
    ('Hamburguer', 'Comida'),
    ('Impressora 3D', 'Ganhos'),
    ('Juros de Obra', 'Apartamento'),
    ('Kombi', 'Kombi'),
    ('Made in Burguer', 'Comida'),
    ('Manutenção', 'Transporte'),
    ('Médico', 'Saúde'),
    ('Mercado', 'Comida'),
    ('Milk Shake', 'Comida'),
    ('Móveis', 'Decoração'),
    ('Musica', 'Entretenimento'),
    ('Ônibus', 'Transporte'),
    ('Outro', 'Sem categoria'),
    ('Padaria', 'Comida'),
    ('Palominha', 'Comida'),
    ('Papelaria', 'Entretenimento'),
    ('Pizza', 'Comida'),
    ('Pós-Graduação', 'Educação'),
    ('Poupança', 'Investimento'),
    ('PPR - parte 1', 'Ganhos'),
    ('PPR - parte 2', 'Ganhos'),
    ('Prestação Ape', 'Apartamento'),
    ('Restaurante', 'Comida'),
    ('Salário', 'Ganhos'),
    ('Salgado', 'Comida'),
    ('Suco', 'Comida'),
    ('Taxas', 'Sem categoria'),
    ('Telefone', 'Comunicação'),
    ('Uber', 'Transporte'),
    ('Vale', 'Ganhos'),
    ('Vestimenta', 'Cuidado Pessoal'),
    ('Viajem', 'Investimento')
) AS v(name, category_name)
JOIN categories c ON c.name = v.category_name;
