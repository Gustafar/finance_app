package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type PaymentMethodHandler struct {
	Service *services.PaymentMethodService
}

func NewPaymentMethodHandler(service *services.PaymentMethodService) *PaymentMethodHandler {
	return &PaymentMethodHandler{Service: service}
}

func (h *PaymentMethodHandler) Create(w http.ResponseWriter, r *http.Request) {
	var paymentMethod models.PaymentMethod

	err := json.NewDecoder(r.Body).Decode(&paymentMethod)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	criado, err := h.Service.Create(paymentMethod)
	if err != nil {
		if errors.Is(err, services.ErrEmptyPaymentMethodName) ||
			errors.Is(err, services.ErrInvalidPaymentMethodColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrPaymentMethodAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, criado)
}

func (h *PaymentMethodHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	paymentMethods, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, paymentMethods)
}

func (h *PaymentMethodHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	paymentMethod, err := h.Service.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrPaymentMethodNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, paymentMethod)
}

func (h *PaymentMethodHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var paymentMethod models.PaymentMethod
	err = json.NewDecoder(r.Body).Decode(&paymentMethod)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, paymentMethod)
	if err != nil {
		if errors.Is(err, services.ErrPaymentMethodNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrEmptyPaymentMethodName) ||
			errors.Is(err, services.ErrInvalidPaymentMethodColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrPaymentMethodAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *PaymentMethodHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	err = h.Service.Delete(id)
	if err != nil {
		if errors.Is(err, services.ErrPaymentMethodNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrCannotDeleteDefaultPaymentMethod) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
