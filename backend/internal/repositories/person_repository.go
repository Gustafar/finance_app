package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type PersonRepository struct {
	DB *sql.DB
}

func NewPersonRepository(db *sql.DB) *PersonRepository {
	return &PersonRepository{DB: db}
}

func (r *PersonRepository) Create(person models.Person) (models.Person, error) {
	query := "INSERT INTO people (name, color) VALUES ($1, $2) RETURNING id"

	err := r.DB.QueryRow(query, person.Name, person.Color).Scan(&person.ID)
	if err != nil {
		return models.Person{}, err
	}

	return person, nil
}

func (r *PersonRepository) GetByID(id int) (models.Person, error) {
	query := "SELECT id, name, color, is_default FROM people WHERE id = $1"

	var person models.Person
	err := r.DB.QueryRow(query, id).Scan(&person.ID, &person.Name, &person.Color, &person.IsDefault)
	if err != nil {
		return models.Person{}, err
	}

	return person, nil
}

func (r *PersonRepository) GetAll() ([]models.Person, error) {
	query := "SELECT id, name, color, is_default FROM people ORDER BY name"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	people := []models.Person{}

	for rows.Next() {
		var person models.Person

		err := rows.Scan(&person.ID, &person.Name, &person.Color, &person.IsDefault)
		if err != nil {
			return nil, err
		}

		people = append(people, person)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return people, nil
}

func (r *PersonRepository) Update(id int, person models.Person) (models.Person, error) {
	query := "UPDATE people SET name = $1, color = $2 WHERE id = $3"

	result, err := r.DB.Exec(query, person.Name, person.Color, id)
	if err != nil {
		return models.Person{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Person{}, err
	}

	if rowsAffected == 0 {
		return models.Person{}, sql.ErrNoRows
	}

	person.ID = id
	return person, nil
}

// SetDefault marks the given person as the sole default, unsetting any previous default.
func (r *PersonRepository) SetDefault(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("UPDATE people SET is_default = FALSE WHERE is_default = TRUE"); err != nil {
		return err
	}

	result, err := tx.Exec("UPDATE people SET is_default = TRUE WHERE id = $1", id)
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

// Delete reassigns referencing expenses to the default person first, so deleting never orphans data.
func (r *PersonRepository) Delete(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var defaultID int
	err = tx.QueryRow("SELECT id FROM people WHERE is_default = TRUE LIMIT 1").Scan(&defaultID)
	if err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE expenses SET person_id = $1 WHERE person_id = $2", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE installment_purchases SET person_id = $1 WHERE person_id = $2", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE recurring_expenses SET person_id = $1 WHERE person_id = $2", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM people WHERE id = $1", id)
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
