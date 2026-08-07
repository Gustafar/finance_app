package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type CaixinhaRepository struct {
	DB *sql.DB
}

func NewCaixinhaRepository(db *sql.DB) *CaixinhaRepository {
	return &CaixinhaRepository{DB: db}
}

func (r *CaixinhaRepository) Create(caixinha models.Caixinha) (models.Caixinha, error) {
	query := "INSERT INTO caixinhas (name, color) VALUES (?, ?)"

	result, err := r.DB.Exec(query, caixinha.Name, caixinha.Color)
	if err != nil {
		return models.Caixinha{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.Caixinha{}, err
	}

	caixinha.ID = int(id)
	return caixinha, nil
}

func (r *CaixinhaRepository) GetByID(id int) (models.Caixinha, error) {
	query := "SELECT id, name, color, is_default FROM caixinhas WHERE id = ?"

	var caixinha models.Caixinha
	err := r.DB.QueryRow(query, id).Scan(&caixinha.ID, &caixinha.Name, &caixinha.Color, &caixinha.IsDefault)
	if err != nil {
		return models.Caixinha{}, err
	}

	return caixinha, nil
}

func (r *CaixinhaRepository) GetAll() ([]models.Caixinha, error) {
	query := "SELECT id, name, color, is_default FROM caixinhas ORDER BY name"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	caixinhas := []models.Caixinha{}

	for rows.Next() {
		var caixinha models.Caixinha

		err := rows.Scan(&caixinha.ID, &caixinha.Name, &caixinha.Color, &caixinha.IsDefault)
		if err != nil {
			return nil, err
		}

		caixinhas = append(caixinhas, caixinha)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return caixinhas, nil
}

func (r *CaixinhaRepository) Update(id int, caixinha models.Caixinha) (models.Caixinha, error) {
	query := "UPDATE caixinhas SET name = ?, color = ? WHERE id = ?"

	result, err := r.DB.Exec(query, caixinha.Name, caixinha.Color, id)
	if err != nil {
		return models.Caixinha{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Caixinha{}, err
	}

	if rowsAffected == 0 {
		return models.Caixinha{}, sql.ErrNoRows
	}

	caixinha.ID = id
	return caixinha, nil
}

// Delete removes a caixinha after reassigning any expenses that reference it
// to the default caixinha, so deleting one never orphans expense data.
func (r *CaixinhaRepository) Delete(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var defaultID int
	err = tx.QueryRow("SELECT id FROM caixinhas WHERE is_default = TRUE LIMIT 1").Scan(&defaultID)
	if err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE expenses SET caixinha_id = ? WHERE caixinha_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE installment_purchases SET caixinha_id = ? WHERE caixinha_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE recurring_expenses SET caixinha_id = ? WHERE caixinha_id = ?", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM caixinhas WHERE id = ?", id)
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
