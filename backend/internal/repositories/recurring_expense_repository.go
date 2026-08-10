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
	SELECT id, description, amount, type, day_of_month, category_id, subcategory_id, person_id, payment_method_id, bucket_id, bank_id,
	       last_generated_year, last_generated_month, created_at
	FROM recurring_expenses
`

func scanRecurringExpense(row interface{ Scan(...any) error }) (models.RecurringExpense, error) {
	var recurring models.RecurringExpense
	err := row.Scan(
		&recurring.ID, &recurring.Description, &recurring.Amount, &recurring.Type, &recurring.DayOfMonth,
		&recurring.CategoryID, &recurring.SubcategoryID, &recurring.PersonID, &recurring.PaymentMethodID, &recurring.BucketID, &recurring.BankID,
		&recurring.LastGeneratedYear, &recurring.LastGeneratedMonth, &recurring.CreatedAt,
	)
	return recurring, err
}

func (r *RecurringExpenseRepository) Create(recurring models.RecurringExpense) (models.RecurringExpense, error) {
	query := `INSERT INTO recurring_expenses (description, amount, type, day_of_month, category_id, subcategory_id, person_id, payment_method_id, bucket_id, bank_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`

	var id int
	err := r.DB.QueryRow(
		query, recurring.Description, recurring.Amount, recurring.Type, recurring.DayOfMonth,
		recurring.CategoryID, recurring.SubcategoryID, recurring.PersonID, recurring.PaymentMethodID, recurring.BucketID, recurring.BankID,
	).Scan(&id)
	if err != nil {
		return models.RecurringExpense{}, err
	}

	return r.GetByID(id)
}

func (r *RecurringExpenseRepository) GetByID(id int) (models.RecurringExpense, error) {
	query := selectRecurringExpenseQuery + " WHERE id = $1"

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
		SET description = $1, amount = $2, type = $3, day_of_month = $4, category_id = $5, subcategory_id = $6, person_id = $7, payment_method_id = $8, bucket_id = $9, bank_id = $10
		WHERE id = $11`

	_, err := r.DB.Exec(
		query, recurring.Description, recurring.Amount, recurring.Type, recurring.DayOfMonth,
		recurring.CategoryID, recurring.SubcategoryID, recurring.PersonID, recurring.PaymentMethodID, recurring.BucketID, recurring.BankID, id,
	)
	if err != nil {
		return models.RecurringExpense{}, err
	}

	return r.GetByID(id)
}

func (r *RecurringExpenseRepository) Delete(id int) error {
	result, err := r.DB.Exec("DELETE FROM recurring_expenses WHERE id = $1", id)
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
	_, err := r.DB.Exec("UPDATE recurring_expenses SET last_generated_year = $1, last_generated_month = $2 WHERE id = $3", year, month, id)
	return err
}
