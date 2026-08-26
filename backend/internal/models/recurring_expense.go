package models

import "time"

type RecurringExpense struct {
	ID                int       `json:"id"`
	Description       string    `json:"description"`
	Amount            float64   `json:"amount"`
	Type              string    `json:"type"`
	DayOfMonth        int       `json:"day_of_month"`
	CategoryID        int       `json:"category_id"`
	SubcategoryID     *int      `json:"subcategory_id,omitempty"`
	PersonID          int       `json:"person_id"`
	PaymentMethodID   int       `json:"payment_method_id"`
	BucketID          int       `json:"bucket_id"`
	BankID            int       `json:"bank_id"`
	IncludeInExpenses bool      `json:"include_in_expenses"`
	PlanYear          int       `json:"plan_year"`
	PlanMonth         int       `json:"plan_month"`
	Comment           *string   `json:"comment,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}
