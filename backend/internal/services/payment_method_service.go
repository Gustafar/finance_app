package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type PaymentMethodService struct {
	Repo *repositories.PaymentMethodRepository
}

func NewPaymentMethodService(repo *repositories.PaymentMethodRepository) *PaymentMethodService {
	return &PaymentMethodService{Repo: repo}
}

func (s *PaymentMethodService) validate(paymentMethod models.PaymentMethod) error {
	if paymentMethod.Name == "" {
		return ErrEmptyPaymentMethodName
	}
	if !validColorKeys[paymentMethod.Color] {
		return ErrInvalidPaymentMethodColor
	}
	return nil
}

func (s *PaymentMethodService) Create(paymentMethod models.PaymentMethod) (models.PaymentMethod, error) {
	if err := s.validate(paymentMethod); err != nil {
		return models.PaymentMethod{}, err
	}

	created, err := s.Repo.Create(paymentMethod)
	if err != nil {
		if isDuplicateEntry(err) {
			return models.PaymentMethod{}, ErrPaymentMethodAlreadyExists
		}
		return models.PaymentMethod{}, err
	}

	return created, nil
}

func (s *PaymentMethodService) GetAll() ([]models.PaymentMethod, error) {
	return s.Repo.GetAll()
}

func (s *PaymentMethodService) GetByID(id int) (models.PaymentMethod, error) {
	paymentMethod, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.PaymentMethod{}, ErrPaymentMethodNotFound
		}
		return models.PaymentMethod{}, err
	}

	return paymentMethod, nil
}

func (s *PaymentMethodService) Update(id int, paymentMethod models.PaymentMethod) (models.PaymentMethod, error) {
	if err := s.validate(paymentMethod); err != nil {
		return models.PaymentMethod{}, err
	}

	updated, err := s.Repo.Update(id, paymentMethod)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.PaymentMethod{}, ErrPaymentMethodNotFound
		}
		if isDuplicateEntry(err) {
			return models.PaymentMethod{}, ErrPaymentMethodAlreadyExists
		}
		return models.PaymentMethod{}, err
	}

	return updated, nil
}

func (s *PaymentMethodService) Delete(id int) error {
	paymentMethod, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrPaymentMethodNotFound
		}
		return err
	}

	if paymentMethod.IsDefault {
		return ErrCannotDeleteDefaultPaymentMethod
	}

	err = s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrPaymentMethodNotFound
		}
		return err
	}

	return nil
}
