package services

import (
	"errors"
	"strings"

	"github.com/go-sql-driver/mysql"
)

const (
	mysqlErrDuplicateEntry     uint16 = 1062
	mysqlErrForeignKeyNoParent uint16 = 1452
)

func asMySQLError(err error) *mysql.MySQLError {
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) {
		return mysqlErr
	}
	return nil
}

func isDuplicateEntry(err error) bool {
	mysqlErr := asMySQLError(err)
	return mysqlErr != nil && mysqlErr.Number == mysqlErrDuplicateEntry
}

// violatesConstraint reports whether err is a foreign-key violation against
// the named constraint, so callers can tell apart which referenced entity
// (e.g. category vs. person) was invalid when an expense write fails.
func violatesConstraint(err error, constraintName string) bool {
	mysqlErr := asMySQLError(err)
	return mysqlErr != nil && mysqlErr.Number == mysqlErrForeignKeyNoParent && strings.Contains(mysqlErr.Message, constraintName)
}
