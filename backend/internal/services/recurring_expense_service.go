package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type RecurringExpenseService struct {
	Repo *repositories.RecurringExpenseRepository
}

func NewRecurringExpenseService(repo *repositories.RecurringExpenseRepository) *RecurringExpenseService {
	return &RecurringExpenseService{Repo: repo}
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
	if recurring.PersonID <= 0 {
		return ErrEmptyPerson
	}
	if recurring.PaymentMethodID <= 0 {
		return ErrEmptyPaymentMethod
	}
	if recurring.CaixinhaID <= 0 {
		return ErrEmptyCaixinha
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
	if violatesConstraint(err, "fk_recurring_expenses_caixinha") {
		return ErrCaixinhaNotFound
	}
	return nil
}

func (s *RecurringExpenseService) Create(recurring models.RecurringExpense) (models.RecurringExpense, error) {
	if err := s.validate(recurring); err != nil {
		return models.RecurringExpense{}, err
	}

	created, err := s.Repo.Create(recurring)
	if err != nil {
		if refErr := recurringReferencedEntityError(err); refErr != nil {
			return models.RecurringExpense{}, refErr
		}
		return models.RecurringExpense{}, err
	}

	return created, nil
}

func (s *RecurringExpenseService) GetAll() ([]models.RecurringExpense, error) {
	return s.Repo.GetAll()
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

	updated, err := s.Repo.Update(id, recurring)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.RecurringExpense{}, ErrRecurringExpenseNotFound
		}
		if refErr := recurringReferencedEntityError(err); refErr != nil {
			return models.RecurringExpense{}, refErr
		}
		return models.RecurringExpense{}, err
	}

	return updated, nil
}

func (s *RecurringExpenseService) Delete(id int) error {
	err := s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrRecurringExpenseNotFound
		}
		return err
	}

	return nil
}
