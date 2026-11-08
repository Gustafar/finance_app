package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type MonthNoteRepository struct {
	DB *sql.DB
}

func NewMonthNoteRepository(db *sql.DB) *MonthNoteRepository {
	return &MonthNoteRepository{DB: db}
}

func (r *MonthNoteRepository) GetByMonth(year, month int) ([]models.MonthNote, error) {
	query := `SELECT id, year, month, title, content, created_at, updated_at
		FROM month_notes WHERE year = $1 AND month = $2 ORDER BY created_at DESC, id DESC`

	rows, err := r.DB.Query(query, year, month)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notes := []models.MonthNote{}
	for rows.Next() {
		var note models.MonthNote
		if err := rows.Scan(&note.ID, &note.Year, &note.Month, &note.Title, &note.Content, &note.CreatedAt, &note.UpdatedAt); err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return notes, nil
}

func (r *MonthNoteRepository) Create(note models.MonthNote) (models.MonthNote, error) {
	query := `INSERT INTO month_notes (year, month, title, content) VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`

	err := r.DB.QueryRow(query, note.Year, note.Month, note.Title, note.Content).
		Scan(&note.ID, &note.CreatedAt, &note.UpdatedAt)
	if err != nil {
		return models.MonthNote{}, err
	}

	return note, nil
}

// Update changes only title and content; the note stays in the month it was created for.
func (r *MonthNoteRepository) Update(id int, note models.MonthNote) (models.MonthNote, error) {
	query := `UPDATE month_notes SET title = $1, content = $2, updated_at = now() WHERE id = $3
		RETURNING id, year, month, title, content, created_at, updated_at`

	var updated models.MonthNote
	err := r.DB.QueryRow(query, note.Title, note.Content, id).
		Scan(&updated.ID, &updated.Year, &updated.Month, &updated.Title, &updated.Content, &updated.CreatedAt, &updated.UpdatedAt)
	if err != nil {
		return models.MonthNote{}, err
	}

	return updated, nil
}

func (r *MonthNoteRepository) Delete(id int) error {
	result, err := r.DB.Exec("DELETE FROM month_notes WHERE id = $1", id)
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
