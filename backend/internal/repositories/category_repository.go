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
	query := "SELECT id, name, color, is_default FROM categories ORDER BY name"

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

// Delete reassigns referencing expenses to the default category first, so deleting never orphans data.
func (r *CategoryRepository) Delete(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var defaultID int
	err = tx.QueryRow("SELECT id FROM categories WHERE is_default = TRUE LIMIT 1").Scan(&defaultID)
	if err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE expenses SET category_id = $1 WHERE category_id = $2", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE installment_purchases SET category_id = $1 WHERE category_id = $2", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE recurring_expenses SET category_id = $1 WHERE category_id = $2", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM categories WHERE id = $1", id)
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
