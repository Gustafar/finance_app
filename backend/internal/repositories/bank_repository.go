package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type BankRepository struct {
	DB *sql.DB
}

func NewBankRepository(db *sql.DB) *BankRepository {
	return &BankRepository{DB: db}
}

func (r *BankRepository) Create(bank models.Bank) (models.Bank, error) {
	query := "INSERT INTO banks (name, color) VALUES (?, ?)"

	result, err := r.DB.Exec(query, bank.Name, bank.Color)
	if err != nil {
		return models.Bank{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.Bank{}, err
	}

	bank.ID = int(id)
	return bank, nil
}

func (r *BankRepository) GetByID(id int) (models.Bank, error) {
	query := "SELECT id, name, color, is_default FROM banks WHERE id = ?"

	var bank models.Bank
	err := r.DB.QueryRow(query, id).Scan(&bank.ID, &bank.Name, &bank.Color, &bank.IsDefault)
	if err != nil {
		return models.Bank{}, err
	}

	return bank, nil
}

func (r *BankRepository) GetAll() ([]models.Bank, error) {
	query := "SELECT id, name, color, is_default FROM banks ORDER BY name"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	banks := []models.Bank{}

	for rows.Next() {
		var bank models.Bank

		err := rows.Scan(&bank.ID, &bank.Name, &bank.Color, &bank.IsDefault)
		if err != nil {
			return nil, err
		}

		banks = append(banks, bank)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return banks, nil
}

func (r *BankRepository) Update(id int, bank models.Bank) (models.Bank, error) {
	query := "UPDATE banks SET name = ?, color = ? WHERE id = ?"

	result, err := r.DB.Exec(query, bank.Name, bank.Color, id)
	if err != nil {
		return models.Bank{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Bank{}, err
	}

	if rowsAffected == 0 {
		return models.Bank{}, sql.ErrNoRows
	}

	bank.ID = id
	return bank, nil
}

// Delete reassigns referencing expenses to the default bank first, so deleting never orphans data.
func (r *BankRepository) Delete(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var defaultID int
	err = tx.QueryRow("SELECT id FROM banks WHERE is_default = TRUE LIMIT 1").Scan(&defaultID)
	if err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE expenses SET bank_id = ? WHERE bank_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE installment_purchases SET bank_id = ? WHERE bank_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE recurring_expenses SET bank_id = ? WHERE bank_id = ?", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM banks WHERE id = ?", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return tx.Commit()
}
