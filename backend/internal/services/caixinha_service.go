package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type CaixinhaService struct {
	Repo *repositories.CaixinhaRepository
}

func NewCaixinhaService(repo *repositories.CaixinhaRepository) *CaixinhaService {
	return &CaixinhaService{Repo: repo}
}

func (s *CaixinhaService) validate(caixinha models.Caixinha) error {
	if caixinha.Name == "" {
		return ErrEmptyCaixinhaName
	}
	if !validColorKeys[caixinha.Color] {
		return ErrInvalidCaixinhaColor
	}
	return nil
}

func (s *CaixinhaService) Create(caixinha models.Caixinha) (models.Caixinha, error) {
	if err := s.validate(caixinha); err != nil {
		return models.Caixinha{}, err
	}

	created, err := s.Repo.Create(caixinha)
	if err != nil {
		if isDuplicateEntry(err) {
			return models.Caixinha{}, ErrCaixinhaAlreadyExists
		}
		return models.Caixinha{}, err
	}

	return created, nil
}

func (s *CaixinhaService) GetAll() ([]models.Caixinha, error) {
	return s.Repo.GetAll()
}

func (s *CaixinhaService) GetByID(id int) (models.Caixinha, error) {
	caixinha, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Caixinha{}, ErrCaixinhaNotFound
		}
		return models.Caixinha{}, err
	}

	return caixinha, nil
}

func (s *CaixinhaService) Update(id int, caixinha models.Caixinha) (models.Caixinha, error) {
	if err := s.validate(caixinha); err != nil {
		return models.Caixinha{}, err
	}

	updated, err := s.Repo.Update(id, caixinha)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Caixinha{}, ErrCaixinhaNotFound
		}
		if isDuplicateEntry(err) {
			return models.Caixinha{}, ErrCaixinhaAlreadyExists
		}
		return models.Caixinha{}, err
	}

	return updated, nil
}

func (s *CaixinhaService) Delete(id int) error {
	caixinha, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrCaixinhaNotFound
		}
		return err
	}

	if caixinha.IsDefault {
		return ErrCannotDeleteDefaultCaixinha
	}

	err = s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrCaixinhaNotFound
		}
		return err
	}

	return nil
}
