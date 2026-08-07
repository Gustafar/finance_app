package models

import "time"

type RecurringExpense struct {
	ID                 int       `json:"id"`
	Description        string    `json:"description"`
	Amount             float64   `json:"amount"`
	Type               string    `json:"type"`
	DayOfMonth         int       `json:"day_of_month"`
	CategoryID         int       `json:"category_id"`
	PersonID           int       `json:"person_id"`
	PaymentMethodID    int       `json:"payment_method_id"`
	CaixinhaID         int       `json:"caixinha_id"`
	BankID             int       `json:"bank_id"`
	LastGeneratedYear  *int      `json:"last_generated_year,omitempty"`
	LastGeneratedMonth *int      `json:"last_generated_month,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}
