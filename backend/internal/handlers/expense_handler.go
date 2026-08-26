package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type ExpenseHandler struct {
	Service *services.ExpenseService
}

func NewExpenseHandler(service *services.ExpenseService) *ExpenseHandler {
	return &ExpenseHandler{Service: service}
}

// isClientValidationError reports whether err is a known domain validation error (400) as opposed
// to an unexpected failure (500). Shared by Create, Update, CreateInstallments and CreateBulk.
func isClientValidationError(err error) bool {
	return errors.Is(err, services.ErrInvalidAmount) ||
		errors.Is(err, services.ErrInvalidType) ||
		errors.Is(err, services.ErrInvalidInstallmentCount) ||
		errors.Is(err, services.ErrEmptyCategory) ||
		errors.Is(err, services.ErrEmptyPerson) ||
		errors.Is(err, services.ErrEmptyPaymentMethod) ||
		errors.Is(err, services.ErrEmptyBucket) ||
		errors.Is(err, services.ErrEmptyBank) ||
		errors.Is(err, services.ErrEmptyInvestmentBox) ||
		errors.Is(err, services.ErrEmptyDescription) ||
		errors.Is(err, services.ErrEmptySubcategory) ||
		errors.Is(err, services.ErrCategoryNotFound) ||
		errors.Is(err, services.ErrPersonNotFound) ||
		errors.Is(err, services.ErrPaymentMethodNotFound) ||
		errors.Is(err, services.ErrBucketNotFound) ||
		errors.Is(err, services.ErrBankNotFound) ||
		errors.Is(err, services.ErrInvestmentBoxNotFound) ||
		errors.Is(err, services.ErrSubcategoryNotFound) ||
		errors.Is(err, services.ErrNotInstallment) ||
		errors.Is(err, services.ErrInvalidAnticipationDate) ||
		errors.Is(err, services.ErrInvalidAnticipationCount)
}

func (h *ExpenseHandler) Create(w http.ResponseWriter, r *http.Request) {
	var expense models.Expense

	err := json.NewDecoder(r.Body).Decode(&expense)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	criada, err := h.Service.Create(expense)
	if err != nil {
		if isClientValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, criada)
}

type createInstallmentsRequest struct {
	Description      string    `json:"description"`
	TotalAmount      float64   `json:"total_amount"`
	InstallmentCount int       `json:"installment_count"`
	CategoryID       int       `json:"category_id"`
	SubcategoryID    *int      `json:"subcategory_id,omitempty"`
	PersonID         int       `json:"person_id"`
	PaymentMethodID  int       `json:"payment_method_id"`
	BucketID         int       `json:"bucket_id"`
	BankID           int       `json:"bank_id"`
	PurchaseDate     time.Time `json:"purchase_date"`
	Comment          *string   `json:"comment,omitempty"`
}

func (h *ExpenseHandler) CreateInstallments(w http.ResponseWriter, r *http.Request) {
	var req createInstallmentsRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	created, err := h.Service.CreateInstallmentPurchase(services.InstallmentPurchaseInput{
		Description:      req.Description,
		TotalAmount:      req.TotalAmount,
		InstallmentCount: req.InstallmentCount,
		PurchaseDate:     req.PurchaseDate,
		CategoryID:       req.CategoryID,
		SubcategoryID:    req.SubcategoryID,
		PersonID:         req.PersonID,
		PaymentMethodID:  req.PaymentMethodID,
		BucketID:         req.BucketID,
		BankID:           req.BankID,
		Comment:          req.Comment,
	})
	if err != nil {
		if isClientValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, created)
}

// bulkExpenseRow accepts either a plain expense (IsInstallment false) or an installment purchase
// (IsInstallment true), sharing category/person/payment method/bucket/bank across both shapes.
type bulkExpenseRow struct {
	IsInstallment bool `json:"is_installment"`

	Description     string    `json:"description"`
	Amount          float64   `json:"amount"`
	Type            string    `json:"type"`
	Date            time.Time `json:"date"`
	InvestmentBoxID *int      `json:"investment_box_id,omitempty"`
	Comment         *string   `json:"comment,omitempty"`
	AmountFormula   *string   `json:"amount_formula,omitempty"`

	TotalAmount      float64   `json:"total_amount"`
	InstallmentCount int       `json:"installment_count"`
	PurchaseDate     time.Time `json:"purchase_date"`

	CategoryID      int  `json:"category_id"`
	SubcategoryID   *int `json:"subcategory_id,omitempty"`
	PersonID        int  `json:"person_id"`
	PaymentMethodID int  `json:"payment_method_id"`
	BucketID        int  `json:"bucket_id"`
	BankID          int  `json:"bank_id"`
}

