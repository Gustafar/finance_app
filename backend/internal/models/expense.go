package models

import "time"

type Expense struct {
	ID            int       `json:"id"`
	Description   string    `json:"description"`
	Amount        float64   `json:"amount"`
	CategoryID    int       `json:"category_id"`
	CategoryName  string    `json:"category_name"`
	CategoryColor string    `json:"category_color"`
	PersonID      int       `json:"person_id"`
	PersonName    string    `json:"person_name"`
	PersonColor   string    `json:"person_color"`
	Date          time.Time `json:"date"`
}
