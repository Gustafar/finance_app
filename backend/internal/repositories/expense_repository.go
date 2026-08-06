package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type ExpenseRepository struct {
	DB *sql.DB
}

func NewExpenseRepository(db *sql.DB) *ExpenseRepository {
	return &ExpenseRepository{DB: db}
}

func (r *ExpenseRepository) Create(expense models.Expense) (models.Expense, error) {
	query := "INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)"

	result, err := r.DB.Exec(query, expense.Description, expense.Amount, expense.Category, expense.Date)
	if err != nil {
		return models.Expense{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.Expense{}, err
	}

	expense.ID = int(id)
	return expense, nil
}

func (r *ExpenseRepository) GetByID(id int) (models.Expense, error) {
	query := "SELECT id, description, amount, category, date FROM expenses WHERE id = ?"

	var expense models.Expense
	err := r.DB.QueryRow(query, id).Scan(&expense.ID, &expense.Description, &expense.Amount, &expense.Category, &expense.Date)
	if err != nil {
		return models.Expense{}, err
	}

	return expense, nil
}

func (r *ExpenseRepository) GetAll() ([]models.Expense, error) {
	query := "SELECT id, description, amount, category, date FROM expenses"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	expenses := []models.Expense{}

	for rows.Next() {
		var expense models.Expense

		err := rows.Scan(&expense.ID, &expense.Description, &expense.Amount, &expense.Category, &expense.Date)
		if err != nil {
			return nil, err
		}

		expenses = append(expenses, expense)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return expenses, nil
}

func (r *ExpenseRepository) Update(id int, expense models.Expense) (models.Expense, error) {
	query := "UPDATE expenses SET description = ?, amount = ?, category = ?, date = ? WHERE id = ?"

	result, err := r.DB.Exec(query, expense.Description, expense.Amount, expense.Category, expense.Date, id)
	if err != nil {
		return models.Expense{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Expense{}, err
	}

	if rowsAffected == 0 {
		return models.Expense{}, sql.ErrNoRows
	}

	expense.ID = id
	return expense, nil
}

func (r *ExpenseRepository) Delete(id int) error {
	query := "DELETE FROM expenses WHERE id = ?"

	result, err := r.DB.Exec(query, id)
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
