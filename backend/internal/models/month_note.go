package models

import "time"

type MonthNote struct {
	ID        int       `json:"id"`
	Year      int       `json:"year"`
	Month     int       `json:"month"`
	Title     *string   `json:"title,omitempty"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
