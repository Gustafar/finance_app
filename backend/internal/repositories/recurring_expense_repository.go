package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type RecurringExpenseRepository struct {
	DB *sql.DB
}

func NewRecurringExpenseRepository(db *sql.DB) *RecurringExpenseRepository {
	return &RecurringExpenseRepository{DB: db}
}

const selectRecurringExpenseQuery = `
	SELECT id, description, amount, type, day_of_month, category_id, person_id, payment_method_id, caixinha_id, bank_id,
	       last_generated_year, last_generated_month, created_at
	FROM recurring_expenses
`

func scanRecurringExpense(row interface{ Scan(...any) error }) (models.RecurringExpense, error) {
	var recurring models.RecurringExpense
	err := row.Scan(
		&recurring.ID, &recurring.Description, &recurring.Amount, &recurring.Type, &recurring.DayOfMonth,
		&recurring.CategoryID, &recurring.PersonID, &recurring.PaymentMethodID, &recurring.CaixinhaID, &recurring.BankID,
		&recurring.LastGeneratedYear, &recurring.LastGeneratedMonth, &recurring.CreatedAt,
	)
	return recurring, err
}

func (r *RecurringExpenseRepository) Create(recurring models.RecurringExpense) (models.RecurringExpense, error) {
	query := `INSERT INTO recurring_expenses (description, amount, type, day_of_month, category_id, person_id, payment_method_id, caixinha_id, bank_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	result, err := r.DB.Exec(
		query, recurring.Description, recurring.Amount, recurring.Type, recurring.DayOfMonth,
		recurring.CategoryID, recurring.PersonID, recurring.PaymentMethodID, recurring.CaixinhaID, recurring.BankID,
	)
	if err != nil {
		return models.RecurringExpense{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.RecurringExpense{}, err
	}

	return r.GetByID(int(id))
}

func (r *RecurringExpenseRepository) GetByID(id int) (models.RecurringExpense, error) {
	query := selectRecurringExpenseQuery + " WHERE id = ?"

	recurring, err := scanRecurringExpense(r.DB.QueryRow(query, id))
	if err != nil {
		return models.RecurringExpense{}, err
	}

	return recurring, nil
}

func (r *RecurringExpenseRepository) GetAll() ([]models.RecurringExpense, error) {
	query := selectRecurringExpenseQuery + " ORDER BY day_of_month, description"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	recurrences := []models.RecurringExpense{}

	for rows.Next() {
		recurring, err := scanRecurringExpense(rows)
		if err != nil {
			return nil, err
		}

		recurrences = append(recurrences, recurring)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return recurrences, nil
}

func (r *RecurringExpenseRepository) Update(id int, recurring models.RecurringExpense) (models.RecurringExpense, error) {
	query := `UPDATE recurring_expenses
		SET description = ?, amount = ?, type = ?, day_of_month = ?, category_id = ?, person_id = ?, payment_method_id = ?, caixinha_id = ?, bank_id = ?
		WHERE id = ?`

	_, err := r.DB.Exec(
		query, recurring.Description, recurring.Amount, recurring.Type, recurring.DayOfMonth,
		recurring.CategoryID, recurring.PersonID, recurring.PaymentMethodID, recurring.CaixinhaID, recurring.BankID, id,
	)
	if err != nil {
		return models.RecurringExpense{}, err
	}

	return r.GetByID(id)
}

func (r *RecurringExpenseRepository) Delete(id int) error {
	result, err := r.DB.Exec("DELETE FROM recurring_expenses WHERE id = ?", id)
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

	return nil
}

func (r *RecurringExpenseRepository) MarkGenerated(id, year, month int) error {
	_, err := r.DB.Exec("UPDATE recurring_expenses SET last_generated_year = ?, last_generated_month = ? WHERE id = ?", year, month, id)
	return err
}
