package services

import (
	"database/sql"
	"errors"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type BucketService struct {
	Repo *repositories.BucketRepository
}

func NewBucketService(repo *repositories.BucketRepository) *BucketService {
	return &BucketService{Repo: repo}
}

func (s *BucketService) validate(bucket models.Bucket) error {
	if bucket.Name == "" {
		return ErrEmptyBucketName
	}
	if !validColorKeys[bucket.Color] {
		return ErrInvalidBucketColor
	}
	return nil
}

func (s *BucketService) Create(bucket models.Bucket) (models.Bucket, error) {
	if err := s.validate(bucket); err != nil {
		return models.Bucket{}, err
	}

	created, err := s.Repo.Create(bucket)
	if err != nil {
		if isDuplicateEntry(err) {
			return models.Bucket{}, ErrBucketAlreadyExists
		}
		return models.Bucket{}, err
	}

	return created, nil
}

func (s *BucketService) GetAll() ([]models.Bucket, error) {
	return s.Repo.GetAll()
}

func (s *BucketService) GetByID(id int) (models.Bucket, error) {
	bucket, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Bucket{}, ErrBucketNotFound
		}
		return models.Bucket{}, err
	}

	return bucket, nil
}

func (s *BucketService) Update(id int, bucket models.Bucket) (models.Bucket, error) {
	if err := s.validate(bucket); err != nil {
		return models.Bucket{}, err
	}

	updated, err := s.Repo.Update(id, bucket)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.Bucket{}, ErrBucketNotFound
		}
		if isDuplicateEntry(err) {
			return models.Bucket{}, ErrBucketAlreadyExists
		}
		return models.Bucket{}, err
	}

	return updated, nil
}

func (s *BucketService) Delete(id int) error {
	bucket, err := s.Repo.GetByID(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrBucketNotFound
		}
		return err
	}

	if bucket.IsDefault {
		return ErrCannotDeleteDefaultBucket
	}

	err = s.Repo.Delete(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrBucketNotFound
		}
		return err
	}

	return nil
}
