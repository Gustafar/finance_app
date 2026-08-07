package repositories

import (
	"database/sql"
	"time"

	"finance_app/internal/models"
)

type ExpenseRepository struct {
	DB *sql.DB
}

func NewExpenseRepository(db *sql.DB) *ExpenseRepository {
	return &ExpenseRepository{DB: db}
}

const selectExpenseQuery = `
	SELECT e.id, e.description, e.amount, e.category_id, c.name, c.color, e.person_id, p.name, p.color,
	       e.payment_method_id, m.name, m.color, e.caixinha_id, x.name, x.color, e.type, e.date,
	       e.installment_purchase_id, e.installment_number, ip.installment_count, ip.total_amount, ip.purchase_date
	FROM expenses e
	JOIN categories c ON c.id = e.category_id
	JOIN people p ON p.id = e.person_id
	JOIN payment_methods m ON m.id = e.payment_method_id
	JOIN caixinhas x ON x.id = e.caixinha_id
	LEFT JOIN installment_purchases ip ON ip.id = e.installment_purchase_id
`

func scanExpense(row interface{ Scan(...any) error }) (models.Expense, error) {
	var expense models.Expense
	err := row.Scan(
		&expense.ID, &expense.Description, &expense.Amount, &expense.CategoryID, &expense.CategoryName, &expense.CategoryColor,
		&expense.PersonID, &expense.PersonName, &expense.PersonColor,
		&expense.PaymentMethodID, &expense.PaymentMethodName, &expense.PaymentMethodColor,
		&expense.CaixinhaID, &expense.CaixinhaName, &expense.CaixinhaColor, &expense.Type, &expense.Date,
		&expense.InstallmentPurchaseID, &expense.InstallmentNumber, &expense.InstallmentCount,
		&expense.PurchaseTotalAmount, &expense.PurchaseDate,
	)
	return expense, err
}

func (r *ExpenseRepository) Create(expense models.Expense) (models.Expense, error) {
	query := `INSERT INTO expenses (description, amount, category_id, person_id, payment_method_id, caixinha_id, type, date)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	result, err := r.DB.Exec(
		query, expense.Description, expense.Amount, expense.CategoryID, expense.PersonID, expense.PaymentMethodID,
		expense.CaixinhaID, expense.Type, expense.Date,
	)
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

	expense, err := scanExpense(r.DB.QueryRow(query, id))
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
		expense, err := scanExpense(rows)
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

func (r *ExpenseRepository) getByInstallmentPurchaseID(purchaseID int) ([]models.Expense, error) {
	query := selectExpenseQuery + " WHERE e.installment_purchase_id = ? ORDER BY e.installment_number"

	rows, err := r.DB.Query(query, purchaseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	expenses := []models.Expense{}

	for rows.Next() {
		expense, err := scanExpense(rows)
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
	query := `UPDATE expenses SET description = ?, amount = ?, category_id = ?, person_id = ?, payment_method_id = ?, caixinha_id = ?, type = ?, date = ?
		WHERE id = ?`

	_, err := r.DB.Exec(
		query, expense.Description, expense.Amount, expense.CategoryID, expense.PersonID, expense.PaymentMethodID,
		expense.CaixinhaID, expense.Type, expense.Date, id,
	)
	if err != nil {
		return models.Expense{}, err
	}

	return r.GetByID(id)
}

type InstallmentSlice struct {
	Number int
	Amount float64
	Date   time.Time
}

func (r *ExpenseRepository) CreateInstallmentPurchase(purchase models.InstallmentPurchase, slices []InstallmentSlice) ([]models.Expense, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	purchaseResult, err := tx.Exec(
		`INSERT INTO installment_purchases (description, total_amount, purchase_date, installment_count, category_id, person_id, payment_method_id, caixinha_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		purchase.Description, purchase.TotalAmount, purchase.PurchaseDate, purchase.InstallmentCount,
		purchase.CategoryID, purchase.PersonID, purchase.PaymentMethodID, purchase.CaixinhaID,
	)
	if err != nil {
		return nil, err
	}

	purchaseID, err := purchaseResult.LastInsertId()
	if err != nil {
		return nil, err
	}

	insertExpense := `INSERT INTO expenses
		(description, amount, category_id, person_id, payment_method_id, caixinha_id, type, date, installment_purchase_id, installment_number)
		VALUES (?, ?, ?, ?, ?, ?, 'expense', ?, ?, ?)`

	for _, slice := range slices {
		if _, err := tx.Exec(
			insertExpense, purchase.Description, slice.Amount, purchase.CategoryID, purchase.PersonID,
			purchase.PaymentMethodID, purchase.CaixinhaID, slice.Date, purchaseID, slice.Number,
		); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return r.getByInstallmentPurchaseID(int(purchaseID))
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
