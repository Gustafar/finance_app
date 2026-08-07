package services

import "errors"

var (
	ErrInvalidAmount      = errors.New("amount must be greater than zero")
	ErrEmptyCategory      = errors.New("category cannot be empty")
	ErrEmptyPerson        = errors.New("person cannot be empty")
	ErrEmptyPaymentMethod = errors.New("payment method cannot be empty")
	ErrEmptyCaixinha      = errors.New("caixinha cannot be empty")
	ErrEmptyDescription   = errors.New("description cannot be empty")
	ErrExpenseNotFound    = errors.New("expense not found")

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

	ErrEmptyCaixinhaName           = errors.New("caixinha name cannot be empty")
	ErrInvalidCaixinhaColor        = errors.New("invalid caixinha color")
	ErrCaixinhaNotFound            = errors.New("caixinha not found")
	ErrCaixinhaAlreadyExists       = errors.New("caixinha already exists")
	ErrCannotDeleteDefaultCaixinha = errors.New("the default caixinha cannot be deleted")
)
