package repositories

import (
	"database/sql"

	"finance_app/internal/models"
)

type BucketRepository struct {
	DB *sql.DB
}

func NewBucketRepository(db *sql.DB) *BucketRepository {
	return &BucketRepository{DB: db}
}

func (r *BucketRepository) Create(bucket models.Bucket) (models.Bucket, error) {
	query := "INSERT INTO buckets (name, color) VALUES ($1, $2) RETURNING id"

	err := r.DB.QueryRow(query, bucket.Name, bucket.Color).Scan(&bucket.ID)
	if err != nil {
		return models.Bucket{}, err
	}

	return bucket, nil
}

func (r *BucketRepository) GetByID(id int) (models.Bucket, error) {
	query := "SELECT id, name, color, is_default FROM buckets WHERE id = $1"

	var bucket models.Bucket
	err := r.DB.QueryRow(query, id).Scan(&bucket.ID, &bucket.Name, &bucket.Color, &bucket.IsDefault)
	if err != nil {
		return models.Bucket{}, err
	}

	return bucket, nil
}

func (r *BucketRepository) GetAll() ([]models.Bucket, error) {
	query := "SELECT id, name, color, is_default FROM buckets ORDER BY name"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	buckets := []models.Bucket{}

	for rows.Next() {
		var bucket models.Bucket

		err := rows.Scan(&bucket.ID, &bucket.Name, &bucket.Color, &bucket.IsDefault)
		if err != nil {
			return nil, err
		}

		buckets = append(buckets, bucket)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return buckets, nil
}

func (r *BucketRepository) Update(id int, bucket models.Bucket) (models.Bucket, error) {
	query := "UPDATE buckets SET name = $1, color = $2 WHERE id = $3"

	result, err := r.DB.Exec(query, bucket.Name, bucket.Color, id)
	if err != nil {
		return models.Bucket{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.Bucket{}, err
	}

	if rowsAffected == 0 {
		return models.Bucket{}, sql.ErrNoRows
	}

	bucket.ID = id
	return bucket, nil
}

// SetDefault marks the given bucket as the sole default, unsetting any previous default.
func (r *BucketRepository) SetDefault(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("UPDATE buckets SET is_default = FALSE WHERE is_default = TRUE"); err != nil {
		return err
	}

	result, err := tx.Exec("UPDATE buckets SET is_default = TRUE WHERE id = $1", id)
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

// Delete reassigns referencing expenses to the default bucket first, so deleting never orphans data.
func (r *BucketRepository) Delete(id int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var defaultID int
	err = tx.QueryRow("SELECT id FROM buckets WHERE is_default = TRUE LIMIT 1").Scan(&defaultID)
	if err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE expenses SET bucket_id = $1 WHERE bucket_id = $2", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE installment_purchases SET bucket_id = $1 WHERE bucket_id = $2", defaultID, id); err != nil {
		return err
	}

	if _, err := tx.Exec("UPDATE recurring_expenses SET bucket_id = $1 WHERE bucket_id = $2", defaultID, id); err != nil {
		return err
	}

	result, err := tx.Exec("DELETE FROM buckets WHERE id = $1", id)
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
