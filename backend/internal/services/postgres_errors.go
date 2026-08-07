package services

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

const (
	pgErrUniqueViolation     = "23505"
	pgErrForeignKeyViolation = "23503"
)

func asPgError(err error) *pgconn.PgError {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr
	}
	return nil
}

func isDuplicateEntry(err error) bool {
	pgErr := asPgError(err)
	return pgErr != nil && pgErr.Code == pgErrUniqueViolation
}

// violatesConstraint reports whether err is a FK violation of the named constraint.
func violatesConstraint(err error, constraintName string) bool {
	pgErr := asPgError(err)
	return pgErr != nil && pgErr.Code == pgErrForeignKeyViolation && pgErr.ConstraintName == constraintName
}
