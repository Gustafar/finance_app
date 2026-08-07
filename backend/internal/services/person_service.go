package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type PersonService struct {
	Repo *repositories.PersonRepository
}

func NewPersonService(repo *repositories.PersonRepository) *PersonService {
	return &PersonService{Repo: repo}
}

func (s *PersonService) validate(person models.Person) error {
	if person.Name == "" {
		return ErrEmptyPersonName
	}
	if !validColorKeys[person.Color] {
		return ErrInvalidPersonColor
	}
	return nil
}

func (s *PersonService) Create(person models.Person) (models.Person, error) {
	if err := s.validate(person); err != nil {
		return models.Person{}, err
	}

	created, err := s.Repo.Create(person)
	if err != nil {
		if isDuplicateEntry(err) {
			return models.Person{}, ErrPersonAlreadyExists
		}
		return models.Person{}, err
	}

	return created, nil
}

func (s *PersonService) GetAll() ([]models.Person, error) {
	return s.Repo.GetAll()
}

func (s *PersonService) GetByID(id int) (models.Person, error) {
	person, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Person{}, ErrPersonNotFound
		}
		return models.Person{}, err
	}

	return person, nil
}

func (s *PersonService) Update(id int, person models.Person) (models.Person, error) {
	if err := s.validate(person); err != nil {
		return models.Person{}, err
	}

	updated, err := s.Repo.Update(id, person)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Person{}, ErrPersonNotFound
		}
		if isDuplicateEntry(err) {
			return models.Person{}, ErrPersonAlreadyExists
		}
		return models.Person{}, err
	}

	return updated, nil
}

func (s *PersonService) Delete(id int) error {
	person, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrPersonNotFound
		}
		return err
	}

	if person.IsDefault {
		return ErrCannotDeleteDefaultPerson
	}

	err = s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrPersonNotFound
		}
		return err
	}

	return nil
}
