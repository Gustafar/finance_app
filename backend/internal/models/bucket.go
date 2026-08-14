package models

type Bucket struct {
	ID               int    `json:"id"`
	Name             string `json:"name"`
	Color            string `json:"color"`
	IsDefault        bool   `json:"is_default"`
	IsGoalWithdrawal bool   `json:"is_goal_withdrawal"`
}
