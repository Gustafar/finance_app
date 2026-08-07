package models

import "time"

type Expense struct {
	ID                 int       `json:"id"`
	Description        string    `json:"description"`
	Amount             float64   `json:"amount"`
	CategoryID         int       `json:"category_id"`
	CategoryName       string    `json:"category_name"`
	CategoryColor      string    `json:"category_color"`
	PersonID           int       `json:"person_id"`
	PersonName         string    `json:"person_name"`
	PersonColor        string    `json:"person_color"`
	PaymentMethodID    int       `json:"payment_method_id"`
	PaymentMethodName  string    `json:"payment_method_name"`
	PaymentMethodColor string    `json:"payment_method_color"`
	CaixinhaID         int       `json:"caixinha_id"`
	CaixinhaName       string    `json:"caixinha_name"`
	CaixinhaColor      string    `json:"caixinha_color"`
	Type               string    `json:"type"`
	Date               time.Time `json:"date"`

	InstallmentPurchaseID *int       `json:"installment_purchase_id,omitempty"`
	InstallmentNumber     *int       `json:"installment_number,omitempty"`
	InstallmentCount      *int       `json:"installment_count,omitempty"`
	PurchaseTotalAmount   *float64   `json:"purchase_total_amount,omitempty"`
	PurchaseDate          *time.Time `json:"purchase_date,omitempty"`

	RecurringExpenseID *int `json:"recurring_expense_id,omitempty"`
}
