package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type DebtHandler struct {
	Service *services.DebtService
}

func NewDebtHandler(service *services.DebtService) *DebtHandler {
	return &DebtHandler{Service: service}
}

func debtValidationError(err error) bool {
	return errors.Is(err, services.ErrInvalidDebtDirection) ||
		errors.Is(err, services.ErrEmptyDebtCounterparty) ||
		errors.Is(err, services.ErrEmptyDebtDescription) ||
		errors.Is(err, services.ErrInvalidDebtAmount) ||
		errors.Is(err, services.ErrInvalidDebtDate) ||
		errors.Is(err, services.ErrInvalidDebtPaymentAmount) ||
		errors.Is(err, services.ErrInvalidDebtPaymentDate) ||
		errors.Is(err, services.ErrInvalidInstallmentCount)
}

func (h *DebtHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	debts, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}
	respondJSON(w, http.StatusOK, debts)
}

func (h *DebtHandler) Create(w http.ResponseWriter, r *http.Request) {
	var debt models.Debt
	if err := json.NewDecoder(r.Body).Decode(&debt); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if debt.InstallmentCount != nil && *debt.InstallmentCount >= 2 {
		created, err := h.Service.CreateInstallments(debt, *debt.InstallmentCount)
		if err != nil {
			if debtValidationError(err) {
				respondError(w, http.StatusBadRequest, err.Error())
				return
			}
			respondError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		respondJSON(w, http.StatusCreated, created)
		return
	}

	created, err := h.Service.Create(debt)
	if err != nil {
		if debtValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, created)
}

// updateDebtRequest is a models.Debt plus the installment scope for the edit ("this" if omitted,
// "future", or "all" — see services.InstallmentScope).
type updateDebtRequest struct {
	models.Debt
	Scope services.InstallmentScope `json:"scope,omitempty"`
}

func (h *DebtHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req updateDebtRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.UpdateWithScope(id, req.Debt, req.Scope)
	if err != nil {
		if errors.Is(err, services.ErrDebtNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if debtValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *DebtHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	scope := services.InstallmentScope(r.URL.Query().Get("scope"))

	if err := h.Service.DeleteWithScope(id, scope); err != nil {
		if errors.Is(err, services.ErrDebtNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *DebtHandler) AddPayment(w http.ResponseWriter, r *http.Request) {
	debtID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var payment models.DebtPayment
	if err := json.NewDecoder(r.Body).Decode(&payment); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.AddPayment(debtID, payment)
	if err != nil {
		if errors.Is(err, services.ErrDebtNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if debtValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, updated)
}

func (h *DebtHandler) DeletePayment(w http.ResponseWriter, r *http.Request) {
	debtID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}
	paymentID, err := strconv.Atoi(r.PathValue("paymentId"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid payment id")
		return
	}

	updated, err := h.Service.DeletePayment(debtID, paymentID)
	if err != nil {
		if errors.Is(err, services.ErrDebtPaymentNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}
