package services

import (
	"database/sql"
	"errors"
	"time"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type RecurringExpenseService struct {
	Repo        *repositories.RecurringExpenseRepository
	ExpenseRepo *repositories.ExpenseRepository
	DB          *sql.DB
}

func NewRecurringExpenseService(repo *repositories.RecurringExpenseRepository, expenseRepo *repositories.ExpenseRepository, db *sql.DB) *RecurringExpenseService {
	return &RecurringExpenseService{Repo: repo, ExpenseRepo: expenseRepo, DB: db}
}

func (s *RecurringExpenseService) validate(recurring models.RecurringExpense) error {
	if recurring.Description == "" {
		return ErrEmptyRecurringExpenseName
	}
	if recurring.Amount <= 0 {
		return ErrInvalidAmount
	}
	if !validTransactionTypes[recurring.Type] {
		return ErrInvalidType
	}
	if recurring.DayOfMonth < 1 || recurring.DayOfMonth > 31 {
		return ErrInvalidRecurringExpenseDay
	}
	if recurring.CategoryID <= 0 {
		return ErrEmptyCategory
	}
	if recurring.SubcategoryID == nil || *recurring.SubcategoryID <= 0 {
		return ErrEmptySubcategory
	}
	if recurring.PersonID <= 0 {
		return ErrEmptyPerson
	}
	if recurring.PaymentMethodID <= 0 {
		return ErrEmptyPaymentMethod
	}
	if recurring.BucketID <= 0 {
		return ErrEmptyBucket
	}
	if recurring.BankID <= 0 {
		return ErrEmptyBank
	}
	if recurring.PlanYear <= 0 {
		return ErrInvalidPlanYear
	}
	if recurring.PlanMonth < 1 || recurring.PlanMonth > 12 {
		return ErrInvalidPlanMonth
	}
	return nil
}

func recurringReferencedEntityError(err error) error {
	if violatesConstraint(err, "fk_recurring_expenses_category") {
		return ErrCategoryNotFound
	}
	if violatesConstraint(err, "fk_recurring_expenses_person") {
		return ErrPersonNotFound
	}
	if violatesConstraint(err, "fk_recurring_expenses_payment_method") {
		return ErrPaymentMethodNotFound
	}
	if violatesConstraint(err, "fk_recurring_expenses_bucket") {
		return ErrBucketNotFound
	}
	if violatesConstraint(err, "fk_recurring_expenses_bank") {
		return ErrBankNotFound
	}
	if violatesConstraint(err, "fk_recurring_expenses_subcategory") {
		return ErrSubcategoryNotFound
	}
	return nil
}

// expenseFromPlanRow builds the linked Expense payload for a plan row flagged for automatic launch.
func expenseFromPlanRow(row models.RecurringExpense) models.Expense {
	recurringID := row.ID
	return models.Expense{
		Description:        row.Description,
		Amount:             row.Amount,
		Type:               row.Type,
		CategoryID:         row.CategoryID,
		SubcategoryID:      row.SubcategoryID,
		PersonID:           row.PersonID,
		PaymentMethodID:    row.PaymentMethodID,
		BucketID:           row.BucketID,
		BankID:             row.BankID,
		Date:               dateForDay(row.PlanYear, time.Month(row.PlanMonth), row.DayOfMonth),
		RecurringExpenseID: &recurringID,
	}
}

func (s *RecurringExpenseService) Create(recurring models.RecurringExpense) (models.RecurringExpense, error) {
	if err := s.validate(recurring); err != nil {
		return models.RecurringExpense{}, err
	}

	tx, err := s.DB.Begin()
	if err != nil {
		return models.RecurringExpense{}, err
	}
	defer tx.Rollback()

	created, err := s.Repo.CreateTx(tx, recurring)
	if err != nil {
		if refErr := recurringReferencedEntityError(err); refErr != nil {
			return models.RecurringExpense{}, refErr
		}
		return models.RecurringExpense{}, err
	}

	if created.IncludeInExpenses {
		if _, err := s.ExpenseRepo.CreateTx(tx, expenseFromPlanRow(created)); err != nil {
			return models.RecurringExpense{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return models.RecurringExpense{}, err
	}

	return created, nil
}

type RecurringBulkRowResult struct {
	Row     int
	Created models.RecurringExpense
	Err     error
}

// CreateBulk inserts each row independently, continuing past failures so valid rows still get
// created; the caller inspects each result to know which rows need fixing and resubmitting.
func (s *RecurringExpenseService) CreateBulk(rows []models.RecurringExpense) []RecurringBulkRowResult {
	results := make([]RecurringBulkRowResult, len(rows))

	for i, row := range rows {
		created, err := s.Create(row)
		results[i] = RecurringBulkRowResult{Row: i, Created: created, Err: err}
	}

	return results
}

func (s *RecurringExpenseService) GetAllByMonth(year, month int) ([]models.RecurringExpense, error) {
	return s.Repo.GetAllByMonth(year, month)
}

func (s *RecurringExpenseService) GetByID(id int) (models.RecurringExpense, error) {
	recurring, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.RecurringExpense{}, ErrRecurringExpenseNotFound
		}
		return models.RecurringExpense{}, err
	}

	return recurring, nil
}

func (s *RecurringExpenseService) Update(id int, recurring models.RecurringExpense) (models.RecurringExpense, error) {
	if err := s.validate(recurring); err != nil {
		return models.RecurringExpense{}, err
	}

	tx, err := s.DB.Begin()
	if err != nil {
		return models.RecurringExpense{}, err
	}
	defer tx.Rollback()

	existing, err := s.Repo.GetByIDTx(tx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.RecurringExpense{}, ErrRecurringExpenseNotFound
		}
		return models.RecurringExpense{}, err
	}

	// A plan row's month is immutable via a plain edit — it only changes month by being
	// deleted/recreated (e.g. via the copy-previous-month replace flow).
	recurring.PlanYear = existing.PlanYear
	recurring.PlanMonth = existing.PlanMonth

	updated, err := s.Repo.UpdateTx(tx, id, recurring)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.RecurringExpense{}, ErrRecurringExpenseNotFound
		}
		if refErr := recurringReferencedEntityError(err); refErr != nil {
			return models.RecurringExpense{}, refErr
		}
		return models.RecurringExpense{}, err
	}

	if err := s.syncLinkedExpenseTx(tx, updated); err != nil {
		return models.RecurringExpense{}, err
	}

	if err := tx.Commit(); err != nil {
		return models.RecurringExpense{}, err
	}

	return updated, nil
}

