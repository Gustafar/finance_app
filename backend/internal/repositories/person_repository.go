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
	query := "INSERT INTO people (name, color) VALUES (?, ?)"

	result, err := r.DB.Exec(query, person.Name, person.Color)
	if err != nil {
		return models.Person{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.Person{}, err
	}

	person.ID = int(id)
	return person, nil
}

func (r *PersonRepository) GetByID(id int) (models.Person, error) {
	query := "SELECT id, name, color, is_default FROM people WHERE id = ?"

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
	query := "UPDATE people SET name = ?, color = ? WHERE id = ?"

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

	if _, err := tx.Exec("UPDATE expenses SET person_id = ? WHERE person_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE installment_purchases SET person_id = ? WHERE person_id = ?", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE recurring_expenses SET person_id = ? WHERE person_id = ?", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM people WHERE id = ?", id)
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
