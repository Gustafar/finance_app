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

func (h *ExpenseHandler) Create(w http.ResponseWriter, r *http.Request) {
	var expense models.Expense

	err := json.NewDecoder(r.Body).Decode(&expense)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	criada, err := h.Service.Create(expense)
	if err != nil {
		if errors.Is(err, services.ErrInvalidAmount) ||
			errors.Is(err, services.ErrInvalidType) ||
			errors.Is(err, services.ErrEmptyCategory) ||
			errors.Is(err, services.ErrEmptyPerson) ||
			errors.Is(err, services.ErrEmptyPaymentMethod) ||
			errors.Is(err, services.ErrEmptyBucket) ||
			errors.Is(err, services.ErrEmptyBank) ||
			errors.Is(err, services.ErrEmptyDescription) ||
			errors.Is(err, services.ErrCategoryNotFound) ||
			errors.Is(err, services.ErrPersonNotFound) ||
			errors.Is(err, services.ErrPaymentMethodNotFound) ||
			errors.Is(err, services.ErrBucketNotFound) ||
			errors.Is(err, services.ErrBankNotFound) {
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
	PersonID         int       `json:"person_id"`
	PaymentMethodID  int       `json:"payment_method_id"`
	BucketID         int       `json:"bucket_id"`
	BankID           int       `json:"bank_id"`
	PurchaseDate     time.Time `json:"purchase_date"`
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
		PersonID:         req.PersonID,
		PaymentMethodID:  req.PaymentMethodID,
		BucketID:         req.BucketID,
		BankID:           req.BankID,
	})
	if err != nil {
		if errors.Is(err, services.ErrInvalidAmount) ||
			errors.Is(err, services.ErrInvalidInstallmentCount) ||
			errors.Is(err, services.ErrEmptyCategory) ||
			errors.Is(err, services.ErrEmptyPerson) ||
			errors.Is(err, services.ErrEmptyPaymentMethod) ||
			errors.Is(err, services.ErrEmptyBucket) ||
			errors.Is(err, services.ErrEmptyBank) ||
			errors.Is(err, services.ErrEmptyDescription) ||
			errors.Is(err, services.ErrCategoryNotFound) ||
			errors.Is(err, services.ErrPersonNotFound) ||
			errors.Is(err, services.ErrPaymentMethodNotFound) ||
			errors.Is(err, services.ErrBucketNotFound) ||
			errors.Is(err, services.ErrBankNotFound) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, created)
}

func (h *ExpenseHandler) GenerateDueRecurring(w http.ResponseWriter, r *http.Request) {
	created, err := h.Service.ApplyDueRecurringExpenses()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, created)
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

func (h *ExpenseHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var expense models.Expense
	err = json.NewDecoder(r.Body).Decode(&expense)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, expense)
	if err != nil {
		if errors.Is(err, services.ErrExpenseNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrInvalidAmount) ||
			errors.Is(err, services.ErrInvalidType) ||
			errors.Is(err, services.ErrEmptyCategory) ||
			errors.Is(err, services.ErrEmptyPerson) ||
			errors.Is(err, services.ErrEmptyPaymentMethod) ||
			errors.Is(err, services.ErrEmptyBucket) ||
			errors.Is(err, services.ErrEmptyBank) ||
			errors.Is(err, services.ErrEmptyDescription) ||
			errors.Is(err, services.ErrCategoryNotFound) ||
			errors.Is(err, services.ErrPersonNotFound) ||
			errors.Is(err, services.ErrPaymentMethodNotFound) ||
			errors.Is(err, services.ErrBucketNotFound) ||
			errors.Is(err, services.ErrBankNotFound) {
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

	err = h.Service.Delete(id)
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
