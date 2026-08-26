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
	query := "SELECT id, name, color, is_default, goal_amount, goal_month, goal_year FROM investment_boxes WHERE deleted_at IS NULL ORDER BY name"

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

// Delete soft-deletes the investment box instead of removing its row, so expenses that reference
// it keep showing its original name/color for history, while it drops out of GetAll and can no
// longer be selected for new/edited transactions.
func (r *InvestmentBoxRepository) Delete(id int) error {
	result, err := r.DB.Exec("UPDATE investment_boxes SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL", id)
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
