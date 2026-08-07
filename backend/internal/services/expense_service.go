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
	Repo *repositories.ExpenseRepository
}

func NewExpenseService(repo *repositories.ExpenseRepository) *ExpenseService {
	return &ExpenseService{Repo: repo}
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
	if expense.Amount <= 0 {
		return ErrInvalidAmount
	}
	if !validTransactionTypes[expense.Type] {
		return ErrInvalidType
	}
	if expense.CategoryID <= 0 {
		return ErrEmptyCategory
	}
	if expense.PersonID <= 0 {
		return ErrEmptyPerson
	}
	if expense.PaymentMethodID <= 0 {
		return ErrEmptyPaymentMethod
	}
	if expense.CaixinhaID <= 0 {
		return ErrEmptyCaixinha
	}
	if expense.Description == "" {
		return ErrEmptyDescription
	}
	return nil
}

type InstallmentPurchaseInput struct {
	Description      string
	TotalAmount      float64
	InstallmentCount int
	PurchaseDate     time.Time
	CategoryID       int
	PersonID         int
	PaymentMethodID  int
	CaixinhaID       int
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
	if input.PersonID <= 0 {
		return nil, ErrEmptyPerson
	}
	if input.PaymentMethodID <= 0 {
		return nil, ErrEmptyPaymentMethod
	}
	if input.CaixinhaID <= 0 {
		return nil, ErrEmptyCaixinha
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
		PersonID:         input.PersonID,
		PaymentMethodID:  input.PaymentMethodID,
		CaixinhaID:       input.CaixinhaID,
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

// installmentSlices splits total into count monthly slices, each rounded to
// the cent, with the rounding remainder absorbed by the last installment so
// the slices always sum back to the original total exactly.
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

// addMonthsClamped adds the given number of months to t, clamping the day to
// the target month's last day (time.AddDate would otherwise overflow, e.g.
// Jan 31 + 1 month becoming Mar 3 instead of Feb 28/29).
func addMonthsClamped(t time.Time, months int) time.Time {
	firstOfTarget := time.Date(t.Year(), t.Month()+time.Month(months), 1, t.Hour(), t.Minute(), t.Second(), t.Nanosecond(), t.Location())
	lastDay := firstOfTarget.AddDate(0, 1, -1).Day()

	day := t.Day()
	if day > lastDay {
		day = lastDay
	}

	return time.Date(firstOfTarget.Year(), firstOfTarget.Month(), day, t.Hour(), t.Minute(), t.Second(), t.Nanosecond(), t.Location())
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
	if violatesConstraint(err, "fk_expenses_caixinha") {
		return ErrCaixinhaNotFound
	}
	return nil
}

func (s *ExpenseService) Create(expense models.Expense) (models.Expense, error) {
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
