package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type ExpenseService struct {
	Repo *repositories.ExpenseRepository
}

func NewExpenseService(repo *repositories.ExpenseRepository) *ExpenseService {
	return &ExpenseService{Repo: repo}
}

func (s *ExpenseService) validate(expense models.Expense) error {
	if expense.Amount <= 0 {
		return ErrInvalidAmount
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
