package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type SubcategoryRepository struct {
	DB *sql.DB
}

func NewSubcategoryRepository(db *sql.DB) *SubcategoryRepository {
	return &SubcategoryRepository{DB: db}
}

func (r *SubcategoryRepository) Create(subcategory models.Subcategory) (models.Subcategory, error) {
	query := "INSERT INTO subcategories (name, category_id) VALUES ($1, $2) RETURNING id"

	err := r.DB.QueryRow(query, subcategory.Name, subcategory.CategoryID).Scan(&subcategory.ID)
	if err != nil {
		return models.Subcategory{}, err
	}

	return subcategory, nil
}

func (r *SubcategoryRepository) GetByID(id int) (models.Subcategory, error) {
	query := "SELECT id, name, category_id FROM subcategories WHERE id = $1"

	var subcategory models.Subcategory
	err := r.DB.QueryRow(query, id).Scan(&subcategory.ID, &subcategory.Name, &subcategory.CategoryID)
	if err != nil {
		return models.Subcategory{}, err
	}

	return subcategory, nil
}

func (r *SubcategoryRepository) GetAll() ([]models.Subcategory, error) {
	query := "SELECT id, name, category_id FROM subcategories WHERE deleted_at IS NULL ORDER BY name"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	subcategories := []models.Subcategory{}

	for rows.Next() {
		var subcategory models.Subcategory

		err := rows.Scan(&subcategory.ID, &subcategory.Name, &subcategory.CategoryID)
		if err != nil {
			return nil, err
		}

		subcategories = append(subcategories, subcategory)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return subcategories, nil
}

func (r *SubcategoryRepository) Update(id int, subcategory models.Subcategory) (models.Subcategory, error) {
	query := "UPDATE subcategories SET name = $1, category_id = $2 WHERE id = $3"

	result, err := r.DB.Exec(query, subcategory.Name, subcategory.CategoryID, id)
	if err != nil {
		return models.Subcategory{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Subcategory{}, err
	}

	if rowsAffected == 0 {
		return models.Subcategory{}, sql.ErrNoRows
	}

	subcategory.ID = id
	return subcategory, nil
}

// Delete soft-deletes the subcategory instead of removing its row, so expenses, installment
// purchases and recurring expenses that reference it keep showing its original name for history,
// while it drops out of GetAll and can no longer be selected for new/edited transactions.
func (r *SubcategoryRepository) Delete(id int) error {
	query := "UPDATE subcategories SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"

	result, err := r.DB.Exec(query, id)
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
