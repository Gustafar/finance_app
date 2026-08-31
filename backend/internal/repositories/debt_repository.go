package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type DebtRepository struct {
	DB *sql.DB
}

func NewDebtRepository(db *sql.DB) *DebtRepository {
	return &DebtRepository{DB: db}
}

const selectDebtQuery = `
	SELECT id, direction, counterparty_name, description, amount, incurred_on, due_date, comment, created_at
	FROM debts
`

func scanDebt(row interface{ Scan(...any) error }) (models.Debt, error) {
	var debt models.Debt
	err := row.Scan(
		&debt.ID, &debt.Direction, &debt.CounterpartyName, &debt.Description, &debt.Amount,
		&debt.IncurredOn, &debt.DueDate, &debt.Comment, &debt.CreatedAt,
	)
	debt.Payments = []models.DebtPayment{}
	return debt, err
}

func scanDebtPayment(row interface{ Scan(...any) error }) (models.DebtPayment, error) {
	var p models.DebtPayment
	err := row.Scan(&p.ID, &p.DebtID, &p.Amount, &p.PaidOn, &p.Comment, &p.CreatedAt)
	return p, err
}

// applyPayments fills AmountPaid/Outstanding from the debt's payment list.
func applyPayments(debt *models.Debt) {
	var paid float64
	for _, p := range debt.Payments {
		paid += p.Amount
	}
	debt.AmountPaid = paid
	debt.Outstanding = debt.Amount - paid
}

func (r *DebtRepository) GetAll() ([]models.Debt, error) {
	rows, err := r.DB.Query(selectDebtQuery + " ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	debts := []models.Debt{}
	byID := map[int]*models.Debt{}
	for rows.Next() {
		debt, err := scanDebt(rows)
		if err != nil {
			return nil, err
		}
		debts = append(debts, debt)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for i := range debts {
		byID[debts[i].ID] = &debts[i]
	}

	// The payments table stays small (personal use), so a single unfiltered scan
	// grouped in memory is simpler than array parameters.
	payRows, err := r.DB.Query(
		"SELECT id, debt_id, amount, paid_on, comment, created_at FROM debt_payments ORDER BY paid_on, id",
	)
	if err != nil {
		return nil, err
	}
	defer payRows.Close()

	for payRows.Next() {
		p, err := scanDebtPayment(payRows)
		if err != nil {
			return nil, err
		}
		if debt := byID[p.DebtID]; debt != nil {
			debt.Payments = append(debt.Payments, p)
		}
	}
	if err := payRows.Err(); err != nil {
		return nil, err
	}

	for i := range debts {
		applyPayments(&debts[i])
	}

	return debts, nil
}

func (r *DebtRepository) GetByID(id int) (models.Debt, error) {
	debt, err := scanDebt(r.DB.QueryRow(selectDebtQuery+" WHERE id = $1", id))
	if err != nil {
		return models.Debt{}, err
	}

	payRows, err := r.DB.Query(
		"SELECT id, debt_id, amount, paid_on, comment, created_at FROM debt_payments WHERE debt_id = $1 ORDER BY paid_on, id",
		id,
	)
	if err != nil {
		return models.Debt{}, err
	}
	defer payRows.Close()

	for payRows.Next() {
		p, err := scanDebtPayment(payRows)
		if err != nil {
			return models.Debt{}, err
		}
		debt.Payments = append(debt.Payments, p)
	}
	if err := payRows.Err(); err != nil {
		return models.Debt{}, err
	}

	applyPayments(&debt)
	return debt, nil
}

func (r *DebtRepository) Create(debt models.Debt) (models.Debt, error) {
	query := `INSERT INTO debts (direction, counterparty_name, description, amount, incurred_on, due_date, comment)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`

	var id int
	err := r.DB.QueryRow(
		query, debt.Direction, debt.CounterpartyName, debt.Description, debt.Amount,
		debt.IncurredOn, debt.DueDate, debt.Comment,
	).Scan(&id)
	if err != nil {
		return models.Debt{}, err
	}

	return r.GetByID(id)
}

func (r *DebtRepository) Update(id int, debt models.Debt) (models.Debt, error) {
	query := `UPDATE debts
		SET direction = $1, counterparty_name = $2, description = $3, amount = $4, incurred_on = $5, due_date = $6, comment = $7
		WHERE id = $8`

	result, err := r.DB.Exec(
		query, debt.Direction, debt.CounterpartyName, debt.Description, debt.Amount,
		debt.IncurredOn, debt.DueDate, debt.Comment, id,
	)
	if err != nil {
		return models.Debt{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Debt{}, err
	}
	if rowsAffected == 0 {
		return models.Debt{}, sql.ErrNoRows
	}

	return r.GetByID(id)
}

func (r *DebtRepository) Delete(id int) error {
	result, err := r.DB.Exec("DELETE FROM debts WHERE id = $1", id)
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

// AddPayment records a repayment against an existing debt and returns the updated debt.
func (r *DebtRepository) AddPayment(debtID int, payment models.DebtPayment) (models.Debt, error) {
	query := `INSERT INTO debt_payments (debt_id, amount, paid_on, comment)
		VALUES ($1, $2, $3, $4) RETURNING id`

	var id int
	err := r.DB.QueryRow(query, debtID, payment.Amount, payment.PaidOn, payment.Comment).Scan(&id)
	if err != nil {
		return models.Debt{}, err
	}

	return r.GetByID(debtID)
}

func (r *DebtRepository) DeletePayment(debtID, paymentID int) (models.Debt, error) {
	result, err := r.DB.Exec("DELETE FROM debt_payments WHERE id = $1 AND debt_id = $2", paymentID, debtID)
	if err != nil {
		return models.Debt{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Debt{}, err
	}
	if rowsAffected == 0 {
		return models.Debt{}, sql.ErrNoRows
	}

	return r.GetByID(debtID)
}
