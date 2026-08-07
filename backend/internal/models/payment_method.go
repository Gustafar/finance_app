package models

type PaymentMethod struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Color     string `json:"color"`
	IsDefault bool   `json:"is_default"`
}
