package services

import (
	"database/sql"
	"errors"
	"math"
	"strings"
	"time"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

const (
	minDebtInstallmentCount = 2
	maxDebtInstallmentCount = 60
)

type DebtService struct {
	Repo *repositories.DebtRepository
}

func NewDebtService(repo *repositories.DebtRepository) *DebtService {
	return &DebtService{Repo: repo}
}

func (s *DebtService) validate(debt models.Debt) error {
	if debt.Direction != "receivable" && debt.Direction != "payable" {
		return ErrInvalidDebtDirection
	}
	if strings.TrimSpace(debt.CounterpartyName) == "" {
		return ErrEmptyDebtCounterparty
	}
	if strings.TrimSpace(debt.Description) == "" {
		return ErrEmptyDebtDescription
	}
	if debt.Amount < 0 {
		return ErrInvalidDebtAmount
	}
	if debt.IncurredOn.IsZero() {
		return ErrInvalidDebtDate
	}
	return nil
}

func (s *DebtService) validatePayment(payment models.DebtPayment) error {
	if payment.Amount <= 0 {
		return ErrInvalidDebtPaymentAmount
	}
	if payment.PaidOn.IsZero() {
		return ErrInvalidDebtPaymentDate
	}
	return nil
}

func normalizeDebt(debt models.Debt) models.Debt {
	debt.CounterpartyName = strings.TrimSpace(debt.CounterpartyName)
	debt.Description = strings.TrimSpace(debt.Description)
	if debt.Comment != nil {
		trimmed := strings.TrimSpace(*debt.Comment)
		if trimmed == "" {
			debt.Comment = nil
		} else {
			debt.Comment = &trimmed
		}
	}
	if debt.AmountFormula != nil {
		trimmed := strings.TrimSpace(*debt.AmountFormula)
		if trimmed == "" {
			debt.AmountFormula = nil
		} else {
			debt.AmountFormula = &trimmed
		}
	}
	return debt
}

func (s *DebtService) GetAll() ([]models.Debt, error) {
	return s.Repo.GetAll()
}

func (s *DebtService) Create(debt models.Debt) (models.Debt, error) {
	if err := s.validate(debt); err != nil {
		return models.Debt{}, err
	}
	return s.Repo.Create(normalizeDebt(debt))
}

// CreateInstallments splits debt.Amount into count monthly slices and stores each as its own debt.
func (s *DebtService) CreateInstallments(debt models.Debt, count int) ([]models.Debt, error) {
	if err := s.validate(debt); err != nil {
		return nil, err
	}
	if debt.Amount <= 0 {
		return nil, ErrInvalidDebtAmount
	}
	if count < minDebtInstallmentCount || count > maxDebtInstallmentCount {
		return nil, ErrInvalidInstallmentCount
	}

	debt = normalizeDebt(debt)
	return s.Repo.CreateInstallments(debt, debtInstallmentSlices(debt.Amount, count, debt.IncurredOn, debt.DueDate))
}

// debtInstallmentSlices rounds total into count monthly slices, dumping the rounding remainder
// into the last one. incurred_on (and due_date, if any) advance one month per slice.
func debtInstallmentSlices(total float64, count int, start time.Time, due *time.Time) []repositories.DebtInstallmentSlice {
	base := math.Round(total/float64(count)*100) / 100

	slices := make([]repositories.DebtInstallmentSlice, count)
	sum := 0.0
	for i := 0; i < count-1; i++ {
		slices[i] = repositories.DebtInstallmentSlice{
			Number:     i + 1,
			Amount:     base,
			IncurredOn: addMonthsClamped(start, i),
			DueDate:    shiftDatePtr(due, i),
		}
		sum += base
	}
	slices[count-1] = repositories.DebtInstallmentSlice{
		Number:     count,
		Amount:     math.Round((total-sum)*100) / 100,
		IncurredOn: addMonthsClamped(start, count-1),
		DueDate:    shiftDatePtr(due, count-1),
	}
	return slices
}

func shiftDatePtr(t *time.Time, months int) *time.Time {
	if t == nil {
		return nil
	}
	shifted := addMonthsClamped(*t, months)
	return &shifted
}

func (s *DebtService) Update(id int, debt models.Debt) (models.Debt, error) {
	if err := s.validate(debt); err != nil {
		return models.Debt{}, err
	}

	updated, err := s.Repo.Update(id, normalizeDebt(debt))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Debt{}, ErrDebtNotFound
		}
		return models.Debt{}, err
	}
	return updated, nil
}

