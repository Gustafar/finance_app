package models

type InvestmentBox struct {
	ID         int      `json:"id"`
	Name       string   `json:"name"`
	Color      string   `json:"color"`
	IsDefault  bool     `json:"is_default"`
	GoalAmount *float64 `json:"goal_amount"`
	GoalMonth  *int     `json:"goal_month"`
	GoalYear   *int     `json:"goal_year"`
}