type bulkCreateRequest struct {
	Rows []bulkExpenseRow `json:"rows"`
}

type bulkRowResponse struct {
	Row   int    `json:"row"`
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

type bulkCreateResponse struct {
	Results []bulkRowResponse `json:"results"`
	Created []models.Expense  `json:"created"`
}

func (h *ExpenseHandler) CreateBulk(w http.ResponseWriter, r *http.Request) {
	var req bulkCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	rows := make([]services.BulkExpenseRow, len(req.Rows))
	for i, row := range req.Rows {
		if row.IsInstallment {
			rows[i] = services.BulkExpenseRow{
				IsInstallment: true,
				Installment: services.InstallmentPurchaseInput{
					Description:      row.Description,
					TotalAmount:      row.TotalAmount,
					InstallmentCount: row.InstallmentCount,
					PurchaseDate:     row.PurchaseDate,
					CategoryID:       row.CategoryID,
					SubcategoryID:    row.SubcategoryID,
					PersonID:         row.PersonID,
					PaymentMethodID:  row.PaymentMethodID,
					BucketID:         row.BucketID,
					BankID:           row.BankID,
					Comment:          row.Comment,
				},
			}
			continue
		}

		rows[i] = services.BulkExpenseRow{
			Expense: models.Expense{
				Description:     row.Description,
				Amount:          row.Amount,
				Type:            row.Type,
				Date:            row.Date,
				CategoryID:      row.CategoryID,
				SubcategoryID:   row.SubcategoryID,
				PersonID:        row.PersonID,
				PaymentMethodID: row.PaymentMethodID,
				BucketID:        row.BucketID,
				BankID:          row.BankID,
				InvestmentBoxID: row.InvestmentBoxID,
				Comment:         row.Comment,
				AmountFormula:   row.AmountFormula,
			},
		}
	}

	outcomes := h.Service.CreateBulk(rows)

	results := make([]bulkRowResponse, len(outcomes))
	created := []models.Expense{}
	for i, outcome := range outcomes {
		if outcome.Err != nil {
			results[i] = bulkRowResponse{Row: outcome.Row, OK: false, Error: outcome.Err.Error()}
			continue
		}
		results[i] = bulkRowResponse{Row: outcome.Row, OK: true}
		created = append(created, outcome.Created...)
	}

	respondJSON(w, http.StatusOK, bulkCreateResponse{Results: results, Created: created})
}

func (h *ExpenseHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	expenses, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, expenses)
}

func (h *ExpenseHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	expense, err := h.Service.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrExpenseNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, expense)
}

// updateExpenseRequest is a models.Expense plus the installment scope for the edit ("this" if
// omitted, "future", or "all" — see services.InstallmentScope).
type updateExpenseRequest struct {
	models.Expense
	Scope services.InstallmentScope `json:"scope,omitempty"`
}

func (h *ExpenseHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req updateExpenseRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.UpdateWithScope(id, req.Expense, req.Scope)
	if err != nil {
		if errors.Is(err, services.ErrExpenseNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if isClientValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *ExpenseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	scope := services.InstallmentScope(r.URL.Query().Get("scope"))

	err = h.Service.DeleteWithScope(id, scope)
	if err != nil {
		if errors.Is(err, services.ErrExpenseNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type anticipateInstallmentsRequest struct {
	Date  time.Time `json:"date"`
	Count int       `json:"count"`
}

// AnticipateInstallments moves the expense at id, and the following req.Count-1 installments of the
// same installment purchase, to the given date — paying them off ahead of their original schedule.
func (h *ExpenseHandler) AnticipateInstallments(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req anticipateInstallmentsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.AnticipateInstallments(id, req.Date, req.Count)
	if err != nil {
		if errors.Is(err, services.ErrExpenseNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if isClientValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}