// UpdateWithScope updates the debt at id as usual, then — if it belongs to an installment group
// and scope reaches beyond it — propagates the shared fields (direction, counterparty, description,
// comment) to the rest of the group's installments and reschedules their incurred_on monthly around
// the edited installment.
func (s *DebtService) UpdateWithScope(id int, debt models.Debt, scope InstallmentScope) (models.Debt, error) {
	current, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Debt{}, ErrDebtNotFound
		}
		return models.Debt{}, err
	}

	updated, err := s.Update(id, debt)
	if err != nil {
		return models.Debt{}, err
	}

	reaches := scope == InstallmentScopeFuture || scope == InstallmentScopeAll
	if reaches && current.InstallmentGroupID != nil {
		fromNumber := 0
		if scope == InstallmentScopeFuture {
			fromNumber = *current.InstallmentNumber
		}

		if err := s.Repo.UpdateInstallmentGroup(*current.InstallmentGroupID, id, fromNumber, normalizeDebt(debt)); err != nil {
			return models.Debt{}, err
		}

		anchorNumber := *current.InstallmentNumber
		dates := make(map[int]time.Time)
		for n := 1; n <= *current.InstallmentCount; n++ {
			if n == anchorNumber || (scope == InstallmentScopeFuture && n < anchorNumber) {
				continue
			}
			dates[n] = addMonthsClamped(updated.IncurredOn, n-anchorNumber)
		}
		if len(dates) > 0 {
			if err := s.Repo.RescheduleInstallmentDates(*current.InstallmentGroupID, dates); err != nil {
				return models.Debt{}, err
			}
		}
	}

	return updated, nil
}

func (s *DebtService) Delete(id int) error {
	err := s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrDebtNotFound
		}
		return err
	}
	return nil
}

// DeleteWithScope deletes the debt at id; if it belongs to an installment group and scope reaches
// beyond it, it also deletes the later (or all) installments of that group.
func (s *DebtService) DeleteWithScope(id int, scope InstallmentScope) error {
	if scope != InstallmentScopeFuture && scope != InstallmentScopeAll {
		return s.Delete(id)
	}

	current, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrDebtNotFound
		}
		return err
	}

	if current.InstallmentGroupID == nil {
		return s.Delete(id)
	}

	fromNumber := 0
	if scope == InstallmentScopeFuture {
		fromNumber = *current.InstallmentNumber
	}

	return s.Repo.DeleteInstallmentGroup(*current.InstallmentGroupID, fromNumber)
}

func (s *DebtService) AddPayment(debtID int, payment models.DebtPayment) (models.Debt, error) {
	if err := s.validatePayment(payment); err != nil {
		return models.Debt{}, err
	}

	if _, err := s.Repo.GetByID(debtID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Debt{}, ErrDebtNotFound
		}
		return models.Debt{}, err
	}

	if payment.Comment != nil {
		trimmed := strings.TrimSpace(*payment.Comment)
		if trimmed == "" {
			payment.Comment = nil
		} else {
			payment.Comment = &trimmed
		}
	}

	return s.Repo.AddPayment(debtID, payment)
}

func (s *DebtService) DeletePayment(debtID, paymentID int) (models.Debt, error) {
	debt, err := s.Repo.DeletePayment(debtID, paymentID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Debt{}, ErrDebtPaymentNotFound
		}
		return models.Debt{}, err
	}
	return debt, nil
}
