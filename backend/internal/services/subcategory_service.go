package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type SubcategoryService struct {
	Repo *repositories.SubcategoryRepository
}

func NewSubcategoryService(repo *repositories.SubcategoryRepository) *SubcategoryService {
	return &SubcategoryService{Repo: repo}
}

func (s *SubcategoryService) validate(subcategory models.Subcategory) error {
	if subcategory.Name == "" {
		return ErrEmptySubcategoryName
	}
	if subcategory.CategoryID <= 0 {
		return ErrEmptySubcategoryCategory
	}
	return nil
}

func subcategoryReferencedEntityError(err error) error {
	if violatesConstraint(err, "fk_subcategories_category") {
		return ErrCategoryNotFound
	}
	return nil
}

func (s *SubcategoryService) Create(subcategory models.Subcategory) (models.Subcategory, error) {
	if err := s.validate(subcategory); err != nil {
		return models.Subcategory{}, err
	}

	created, err := s.Repo.Create(subcategory)
	if err != nil {
		if isDuplicateEntry(err) {
			return models.Subcategory{}, ErrSubcategoryAlreadyExists
		}
		if refErr := subcategoryReferencedEntityError(err); refErr != nil {
			return models.Subcategory{}, refErr
		}
		return models.Subcategory{}, err
	}

	return created, nil
}

func (s *SubcategoryService) GetAll() ([]models.Subcategory, error) {
	return s.Repo.GetAll()
}

func (s *SubcategoryService) GetByID(id int) (models.Subcategory, error) {
	subcategory, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Subcategory{}, ErrSubcategoryNotFound
		}
		return models.Subcategory{}, err
	}

	return subcategory, nil
}

func (s *SubcategoryService) Update(id int, subcategory models.Subcategory) (models.Subcategory, error) {
	if err := s.validate(subcategory); err != nil {
		return models.Subcategory{}, err
	}

	updated, err := s.Repo.Update(id, subcategory)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Subcategory{}, ErrSubcategoryNotFound
		}
		if isDuplicateEntry(err) {
			return models.Subcategory{}, ErrSubcategoryAlreadyExists
		}
		if refErr := subcategoryReferencedEntityError(err); refErr != nil {
			return models.Subcategory{}, refErr
		}
		return models.Subcategory{}, err
	}

	return updated, nil
}

func (s *SubcategoryService) Delete(id int) error {
	err := s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrSubcategoryNotFound
		}
		return err
	}

	return nil
}
