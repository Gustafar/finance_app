package models

import "time"

type Debt struct {
	ID               int        `json:"id"`
	Direction        string     `json:"direction"`
	CounterpartyName string     `json:"counterparty_name"`
	Description      string     `json:"description"`
	Amount           float64    `json:"amount"`
	AmountFormula    *string    `json:"amount_formula,omitempty"`
	IncurredOn       time.Time  `json:"incurred_on"`
	DueDate          *time.Time `json:"due_date,omitempty"`
	Comment          *string    `json:"comment,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`

	// Set only for debts that are one slice of a parcelamento.
	InstallmentGroupID *int `json:"installment_group_id,omitempty"`
	InstallmentNumber  *int `json:"installment_number,omitempty"`
	InstallmentCount   *int `json:"installment_count,omitempty"`

	// Derived by the repository from the related debt_payments rows.
	Payments    []DebtPayment `json:"payments"`
	AmountPaid  float64       `json:"amount_paid"`
	Outstanding float64       `json:"outstanding"`
}

type DebtPayment struct {
	ID        int       `json:"id"`
	DebtID    int       `json:"debt_id"`
	Amount    float64   `json:"amount"`
	PaidOn    time.Time `json:"paid_on"`
	Comment   *string   `json:"comment,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
