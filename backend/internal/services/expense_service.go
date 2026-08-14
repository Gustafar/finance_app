package services

import (
	"database/sql"
	"errors"
	"math"
	"time"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type ExpenseService struct {
	Repo          *repositories.ExpenseRepository
	RecurringRepo *repositories.RecurringExpenseRepository
}

func NewExpenseService(repo *repositories.ExpenseRepository, recurringRepo *repositories.RecurringExpenseRepository) *ExpenseService {
	return &ExpenseService{Repo: repo, RecurringRepo: recurringRepo}
}

var validTransactionTypes = map[string]bool{
	"income":     true,
	"expense":    true,
	"investment": true,
}

const (
	minInstallmentCount = 2
	maxInstallmentCount = 60
)

func (s *ExpenseService) validate(expense models.Expense) error {
	if expense.Amount < 0 {
		return ErrInvalidAmount
	}
	if !validTransactionTypes[expense.Type] {
		return ErrInvalidType
	}
	if expense.CategoryID <= 0 {
		return ErrEmptyCategory
	}
	if expense.SubcategoryID == nil || *expense.SubcategoryID <= 0 {
		return ErrEmptySubcategory
	}
	if expense.PersonID <= 0 {
		return ErrEmptyPerson
	}
	if expense.PaymentMethodID <= 0 {
		return ErrEmptyPaymentMethod
	}
	if expense.BucketID <= 0 {
		return ErrEmptyBucket
	}
	if expense.BankID <= 0 {
		return ErrEmptyBank
	}
	if expense.Description == "" {
		return ErrEmptyDescription
	}
	if expense.Type == "investment" && (expense.InvestmentBoxID == nil || *expense.InvestmentBoxID <= 0) {
		return ErrEmptyInvestmentBox
	}
	return nil
}

// normalize clears the investment box on any non-investment transaction, since it only applies to that type.
func normalizeExpense(expense models.Expense) models.Expense {
	if expense.Type != "investment" {
		expense.InvestmentBoxID = nil
	}
	return expense
}

type InstallmentPurchaseInput struct {
	Description      string
	TotalAmount      float64
	InstallmentCount int
	PurchaseDate     time.Time
	CategoryID       int
	SubcategoryID    *int
	PersonID         int
	PaymentMethodID  int
	BucketID         int
	BankID           int
}

func (s *ExpenseService) CreateInstallmentPurchase(input InstallmentPurchaseInput) ([]models.Expense, error) {
	if input.TotalAmount <= 0 {
		return nil, ErrInvalidAmount
	}
	if input.InstallmentCount < minInstallmentCount || input.InstallmentCount > maxInstallmentCount {
		return nil, ErrInvalidInstallmentCount
	}
	if input.CategoryID <= 0 {
		return nil, ErrEmptyCategory
	}
	if input.SubcategoryID == nil || *input.SubcategoryID <= 0 {
		return nil, ErrEmptySubcategory
	}
	if input.PersonID <= 0 {
		return nil, ErrEmptyPerson
	}
	if input.PaymentMethodID <= 0 {
		return nil, ErrEmptyPaymentMethod
	}
	if input.BucketID <= 0 {
		return nil, ErrEmptyBucket
	}
	if input.BankID <= 0 {
		return nil, ErrEmptyBank
	}
	if input.Description == "" {
		return nil, ErrEmptyDescription
	}

	purchase := models.InstallmentPurchase{
		Description:      input.Description,
		TotalAmount:      input.TotalAmount,
		PurchaseDate:     input.PurchaseDate,
		InstallmentCount: input.InstallmentCount,
		CategoryID:       input.CategoryID,
		SubcategoryID:    input.SubcategoryID,
		PersonID:         input.PersonID,
		PaymentMethodID:  input.PaymentMethodID,
		BucketID:         input.BucketID,
		BankID:           input.BankID,
	}

	created, err := s.Repo.CreateInstallmentPurchase(purchase, installmentSlices(input.TotalAmount, input.InstallmentCount, input.PurchaseDate))
	if err != nil {
		if refErr := referencedEntityError(err); refErr != nil {
			return nil, refErr
		}
		return nil, err
	}

	return created, nil
}

// installmentSlices rounds total into count monthly slices, dumping the rounding remainder into the last one.
func installmentSlices(total float64, count int, start time.Time) []repositories.InstallmentSlice {
	base := math.Round(total/float64(count)*100) / 100

	slices := make([]repositories.InstallmentSlice, count)
	sum := 0.0
	for i := 0; i < count-1; i++ {
		slices[i] = repositories.InstallmentSlice{
			Number: i + 1,
			Amount: base,
			Date:   addMonthsClamped(start, i),
		}
		sum += base
	}
	slices[count-1] = repositories.InstallmentSlice{
		Number: count,
		Amount: math.Round((total-sum)*100) / 100,
		Date:   addMonthsClamped(start, count-1),
	}

	return slices
}

// addMonthsClamped adds months to t, clamping the day to the target month's last day.
func addMonthsClamped(t time.Time, months int) time.Time {
	firstOfTarget := time.Date(t.Year(), t.Month()+time.Month(months), 1, t.Hour(), t.Minute(), t.Second(), t.Nanosecond(), t.Location())
	lastDay := firstOfTarget.AddDate(0, 1, -1).Day()

	day := t.Day()
	if day > lastDay {
		day = lastDay
	}

	return time.Date(firstOfTarget.Year(), firstOfTarget.Month(), day, t.Hour(), t.Minute(), t.Second(), t.Nanosecond(), t.Location())
}

// ApplyDueRecurringExpenses backfills expenses for every month a rule missed since it last ran.
func (s *ExpenseService) ApplyDueRecurringExpenses() ([]models.Expense, error) {
	recurrences, err := s.RecurringRepo.GetAll()
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	currentMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	created := []models.Expense{}

	for _, recurring := range recurrences {
		cursor := time.Date(recurring.CreatedAt.Year(), recurring.CreatedAt.Month(), 1, 0, 0, 0, 0, time.UTC)
		if recurring.LastGeneratedYear != nil && recurring.LastGeneratedMonth != nil {
			cursor = time.Date(*recurring.LastGeneratedYear, time.Month(*recurring.LastGeneratedMonth), 1, 0, 0, 0, 0, time.UTC).AddDate(0, 1, 0)
		}

		for !cursor.After(currentMonth) {
			if recurring.IncludeInExpenses {
				recurringID := recurring.ID

				expense, err := s.Repo.Create(models.Expense{
					Description:        recurring.Description,
					Amount:             recurring.Amount,
					Type:               recurring.Type,
					CategoryID:         recurring.CategoryID,
					SubcategoryID:      recurring.SubcategoryID,
					PersonID:           recurring.PersonID,
					PaymentMethodID:    recurring.PaymentMethodID,
					BucketID:           recurring.BucketID,
					BankID:             recurring.BankID,
					Date:               dateForDay(cursor.Year(), cursor.Month(), recurring.DayOfMonth),
					RecurringExpenseID: &recurringID,
				})
				if err != nil {
					return created, err
				}

				created = append(created, expense)
			}

			if err := s.RecurringRepo.MarkGenerated(recurring.ID, cursor.Year(), int(cursor.Month())); err != nil {
				return created, err
			}

			cursor = cursor.AddDate(0, 1, 0)
		}
	}

	return created, nil
}

// dateForDay clamps day to the given month's last day (e.g. 31 in February becomes 28/29).
// Uses noon UTC rather than midnight so the date doesn't roll back a day once the frontend
// renders it in a timezone behind UTC (e.g. Brazil, UTC-3).
func dateForDay(year int, month time.Month, day int) time.Time {
	firstOfMonth := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC)
	lastDay := firstOfMonth.AddDate(0, 1, -1).Day()

	if day > lastDay {
		day = lastDay
	}

	return time.Date(year, month, day, 12, 0, 0, 0, time.UTC)
}