// syncLinkedExpenseTx keeps the (at most one) Expense generated from a plan row in sync with it:
// creates it if the row just became auto-launched, updates it if it stays auto-launched, or
// deletes it if the row stopped being auto-launched.
func (s *RecurringExpenseService) syncLinkedExpenseTx(tx *sql.Tx, row models.RecurringExpense) error {
	linked, err := s.ExpenseRepo.GetByRecurringExpenseIDTx(tx, row.ID)
	found := true
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			found = false
		} else {
			return err
		}
	}

	switch {
	case row.IncludeInExpenses && found:
		_, err := s.ExpenseRepo.UpdateTx(tx, linked.ID, expenseFromPlanRow(row))
		return err
	case row.IncludeInExpenses && !found:
		_, err := s.ExpenseRepo.CreateTx(tx, expenseFromPlanRow(row))
		return err
	case !row.IncludeInExpenses && found:
		return s.ExpenseRepo.DeleteTx(tx, linked.ID)
	default:
		return nil
	}
}

func (s *RecurringExpenseService) Delete(id int) error {
	tx, err := s.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	linked, err := s.ExpenseRepo.GetByRecurringExpenseIDTx(tx, id)
	if err == nil {
		if err := s.ExpenseRepo.DeleteTx(tx, linked.ID); err != nil {
			return err
		}
	} else if !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	if err := s.Repo.DeleteTx(tx, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrRecurringExpenseNotFound
		}
		return err
	}

	return tx.Commit()
}

func (s *RecurringExpenseService) LatestMonthWithData(beforeYear, beforeMonth int) (int, int, bool, error) {
	return s.Repo.LatestMonthWithData(beforeYear, beforeMonth)
}

// ReplaceMonth atomically wipes a month's planning rows (and any expenses they generated) and
// replaces them with the given draft, generating fresh linked expenses for auto-launch rows.
func (s *RecurringExpenseService) ReplaceMonth(year, month int, draft []models.RecurringExpense) ([]models.RecurringExpense, error) {
	for i := range draft {
		draft[i].PlanYear = year
		draft[i].PlanMonth = month
		if err := s.validate(draft[i]); err != nil {
			return nil, err
		}
	}

	tx, err := s.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	existingRows, err := s.Repo.GetAllByMonthTx(tx, year, month)
	if err != nil {
		return nil, err
	}

	for _, existing := range existingRows {
		linked, err := s.ExpenseRepo.GetByRecurringExpenseIDTx(tx, existing.ID)
		if err == nil {
			if err := s.ExpenseRepo.DeleteTx(tx, linked.ID); err != nil {
				return nil, err
			}
		} else if !errors.Is(err, sql.ErrNoRows) {
			return nil, err
		}
	}

	if err := s.Repo.DeleteByMonthTx(tx, year, month); err != nil {
		return nil, err
	}

	created := make([]models.RecurringExpense, 0, len(draft))
	for _, row := range draft {
		row.ID = 0
		createdRow, err := s.Repo.CreateTx(tx, row)
		if err != nil {
			if refErr := recurringReferencedEntityError(err); refErr != nil {
				return nil, refErr
			}
			return nil, err
		}

		if createdRow.IncludeInExpenses {
			if _, err := s.ExpenseRepo.CreateTx(tx, expenseFromPlanRow(createdRow)); err != nil {
				return nil, err
			}
		}

		created = append(created, createdRow)
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return created, nil
}
