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
	query := "INSERT INTO payment_methods (name, color) VALUES (?, ?)"

	result, err := r.DB.Exec(query, paymentMethod.Name, paymentMethod.Color)
	if err != nil {
		return models.PaymentMethod{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.PaymentMethod{}, err
	}

	paymentMethod.ID = int(id)
	return paymentMethod, nil
}

func (r *PaymentMethodRepository) GetByID(id int) (models.PaymentMethod, error) {
	query := "SELECT id, name, color, is_default FROM payment_methods WHERE id = ?"

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
	query := "UPDATE payment_methods SET name = ?, color = ? WHERE id = ?"

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

// Delete removes a payment method after reassigning any expenses that
// reference it to the first protected default (ordered by id, deterministic
// since multiple payment methods can be marked default), so deleting one
// never orphans expense data.
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

	if _, err := tx.Exec("UPDATE expenses SET payment_method_id = ? WHERE payment_method_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE installment_purchases SET payment_method_id = ? WHERE payment_method_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE recurring_expenses SET payment_method_id = ? WHERE payment_method_id = ?", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM payment_methods WHERE id = ?", id)
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
