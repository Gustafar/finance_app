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
	query := "INSERT INTO buckets (name, color, is_goal_withdrawal) VALUES ($1, $2, $3) RETURNING id"

	err := r.DB.QueryRow(query, bucket.Name, bucket.Color, bucket.IsGoalWithdrawal).Scan(&bucket.ID)
	if err != nil {
		return models.Bucket{}, err
	}

	return bucket, nil
}

func (r *BucketRepository) GetByID(id int) (models.Bucket, error) {
	query := "SELECT id, name, color, is_default, is_goal_withdrawal FROM buckets WHERE id = $1"

	var bucket models.Bucket
	err := r.DB.QueryRow(query, id).Scan(&bucket.ID, &bucket.Name, &bucket.Color, &bucket.IsDefault, &bucket.IsGoalWithdrawal)
	if err != nil {
		return models.Bucket{}, err
	}

	return bucket, nil
}

func (r *BucketRepository) GetAll() ([]models.Bucket, error) {
	query := "SELECT id, name, color, is_default, is_goal_withdrawal FROM buckets WHERE deleted_at IS NULL ORDER BY name"

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	buckets := []models.Bucket{}

	for rows.Next() {
		var bucket models.Bucket

		err := rows.Scan(&bucket.ID, &bucket.Name, &bucket.Color, &bucket.IsDefault, &bucket.IsGoalWithdrawal)
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
	query := "UPDATE buckets SET name = $1, color = $2, is_goal_withdrawal = $3 WHERE id = $4"

	result, err := r.DB.Exec(query, bucket.Name, bucket.Color, bucket.IsGoalWithdrawal, id)
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

// Delete soft-deletes the bucket instead of removing its row, so expenses, installment purchases
// and recurring expenses that reference it keep showing its original name/color for history,
// while it drops out of GetAll and can no longer be selected for new/edited transactions.
func (r *BucketRepository) Delete(id int) error {
	result, err := r.DB.Exec("UPDATE buckets SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL", id)
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
