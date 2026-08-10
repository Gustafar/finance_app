package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type CategoryService struct {
	Repo *repositories.CategoryRepository
}

func NewCategoryService(repo *repositories.CategoryRepository) *CategoryService {
	return &CategoryService{Repo: repo}
}

func (s *CategoryService) validate(category models.Category) error {
	if category.Name == "" {
		return ErrEmptyCategoryName
	}
	if !validColorKeys[category.Color] {
		return ErrInvalidCategoryColor
	}
	return nil
}

func (s *CategoryService) Create(category models.Category) (models.Category, error) {
	if err := s.validate(category); err != nil {
		return models.Category{}, err
	}

	created, err := s.Repo.Create(category)
	if err != nil {
		if isDuplicateEntry(err) {
			return models.Category{}, ErrCategoryAlreadyExists
		}
		return models.Category{}, err
	}

	return created, nil
}

// CreateMany creates one category per name, assigning colors by rotating through the palette.
func (s *CategoryService) CreateMany(names []string) ([]models.Category, error) {
	if len(names) == 0 {
		return nil, ErrEmptyCategoryName
	}

	categories := make([]models.Category, len(names))
	for i, name := range names {
		if name == "" {
			return nil, ErrEmptyCategoryName
		}
		categories[i] = models.Category{
			Name:  name,
			Color: colorPalette[i%len(colorPalette)],
		}
	}

	created, err := s.Repo.CreateMany(categories)
	if err != nil {
		if isDuplicateEntry(err) {
			return nil, ErrCategoryAlreadyExists
		}
		return nil, err
	}

	return created, nil
}

func (s *CategoryService) GetAll() ([]models.Category, error) {
	return s.Repo.GetAll()
}

func (s *CategoryService) GetByID(id int) (models.Category, error) {
	category, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Category{}, ErrCategoryNotFound
		}
		return models.Category{}, err
	}

	return category, nil
}

func (s *CategoryService) Update(id int, category models.Category) (models.Category, error) {
	if err := s.validate(category); err != nil {
		return models.Category{}, err
	}

	updated, err := s.Repo.Update(id, category)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Category{}, ErrCategoryNotFound
		}
		if isDuplicateEntry(err) {
			return models.Category{}, ErrCategoryAlreadyExists
		}
		return models.Category{}, err
	}

	return updated, nil
}

func (s *CategoryService) SetDefault(id int) error {
	err := s.Repo.SetDefault(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrCategoryNotFound
		}
		return err
	}

	return nil
}

func (s *CategoryService) Delete(id int) error {
	category, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrCategoryNotFound
		}
		return err
	}

	if category.IsDefault {
		return ErrCannotDeleteDefaultCategory
	}

	err = s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrCategoryNotFound
		}
		return err
	}

	return nil
}
