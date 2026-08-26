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
	SELECT e.id, e.description, e.amount, e.category_id, c.name, c.color, e.subcategory_id, sub.name, e.person_id, p.name, p.color,
	       e.payment_method_id, m.name, m.color, e.bucket_id, x.name, x.color, e.bank_id, b.name, b.color, e.type, e.date, e.comment, e.amount_formula,
	       e.installment_purchase_id, e.installment_number, ip.installment_count, ip.total_amount, ip.purchase_date,
	       e.recurring_expense_id, e.investment_box_id, ib.name, ib.color
	FROM expenses e
	JOIN categories c ON c.id = e.category_id
	JOIN people p ON p.id = e.person_id
	JOIN payment_methods m ON m.id = e.payment_method_id
	JOIN buckets x ON x.id = e.bucket_id
	JOIN banks b ON b.id = e.bank_id
	LEFT JOIN installment_purchases ip ON ip.id = e.installment_purchase_id
	LEFT JOIN investment_boxes ib ON ib.id = e.investment_box_id
	LEFT JOIN subcategories sub ON sub.id = e.subcategory_id
`

func scanExpense(row interface{ Scan(...any) error }) (models.Expense, error) {
	var expense models.Expense
	err := row.Scan(
		&expense.ID, &expense.Description, &expense.Amount, &expense.CategoryID, &expense.CategoryName, &expense.CategoryColor,
		&expense.SubcategoryID, &expense.SubcategoryName,
		&expense.PersonID, &expense.PersonName, &expense.PersonColor,
		&expense.PaymentMethodID, &expense.PaymentMethodName, &expense.PaymentMethodColor,
		&expense.BucketID, &expense.BucketName, &expense.BucketColor,
		&expense.BankID, &expense.BankName, &expense.BankColor, &expense.Type, &expense.Date, &expense.Comment, &expense.AmountFormula,
		&expense.InstallmentPurchaseID, &expense.InstallmentNumber, &expense.InstallmentCount,
		&expense.PurchaseTotalAmount, &expense.PurchaseDate,
		&expense.RecurringExpenseID, &expense.InvestmentBoxID, &expense.InvestmentBoxName, &expense.InvestmentBoxColor,
	)
	return expense, err
}

type expenseSQLExecutor interface {
	Exec(query string, args ...any) (sql.Result, error)
	QueryRow(query string, args ...any) *sql.Row
}

func (r *ExpenseRepository) Create(expense models.Expense) (models.Expense, error) {
	return r.createWith(r.DB, expense)
}

func (r *ExpenseRepository) CreateTx(tx *sql.Tx, expense models.Expense) (models.Expense, error) {
	return r.createWith(tx, expense)
}

func (r *ExpenseRepository) createWith(exec expenseSQLExecutor, expense models.Expense) (models.Expense, error) {
	query := `INSERT INTO expenses (description, amount, category_id, subcategory_id, person_id, payment_method_id, bucket_id, bank_id, type, date, recurring_expense_id, investment_box_id, comment, amount_formula)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`

	var id int
	err := exec.QueryRow(
		query, expense.Description, expense.Amount, expense.CategoryID, expense.SubcategoryID, expense.PersonID, expense.PaymentMethodID,
		expense.BucketID, expense.BankID, expense.Type, expense.Date, expense.RecurringExpenseID, expense.InvestmentBoxID, expense.Comment, expense.AmountFormula,
	).Scan(&id)
	if err != nil {
		return models.Expense{}, err
	}

	return r.getByIDWith(exec, id)
}

func (r *ExpenseRepository) GetByID(id int) (models.Expense, error) {
	return r.getByIDWith(r.DB, id)
}

func (r *ExpenseRepository) GetByIDTx(tx *sql.Tx, id int) (models.Expense, error) {
	return r.getByIDWith(tx, id)
}

func (r *ExpenseRepository) getByIDWith(exec expenseSQLExecutor, id int) (models.Expense, error) {
	query := selectExpenseQuery + " WHERE e.id = $1"

	expense, err := scanExpense(exec.QueryRow(query, id))
	if err != nil {
		return models.Expense{}, err
	}

	return expense, nil
}

// GetByRecurringExpenseIDTx looks up the (at most one, per the DB unique index) expense generated
// from a given recurring plan row. Returns sql.ErrNoRows if none exists.
func (r *ExpenseRepository) GetByRecurringExpenseIDTx(tx *sql.Tx, recurringExpenseID int) (models.Expense, error) {
	query := selectExpenseQuery + " WHERE e.recurring_expense_id = $1"

	expense, err := scanExpense(tx.QueryRow(query, recurringExpenseID))
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
	query := selectExpenseQuery + " WHERE e.installment_purchase_id = $1 ORDER BY e.installment_number"

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
	return r.updateWith(r.DB, id, expense)
}

func (r *ExpenseRepository) UpdateTx(tx *sql.Tx, id int, expense models.Expense) (models.Expense, error) {
	return r.updateWith(tx, id, expense)
}

func (r *ExpenseRepository) updateWith(exec expenseSQLExecutor, id int, expense models.Expense) (models.Expense, error) {
	query := `UPDATE expenses SET description = $1, amount = $2, category_id = $3, subcategory_id = $4, person_id = $5, payment_method_id = $6, bucket_id = $7, bank_id = $8, type = $9, date = $10, investment_box_id = $11, comment = $12, amount_formula = $13
		WHERE id = $14`

	_, err := exec.Exec(
		query, expense.Description, expense.Amount, expense.CategoryID, expense.SubcategoryID, expense.PersonID, expense.PaymentMethodID,
		expense.BucketID, expense.BankID, expense.Type, expense.Date, expense.InvestmentBoxID, expense.Comment, expense.AmountFormula, id,
	)
	if err != nil {
		return models.Expense{}, err
	}

	return r.getByIDWith(exec, id)
}

type InstallmentSlice struct {
	Number int
	Amount float64
	Date   time.Time
}

func (r *ExpenseRepository) CreateInstallmentPurchase(purchase models.InstallmentPurchase, slices []InstallmentSlice, comment *string) ([]models.Expense, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var purchaseID int
	err = tx.QueryRow(
		`INSERT INTO installment_purchases (description, total_amount, purchase_date, installment_count, category_id, subcategory_id, person_id, payment_method_id, bucket_id, bank_id)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
		purchase.Description, purchase.TotalAmount, purchase.PurchaseDate, purchase.InstallmentCount,
		purchase.CategoryID, purchase.SubcategoryID, purchase.PersonID, purchase.PaymentMethodID, purchase.BucketID, purchase.BankID,
	).Scan(&purchaseID)
	if err != nil {
		return nil, err
	}

	insertExpense := `INSERT INTO expenses
		(description, amount, category_id, subcategory_id, person_id, payment_method_id, bucket_id, bank_id, type, date, installment_purchase_id, installment_number, comment)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'expense', $9, $10, $11, $12)`

	for _, slice := range slices {
		if _, err := tx.Exec(
			insertExpense, purchase.Description, slice.Amount, purchase.CategoryID, purchase.SubcategoryID, purchase.PersonID,
			purchase.PaymentMethodID, purchase.BucketID, purchase.BankID, slice.Date, purchaseID, slice.Number, comment,
		); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return r.getByInstallmentPurchaseID(purchaseID)
}

func (r *ExpenseRepository) Delete(id int) error {
	return r.deleteWith(r.DB, id)
}

func (r *ExpenseRepository) DeleteTx(tx *sql.Tx, id int) error {
	return r.deleteWith(tx, id)
}

func (r *ExpenseRepository) deleteWith(exec expenseSQLExecutor, id int) error {
	query := "DELETE FROM expenses WHERE id = $1"

	result, err := exec.Exec(query, id)
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
