package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type InvestmentBoxRepository struct {
	DB *sql.DB
}

func NewInvestmentBoxRepository(db *sql.DB) *InvestmentBoxRepository {
	return &InvestmentBoxRepository{DB: db}
}

func (r *InvestmentBoxRepository) Create(box models.InvestmentBox) (models.InvestmentBox, error) {
	query := "INSERT INTO investment_boxes (name, color, goal_amount, goal_month, goal_year) VALUES ($1, $2, $3, $4, $5) RETURNING id"

	err := r.DB.QueryRow(query, box.Name, box.Color, box.GoalAmount, box.GoalMonth, box.GoalYear).Scan(&box.ID)
	if err != nil {
		return models.InvestmentBox{}, err
	}

	return box, nil
}

func (r *InvestmentBoxRepository) GetByID(id int) (models.InvestmentBox, error) {
	query := "SELECT id, name, color, is_default, goal_amount, goal_month, goal_year FROM investment_boxes WHERE id = $1"

	var box models.InvestmentBox
	err := r.DB.QueryRow(query, id).Scan(&box.ID, &box.Name, &box.Color, &box.IsDefault, &box.GoalAmount, &box.GoalMonth, &box.GoalYear)
	if err != nil {
		return models.InvestmentBox{}, err
	}

	return box, nil
}

func (r *InvestmentBoxRepository) GetAll() ([]models.InvestmentBox, error) {
	query := "SELECT id, name, color, is_default, goal_amount, goal_month, goal_year FROM investment_boxes ORDER BY name"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	boxes := []models.InvestmentBox{}

	for rows.Next() {
		var box models.InvestmentBox

		err := rows.Scan(&box.ID, &box.Name, &box.Color, &box.IsDefault, &box.GoalAmount, &box.GoalMonth, &box.GoalYear)
		if err != nil {
			return nil, err
		}

		boxes = append(boxes, box)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return boxes, nil
}

func (r *InvestmentBoxRepository) Update(id int, box models.InvestmentBox) (models.InvestmentBox, error) {
	query := "UPDATE investment_boxes SET name = $1, color = $2, goal_amount = $3, goal_month = $4, goal_year = $5 WHERE id = $6"

	result, err := r.DB.Exec(query, box.Name, box.Color, box.GoalAmount, box.GoalMonth, box.GoalYear, id)
	if err != nil {
		return models.InvestmentBox{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.InvestmentBox{}, err
	}

	if rowsAffected == 0 {
		return models.InvestmentBox{}, sql.ErrNoRows
	}

	box.ID = id
	return box, nil
}

// SetDefault marks the given investment box as the sole default, unsetting any previous default.
func (r *InvestmentBoxRepository) SetDefault(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("UPDATE investment_boxes SET is_default = FALSE WHERE is_default = TRUE"); err != nil {
		return err
	}

	result, err := tx.Exec("UPDATE investment_boxes SET is_default = TRUE WHERE id = $1", id)
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

// Delete reassigns referencing expenses to the default investment box first, so deleting never orphans data.
func (r *InvestmentBoxRepository) Delete(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var defaultID int
	err = tx.QueryRow("SELECT id FROM investment_boxes WHERE is_default = TRUE LIMIT 1").Scan(&defaultID)
	if err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE expenses SET investment_box_id = $1 WHERE investment_box_id = $2", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM investment_boxes WHERE id = $1", id)
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
