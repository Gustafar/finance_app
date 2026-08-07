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

const selectExpenseQuery = `
	SELECT e.id, e.description, e.amount, e.category_id, c.name, c.color, e.date
	FROM expenses e
	JOIN categories c ON c.id = e.category_id
`

func (r *ExpenseRepository) Create(expense models.Expense) (models.Expense, error) {
	query := `INSERT INTO expenses (description, amount, category_id, date) VALUES (?, ?, ?, ?)`

	result, err := r.DB.Exec(query, expense.Description, expense.Amount, expense.CategoryID, expense.Date)
	if err != nil {
		return models.Expense{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.Expense{}, err
	}

	return r.GetByID(int(id))
}

func (r *ExpenseRepository) GetByID(id int) (models.Expense, error) {
	query := selectExpenseQuery + " WHERE e.id = ?"

	var expense models.Expense
	err := r.DB.QueryRow(query, id).Scan(
		&expense.ID, &expense.Description, &expense.Amount, &expense.CategoryID, &expense.CategoryName, &expense.CategoryColor, &expense.Date,
	)
	if err != nil {
		return models.Expense{}, err
	}

	return expense, nil
}

func (r *ExpenseRepository) GetAll() ([]models.Expense, error) {
	rows, err := r.DB.Query(selectExpenseQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	expenses := []models.Expense{}

	for rows.Next() {
		var expense models.Expense

		err := rows.Scan(
			&expense.ID, &expense.Description, &expense.Amount, &expense.CategoryID, &expense.CategoryName, &expense.CategoryColor, &expense.Date,
		)
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
	query := `UPDATE expenses SET description = ?, amount = ?, category_id = ?, date = ? WHERE id = ?`

	_, err := r.DB.Exec(query, expense.Description, expense.Amount, expense.CategoryID, expense.Date, id)
	if err != nil {
		return models.Expense{}, err
	}

	return r.GetByID(id)
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
