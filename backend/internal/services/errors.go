package services

import "errors"

var (
	ErrInvalidAmount    = errors.New("amount must be greater than zero")
	ErrEmptyCategory    = errors.New("category cannot be empty")
	ErrEmptyDescription = errors.New("description cannot be empty")
	ErrExpenseNotFound  = errors.New("expense not found")

	ErrEmptyCategoryName           = errors.New("category name cannot be empty")
	ErrInvalidCategoryColor        = errors.New("invalid category color")
	ErrCategoryNotFound            = errors.New("category not found")
	ErrCategoryAlreadyExists       = errors.New("category already exists")
	ErrCannotDeleteDefaultCategory = errors.New("the default category cannot be deleted")
)
