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
	       include_in_expenses, plan_year, plan_month, comment, created_at
	FROM recurring_expenses
`

func scanRecurringExpense(row interface{ Scan(...any) error }) (models.RecurringExpense, error) {
	var recurring models.RecurringExpense
	err := row.Scan(
		&recurring.ID, &recurring.Description, &recurring.Amount, &recurring.Type, &recurring.DayOfMonth,
		&recurring.CategoryID, &recurring.SubcategoryID, &recurring.PersonID, &recurring.PaymentMethodID, &recurring.BucketID, &recurring.BankID,
		&recurring.IncludeInExpenses, &recurring.PlanYear, &recurring.PlanMonth, &recurring.Comment, &recurring.CreatedAt,
	)
	return recurring, err
}

type sqlExecutor interface {
	Exec(query string, args ...any) (sql.Result, error)
	QueryRow(query string, args ...any) *sql.Row
	Query(query string, args ...any) (*sql.Rows, error)
}

func (r *RecurringExpenseRepository) Create(recurring models.RecurringExpense) (models.RecurringExpense, error) {
	return r.createWith(r.DB, recurring)
}

func (r *RecurringExpenseRepository) CreateTx(tx *sql.Tx, recurring models.RecurringExpense) (models.RecurringExpense, error) {
	return r.createWith(tx, recurring)
}

func (r *RecurringExpenseRepository) createWith(exec sqlExecutor, recurring models.RecurringExpense) (models.RecurringExpense, error) {
	query := `INSERT INTO recurring_expenses (description, amount, type, day_of_month, category_id, subcategory_id, person_id, payment_method_id, bucket_id, bank_id, include_in_expenses, plan_year, plan_month, comment)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`

	var id int
	err := exec.QueryRow(
		query, recurring.Description, recurring.Amount, recurring.Type, recurring.DayOfMonth,
		recurring.CategoryID, recurring.SubcategoryID, recurring.PersonID, recurring.PaymentMethodID, recurring.BucketID, recurring.BankID,
		recurring.IncludeInExpenses, recurring.PlanYear, recurring.PlanMonth, recurring.Comment,
	).Scan(&id)
	if err != nil {
		return models.RecurringExpense{}, err
	}

	return r.getByIDWith(exec, id)
}

func (r *RecurringExpenseRepository) GetByID(id int) (models.RecurringExpense, error) {
	return r.getByIDWith(r.DB, id)
}

func (r *RecurringExpenseRepository) GetByIDTx(tx *sql.Tx, id int) (models.RecurringExpense, error) {
	return r.getByIDWith(tx, id)
}

func (r *RecurringExpenseRepository) getByIDWith(exec sqlExecutor, id int) (models.RecurringExpense, error) {
	query := selectRecurringExpenseQuery + " WHERE id = $1"

	recurring, err := scanRecurringExpense(exec.QueryRow(query, id))
	if err != nil {
		return models.RecurringExpense{}, err
	}

	return recurring, nil
}

func (r *RecurringExpenseRepository) GetAllByMonth(year, month int) ([]models.RecurringExpense, error) {
	return r.getAllByMonthWith(r.DB, year, month)
}

func (r *RecurringExpenseRepository) GetAllByMonthTx(tx *sql.Tx, year, month int) ([]models.RecurringExpense, error) {
	return r.getAllByMonthWith(tx, year, month)
}

func (r *RecurringExpenseRepository) getAllByMonthWith(exec sqlExecutor, year, month int) ([]models.RecurringExpense, error) {
	query := selectRecurringExpenseQuery + " WHERE plan_year = $1 AND plan_month = $2 ORDER BY day_of_month, description"

	rows, err := exec.Query(query, year, month)
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
	return r.updateWith(r.DB, id, recurring)
}

func (r *RecurringExpenseRepository) UpdateTx(tx *sql.Tx, id int, recurring models.RecurringExpense) (models.RecurringExpense, error) {
	return r.updateWith(tx, id, recurring)
}

func (r *RecurringExpenseRepository) updateWith(exec sqlExecutor, id int, recurring models.RecurringExpense) (models.RecurringExpense, error) {
	query := `UPDATE recurring_expenses
		SET description = $1, amount = $2, type = $3, day_of_month = $4, category_id = $5, subcategory_id = $6, person_id = $7, payment_method_id = $8, bucket_id = $9, bank_id = $10, include_in_expenses = $11, plan_year = $12, plan_month = $13, comment = $14
		WHERE id = $15`

	_, err := exec.Exec(
		query, recurring.Description, recurring.Amount, recurring.Type, recurring.DayOfMonth,
		recurring.CategoryID, recurring.SubcategoryID, recurring.PersonID, recurring.PaymentMethodID, recurring.BucketID, recurring.BankID,
		recurring.IncludeInExpenses, recurring.PlanYear, recurring.PlanMonth, recurring.Comment, id,
	)
	if err != nil {
		return models.RecurringExpense{}, err
	}

	return r.getByIDWith(exec, id)
}

func (r *RecurringExpenseRepository) Delete(id int) error {
	return r.deleteWith(r.DB, id)
}

func (r *RecurringExpenseRepository) DeleteTx(tx *sql.Tx, id int) error {
	return r.deleteWith(tx, id)
}

func (r *RecurringExpenseRepository) deleteWith(exec sqlExecutor, id int) error {
	result, err := exec.Exec("DELETE FROM recurring_expenses WHERE id = $1", id)
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

func (r *RecurringExpenseRepository) DeleteByMonthTx(tx *sql.Tx, year, month int) error {
	_, err := tx.Exec("DELETE FROM recurring_expenses WHERE plan_year = $1 AND plan_month = $2", year, month)
	return err
}

// LatestMonthWithData finds the most recent (year, month) strictly before the given one that has
// at least one planning row, skipping over any months with none.
func (r *RecurringExpenseRepository) LatestMonthWithData(beforeYear, beforeMonth int) (int, int, bool, error) {
	query := `SELECT plan_year, plan_month FROM recurring_expenses
		WHERE (plan_year, plan_month) < ($1, $2)
		ORDER BY plan_year DESC, plan_month DESC LIMIT 1`

	var year, month int
	err := r.DB.QueryRow(query, beforeYear, beforeMonth).Scan(&year, &month)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, 0, false, nil
		}
		return 0, 0, false, err
	}

	return year, month, true, nil
}
