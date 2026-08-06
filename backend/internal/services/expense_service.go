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
	if expense.Category == "" {
		return ErrEmptyCategory
	}
	if expense.Description == "" {
		return ErrEmptyDescription
	}
	return nil
}

func (s *ExpenseService) Create(expense models.Expense) (models.Expense, error) {
	if err := s.validate(expense); err != nil {
		return models.Expense{}, err
	}

	return s.Repo.Create(expense)
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
