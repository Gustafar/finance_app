package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type PaymentMethodRepository struct {
	DB *sql.DB
}

func NewPaymentMethodRepository(db *sql.DB) *PaymentMethodRepository {
	return &PaymentMethodRepository{DB: db}
}

func (r *PaymentMethodRepository) Create(paymentMethod models.PaymentMethod) (models.PaymentMethod, error) {
	query := "INSERT INTO payment_methods (name, color) VALUES ($1, $2) RETURNING id"

	err := r.DB.QueryRow(query, paymentMethod.Name, paymentMethod.Color).Scan(&paymentMethod.ID)
	if err != nil {
		return models.PaymentMethod{}, err
	}

	return paymentMethod, nil
}

func (r *PaymentMethodRepository) GetByID(id int) (models.PaymentMethod, error) {
	query := "SELECT id, name, color, is_default FROM payment_methods WHERE id = $1"

	var paymentMethod models.PaymentMethod
	err := r.DB.QueryRow(query, id).Scan(&paymentMethod.ID, &paymentMethod.Name, &paymentMethod.Color, &paymentMethod.IsDefault)
	if err != nil {
		return models.PaymentMethod{}, err
	}

	return paymentMethod, nil
}

func (r *PaymentMethodRepository) GetAll() ([]models.PaymentMethod, error) {
	query := "SELECT id, name, color, is_default FROM payment_methods ORDER BY name"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	paymentMethods := []models.PaymentMethod{}

	for rows.Next() {
		var paymentMethod models.PaymentMethod

		err := rows.Scan(&paymentMethod.ID, &paymentMethod.Name, &paymentMethod.Color, &paymentMethod.IsDefault)
		if err != nil {
			return nil, err
		}

		paymentMethods = append(paymentMethods, paymentMethod)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return paymentMethods, nil
}

func (r *PaymentMethodRepository) Update(id int, paymentMethod models.PaymentMethod) (models.PaymentMethod, error) {
	query := "UPDATE payment_methods SET name = $1, color = $2 WHERE id = $3"

	result, err := r.DB.Exec(query, paymentMethod.Name, paymentMethod.Color, id)
	if err != nil {
		return models.PaymentMethod{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.PaymentMethod{}, err
	}

	if rowsAffected == 0 {
		return models.PaymentMethod{}, sql.ErrNoRows
	}

	paymentMethod.ID = id
	return paymentMethod, nil
}

// Delete reassigns referencing expenses to the first default (by id, since several can be marked default).
func (r *PaymentMethodRepository) Delete(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var defaultID int
	err = tx.QueryRow("SELECT id FROM payment_methods WHERE is_default = TRUE ORDER BY id LIMIT 1").Scan(&defaultID)
	if err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE expenses SET payment_method_id = $1 WHERE payment_method_id = $2", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE installment_purchases SET payment_method_id = $1 WHERE payment_method_id = $2", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE recurring_expenses SET payment_method_id = $1 WHERE payment_method_id = $2", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM payment_methods WHERE id = $1", id)
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
