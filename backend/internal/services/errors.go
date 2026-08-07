package services

import "errors"

var (
	ErrInvalidAmount    = errors.New("amount must be greater than zero")
	ErrEmptyCategory    = errors.New("category cannot be empty")
	ErrEmptyPerson      = errors.New("person cannot be empty")
	ErrEmptyDescription = errors.New("description cannot be empty")
	ErrExpenseNotFound  = errors.New("expense not found")

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
)
