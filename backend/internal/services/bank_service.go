package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type BankService struct {
	Repo *repositories.BankRepository
}

func NewBankService(repo *repositories.BankRepository) *BankService {
	return &BankService{Repo: repo}
}

func (s *BankService) validate(bank models.Bank) error {
	if bank.Name == "" {
		return ErrEmptyBankName
	}
	if !validColorKeys[bank.Color] {
		return ErrInvalidBankColor
	}
	return nil
}

func (s *BankService) Create(bank models.Bank) (models.Bank, error) {
	if err := s.validate(bank); err != nil {
		return models.Bank{}, err
	}

	created, err := s.Repo.Create(bank)
	if err != nil {
		if isDuplicateEntry(err) {
			return models.Bank{}, ErrBankAlreadyExists
		}
		return models.Bank{}, err
	}

	return created, nil
}

func (s *BankService) GetAll() ([]models.Bank, error) {
	return s.Repo.GetAll()
}

func (s *BankService) GetByID(id int) (models.Bank, error) {
	bank, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Bank{}, ErrBankNotFound
		}
		return models.Bank{}, err
	}

	return bank, nil
}

func (s *BankService) Update(id int, bank models.Bank) (models.Bank, error) {
	if err := s.validate(bank); err != nil {
		return models.Bank{}, err
	}

	updated, err := s.Repo.Update(id, bank)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Bank{}, ErrBankNotFound
		}
		if isDuplicateEntry(err) {
			return models.Bank{}, ErrBankAlreadyExists
		}
		return models.Bank{}, err
	}

	return updated, nil
}

func (s *BankService) SetDefault(id int) error {
	err := s.Repo.SetDefault(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrBankNotFound
		}
		return err
	}

	return nil
}

func (s *BankService) Delete(id int) error {
	bank, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrBankNotFound
		}
		return err
	}

	if bank.IsDefault {
		return ErrCannotDeleteDefaultBank
	}

	err = s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrBankNotFound
		}
		return err
	}

	return nil
}
