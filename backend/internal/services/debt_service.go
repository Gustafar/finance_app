package services

import (
	"database/sql"
	"errors"
	"strings"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
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
