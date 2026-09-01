package repositories

import (
	"database/sql"
	"time"

	"finance_app/internal/models"
)

type DebtRepository struct {
	DB *sql.DB
}

func NewDebtRepository(db *sql.DB) *DebtRepository {
	return &DebtRepository{DB: db}
}

const selectDebtQuery = `
	SELECT id, direction, counterparty_name, description, amount, amount_formula, incurred_on, due_date, comment, created_at,
	       installment_group_id, installment_number, installment_count
	FROM debts
`

func scanDebt(row interface{ Scan(...any) error }) (models.Debt, error) {
	var debt models.Debt
	err := row.Scan(
		&debt.ID, &debt.Direction, &debt.CounterpartyName, &debt.Description, &debt.Amount, &debt.AmountFormula,
		&debt.IncurredOn, &debt.DueDate, &debt.Comment, &debt.CreatedAt,
		&debt.InstallmentGroupID, &debt.InstallmentNumber, &debt.InstallmentCount,
	)
	debt.Payments = []models.DebtPayment{}
	return debt, err
}

// DebtInstallmentSlice is one month's slice of a parcelamento.
type DebtInstallmentSlice struct {
	Number     int
	Amount     float64
	IncurredOn time.Time
	DueDate    *time.Time
}

// CreateInstallments inserts every slice as its own debt row, linked by a shared
// installment_group_id, and returns the created debts ordered by installment number.
func (r *DebtRepository) CreateInstallments(base models.Debt, slices []DebtInstallmentSlice) ([]models.Debt, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var groupID int
	if err := tx.QueryRow("SELECT nextval('debt_installment_group_seq')").Scan(&groupID); err != nil {
		return nil, err
	}

	count := len(slices)
	ids := make([]int, 0, count)
	insert := `INSERT INTO debts
		(direction, counterparty_name, description, amount, incurred_on, due_date, comment,
		 installment_group_id, installment_number, installment_count)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`

	for _, slice := range slices {
		var id int
		if err := tx.QueryRow(
			insert, base.Direction, base.CounterpartyName, base.Description, slice.Amount,
			slice.IncurredOn, slice.DueDate, base.Comment, groupID, slice.Number, count,
		).Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	debts := make([]models.Debt, 0, len(ids))
	for _, id := range ids {
		debt, err := r.GetByID(id)
		if err != nil {
			return nil, err
		}
		debts = append(debts, debt)
	}
	return debts, nil
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
	query := `INSERT INTO debts (direction, counterparty_name, description, amount, amount_formula, incurred_on, due_date, comment)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`

	var id int
	err := r.DB.QueryRow(
		query, debt.Direction, debt.CounterpartyName, debt.Description, debt.Amount, debt.AmountFormula,
		debt.IncurredOn, debt.DueDate, debt.Comment,
	).Scan(&id)
	if err != nil {
		return models.Debt{}, err
	}

	return r.GetByID(id)
}

func (r *DebtRepository) Update(id int, debt models.Debt) (models.Debt, error) {
	query := `UPDATE debts
		SET direction = $1, counterparty_name = $2, description = $3, amount = $4, amount_formula = $5, incurred_on = $6, due_date = $7, comment = $8
		WHERE id = $9`

	result, err := r.DB.Exec(
		query, debt.Direction, debt.CounterpartyName, debt.Description, debt.Amount, debt.AmountFormula,
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

// UpdateInstallmentGroup applies the shared fields (everything except amount, amount_formula,
// incurred_on and due_date, which stay per-installment) to every debt of groupID from fromNumber
// onward, excluding excludeID (already updated separately by the caller).
func (r *DebtRepository) UpdateInstallmentGroup(groupID, excludeID, fromNumber int, debt models.Debt) error {
	query := `UPDATE debts SET direction = $1, counterparty_name = $2, description = $3, comment = $4
		WHERE installment_group_id = $5 AND installment_number >= $6 AND id != $7`

	_, err := r.DB.Exec(
		query, debt.Direction, debt.CounterpartyName, debt.Description, debt.Comment,
		groupID, fromNumber, excludeID,
	)
	return err
}

// DeleteInstallmentGroup deletes every debt of groupID with installment_number >= fromNumber
// (their debt_payments cascade).
func (r *DebtRepository) DeleteInstallmentGroup(groupID, fromNumber int) error {
	_, err := r.DB.Exec(
		"DELETE FROM debts WHERE installment_group_id = $1 AND installment_number >= $2",
		groupID, fromNumber,
	)
	return err
}

// RescheduleInstallmentDates sets incurred_on of each installment_number of groupID listed in dates,
// one UPDATE per entry inside a single transaction.
func (r *DebtRepository) RescheduleInstallmentDates(groupID int, dates map[int]time.Time) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for number, date := range dates {
		if _, err := tx.Exec(
			"UPDATE debts SET incurred_on = $1 WHERE installment_group_id = $2 AND installment_number = $3",
			date, groupID, number,
		); err != nil {
			return err
		}
	}

	return tx.Commit()
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
