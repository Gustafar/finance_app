package services

import "errors"

var (
	ErrInvalidAmount    = errors.New("amount must be greater than zero")
	ErrEmptyCategory    = errors.New("category cannot be empty")
	ErrEmptyDescription = errors.New("description cannot be empty")
	ErrExpenseNotFound  = errors.New("expense not found")
)
