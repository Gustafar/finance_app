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
	query := "INSERT INTO categories (name, color) VALUES (?, ?)"

	result, err := r.DB.Exec(query, category.Name, category.Color)
	if err != nil {
		return models.Category{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.Category{}, err
	}

	category.ID = int(id)
	return category, nil
}

func (r *CategoryRepository) GetByID(id int) (models.Category, error) {
	query := "SELECT id, name, color, is_default FROM categories WHERE id = ?"

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
	query := "UPDATE categories SET name = ?, color = ? WHERE id = ?"

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

// Delete removes a category after reassigning any expenses that reference it
// to the default category, so deleting a category never orphans expense data.
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

	if _, err := tx.Exec("UPDATE expenses SET category_id = ? WHERE category_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE installment_purchases SET category_id = ? WHERE category_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE recurring_expenses SET category_id = ? WHERE category_id = ?", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM categories WHERE id = ?", id)
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