func referencedEntityError(err error) error {
	if violatesConstraint(err, "fk_expenses_category") {
		return ErrCategoryNotFound
	}
	if violatesConstraint(err, "fk_expenses_person") {
		return ErrPersonNotFound
	}
	if violatesConstraint(err, "fk_expenses_payment_method") {
		return ErrPaymentMethodNotFound
	}
	if violatesConstraint(err, "fk_expenses_bucket") {
		return ErrBucketNotFound
	}
	if violatesConstraint(err, "fk_expenses_bank") {
		return ErrBankNotFound
	}
	if violatesConstraint(err, "fk_expenses_investment_box") {
		return ErrInvestmentBoxNotFound
	}
	if violatesConstraint(err, "fk_expenses_subcategory") || violatesConstraint(err, "fk_installment_purchases_subcategory") {
		return ErrSubcategoryNotFound
	}
	return nil
}

// BulkExpenseRow is one row of a multi-row entry: either a plain expense or an installment purchase.
type BulkExpenseRow struct {
	IsInstallment bool
	Expense       models.Expense
	Installment   InstallmentPurchaseInput
}

type BulkRowResult struct {
	Row     int
	Created []models.Expense
	Err     error
}

// CreateBulk inserts each row independently, continuing past failures so valid rows still get
// created; the caller inspects each result to know which rows need fixing and resubmitting.
func (s *ExpenseService) CreateBulk(rows []BulkExpenseRow) []BulkRowResult {
	results := make([]BulkRowResult, len(rows))

	for i, row := range rows {
		if row.IsInstallment {
			created, err := s.CreateInstallmentPurchase(row.Installment)
			results[i] = BulkRowResult{Row: i, Created: created, Err: err}
			continue
		}

		created, err := s.Create(row.Expense)
		if err != nil {
			results[i] = BulkRowResult{Row: i, Err: err}
			continue
		}
		results[i] = BulkRowResult{Row: i, Created: []models.Expense{created}}
	}

	return results
}

func (s *ExpenseService) Create(expense models.Expense) (models.Expense, error) {
	expense = normalizeExpense(expense)
	if err := s.validate(expense); err != nil {
		return models.Expense{}, err
	}

	created, err := s.Repo.Create(expense)
	if err != nil {
		if refErr := referencedEntityError(err); refErr != nil {
			return models.Expense{}, refErr
		}
		return models.Expense{}, err
	}

	return created, nil
}

func (s *ExpenseService) GetAll() ([]models.Expense, error) {
	return s.Repo.GetAll()
}

func (s *ExpenseService) GetByID(id int) (models.Expense, error) {
	expense, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Expense{}, ErrExpenseNotFound
		}
		return models.Expense{}, err
	}

	return expense, nil
}

func (s *ExpenseService) Update(id int, expense models.Expense) (models.Expense, error) {
	expense = normalizeExpense(expense)
	if err := s.validate(expense); err != nil {
		return models.Expense{}, err
	}

	updated, err := s.Repo.Update(id, expense)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Expense{}, ErrExpenseNotFound
		}
		if refErr := referencedEntityError(err); refErr != nil {
			return models.Expense{}, refErr
		}
		return models.Expense{}, err
	}

	return updated, nil
}

func (s *ExpenseService) Delete(id int) error {
	err := s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrExpenseNotFound
		}
		return err
	}

	return nil
}
