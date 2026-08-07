package services

import "errors"

var (
	ErrInvalidAmount      = errors.New("amount must be greater than zero")
	ErrEmptyCategory      = errors.New("category cannot be empty")
	ErrEmptyPerson        = errors.New("person cannot be empty")
	ErrEmptyPaymentMethod = errors.New("payment method cannot be empty")
	ErrEmptyBucket        = errors.New("bucket cannot be empty")
	ErrEmptyBank          = errors.New("bank cannot be empty")
	ErrEmptyDescription   = errors.New("description cannot be empty")
	ErrExpenseNotFound    = errors.New("expense not found")
	ErrInvalidType        = errors.New("type must be income, expense or investment")

	ErrInvalidInstallmentCount = errors.New("installment count must be between 2 and 60")

	ErrEmptyCategoryName           = errors.New("category name cannot be empty")
	ErrInvalidCategoryColor        = errors.New("invalid category color")
	ErrCategoryNotFound            = errors.New("category not found")
	ErrCategoryAlreadyExists       = errors.New("category already exists")
	ErrCannotDeleteDefaultCategory = errors.New("the default category cannot be deleted")

	ErrEmptyPersonName           = errors.New("person name cannot be empty")
	ErrInvalidPersonColor        = errors.New("invalid person color")
	ErrPersonNotFound            = errors.New("person not found")
	ErrPersonAlreadyExists       = errors.New("person already exists")
	ErrCannotDeleteDefaultPerson = errors.New("the default person cannot be deleted")

	ErrEmptyPaymentMethodName           = errors.New("payment method name cannot be empty")
	ErrInvalidPaymentMethodColor        = errors.New("invalid payment method color")
	ErrPaymentMethodNotFound            = errors.New("payment method not found")
	ErrPaymentMethodAlreadyExists       = errors.New("payment method already exists")
	ErrCannotDeleteDefaultPaymentMethod = errors.New("this payment method cannot be deleted")

	ErrEmptyBucketName           = errors.New("bucket name cannot be empty")
	ErrInvalidBucketColor        = errors.New("invalid bucket color")
	ErrBucketNotFound            = errors.New("bucket not found")
	ErrBucketAlreadyExists       = errors.New("bucket already exists")
	ErrCannotDeleteDefaultBucket = errors.New("the default bucket cannot be deleted")

	ErrEmptyBankName           = errors.New("bank name cannot be empty")
	ErrInvalidBankColor        = errors.New("invalid bank color")
	ErrBankNotFound            = errors.New("bank not found")
	ErrBankAlreadyExists       = errors.New("bank already exists")
	ErrCannotDeleteDefaultBank = errors.New("the default bank cannot be deleted")

	ErrEmptyRecurringExpenseName  = errors.New("recurring expense description cannot be empty")
	ErrInvalidRecurringExpenseDay = errors.New("day of month must be between 1 and 31")
	ErrRecurringExpenseNotFound   = errors.New("recurring expense not found")
)
