package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type InvestmentBoxService struct {
	Repo *repositories.InvestmentBoxRepository
}

func NewInvestmentBoxService(repo *repositories.InvestmentBoxRepository) *InvestmentBoxService {
	return &InvestmentBoxService{Repo: repo}
}

func (s *InvestmentBoxService) validate(box models.InvestmentBox) error {
	if box.Name == "" {
		return ErrEmptyInvestmentBoxName
	}
	if !validColorKeys[box.Color] {
		return ErrInvalidInvestmentBoxColor
	}

	goalFieldsSet := 0
	if box.GoalAmount != nil {
		goalFieldsSet++
	}
	if box.GoalMonth != nil {
		goalFieldsSet++
	}
	if box.GoalYear != nil {
		goalFieldsSet++
	}
	if goalFieldsSet != 0 && goalFieldsSet != 3 {
		return ErrInvalidInvestmentBoxGoal
	}
	if goalFieldsSet == 3 {
		if *box.GoalAmount <= 0 {
			return ErrInvalidInvestmentBoxGoal
		}
		if *box.GoalMonth < 1 || *box.GoalMonth > 12 {
			return ErrInvalidInvestmentBoxGoal
		}
		if *box.GoalYear <= 0 {
			return ErrInvalidInvestmentBoxGoal
		}
	}

	return nil
}

func (s *InvestmentBoxService) Create(box models.InvestmentBox) (models.InvestmentBox, error) {
	if err := s.validate(box); err != nil {
		return models.InvestmentBox{}, err
	}

	created, err := s.Repo.Create(box)
	if err != nil {
		if isDuplicateEntry(err) {
			return models.InvestmentBox{}, ErrInvestmentBoxAlreadyExists
		}
		return models.InvestmentBox{}, err
	}

	return created, nil
}

func (s *InvestmentBoxService) GetAll() ([]models.InvestmentBox, error) {
	return s.Repo.GetAll()
}

func (s *InvestmentBoxService) GetByID(id int) (models.InvestmentBox, error) {
	box, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.InvestmentBox{}, ErrInvestmentBoxNotFound
		}
		return models.InvestmentBox{}, err
	}

	return box, nil
}

func (s *InvestmentBoxService) Update(id int, box models.InvestmentBox) (models.InvestmentBox, error) {
	if err := s.validate(box); err != nil {
		return models.InvestmentBox{}, err
	}

	updated, err := s.Repo.Update(id, box)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.InvestmentBox{}, ErrInvestmentBoxNotFound
		}
		if isDuplicateEntry(err) {
			return models.InvestmentBox{}, ErrInvestmentBoxAlreadyExists
		}
		return models.InvestmentBox{}, err
	}

	return updated, nil
}

func (s *InvestmentBoxService) SetDefault(id int) error {
	err := s.Repo.SetDefault(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrInvestmentBoxNotFound
		}
		return err
	}

	return nil
}

func (s *InvestmentBoxService) Delete(id int) error {
	box, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrInvestmentBoxNotFound
		}
		return err
	}

	if box.IsDefault {
		return ErrCannotDeleteDefaultInvestmentBox
	}

	err = s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrInvestmentBoxNotFound
		}
		return err
	}

	return nil
}
