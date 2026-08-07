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
	BucketID           int       `json:"bucket_id"`
	BucketName         string    `json:"bucket_name"`
	BucketColor        string    `json:"bucket_color"`
	BankID             int       `json:"bank_id"`
	BankName           string    `json:"bank_name"`
	BankColor          string    `json:"bank_color"`
	Type               string    `json:"type"`
	Date               time.Time `json:"date"`

	InvestmentBoxID    *int    `json:"investment_box_id,omitempty"`
	InvestmentBoxName  *string `json:"investment_box_name,omitempty"`
	InvestmentBoxColor *string `json:"investment_box_color,omitempty"`

	InstallmentPurchaseID *int       `json:"installment_purchase_id,omitempty"`
	InstallmentNumber     *int       `json:"installment_number,omitempty"`
	InstallmentCount      *int       `json:"installment_count,omitempty"`
	PurchaseTotalAmount   *float64   `json:"purchase_total_amount,omitempty"`
	PurchaseDate          *time.Time `json:"purchase_date,omitempty"`

	RecurringExpenseID *int `json:"recurring_expense_id,omitempty"`
}
