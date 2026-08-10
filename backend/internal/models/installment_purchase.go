package models

import "time"

type InstallmentPurchase struct {
	ID               int       `json:"id"`
	Description      string    `json:"description"`
	TotalAmount      float64   `json:"total_amount"`
	PurchaseDate     time.Time `json:"purchase_date"`
	InstallmentCount int       `json:"installment_count"`
	CategoryID       int       `json:"category_id"`
	SubcategoryID    *int      `json:"subcategory_id,omitempty"`
	PersonID         int       `json:"person_id"`
	PaymentMethodID  int       `json:"payment_method_id"`
	BucketID         int       `json:"bucket_id"`
	BankID           int       `json:"bank_id"`
}
