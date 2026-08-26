package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type CategoryRepository struct {
	DB *sql.DB
}

func NewCategoryRepository(db *sql.DB) *CategoryRepository {
	return &CategoryRepository{DB: db}
}

func (r *CategoryRepository) Create(category models.Category) (models.Category, error) {
	query := "INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING id"

	err := r.DB.QueryRow(query, category.Name, category.Color).Scan(&category.ID)
	if err != nil {
		return models.Category{}, err
	}

	return category, nil
}

// CreateMany inserts all categories in a single transaction, rolling back entirely if any insert fails.
func (r *CategoryRepository) CreateMany(categories []models.Category) ([]models.Category, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	query := "INSERT INTO categories (name, color) VALUES ($1, $2) RETURNING id"

	created := make([]models.Category, len(categories))
	for i, category := range categories {
		if err := tx.QueryRow(query, category.Name, category.Color).Scan(&category.ID); err != nil {
			return nil, err
		}
		created[i] = category
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return created, nil
}

func (r *CategoryRepository) GetByID(id int) (models.Category, error) {
	query := "SELECT id, name, color, is_default FROM categories WHERE id = $1"

	var category models.Category
	err := r.DB.QueryRow(query, id).Scan(&category.ID, &category.Name, &category.Color, &category.IsDefault)
	if err != nil {
		return models.Category{}, err
	}

	return category, nil
}

func (r *CategoryRepository) GetAll() ([]models.Category, error) {
	query := "SELECT id, name, color, is_default FROM categories WHERE deleted_at IS NULL ORDER BY name"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := []models.Category{}

	for rows.Next() {
		var category models.Category

		err := rows.Scan(&category.ID, &category.Name, &category.Color, &category.IsDefault)
		if err != nil {
			return nil, err
		}

		categories = append(categories, category)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return categories, nil
}

func (r *CategoryRepository) Update(id int, category models.Category) (models.Category, error) {
	query := "UPDATE categories SET name = $1, color = $2 WHERE id = $3"

	result, err := r.DB.Exec(query, category.Name, category.Color, id)
	if err != nil {
		return models.Category{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Category{}, err
	}

	if rowsAffected == 0 {
		return models.Category{}, sql.ErrNoRows
	}

	category.ID = id
	return category, nil
}

// SetDefault marks the given category as the sole default, unsetting any previous default.
func (r *CategoryRepository) SetDefault(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("UPDATE categories SET is_default = FALSE WHERE is_default = TRUE"); err != nil {
		return err
	}

	result, err := tx.Exec("UPDATE categories SET is_default = TRUE WHERE id = $1", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return tx.Commit()
}

// Delete soft-deletes the category instead of removing its row, so expenses, installment purchases
// and recurring expenses that reference it keep showing its original name/color for history,
// while it drops out of GetAll and can no longer be selected for new/edited transactions.
func (r *CategoryRepository) Delete(id int) error {
	result, err := r.DB.Exec("UPDATE categories SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
