package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type BankHandler struct {
	Service *services.BankService
}

func NewBankHandler(service *services.BankService) *BankHandler {
	return &BankHandler{Service: service}
}

func (h *BankHandler) Create(w http.ResponseWriter, r *http.Request) {
	var bank models.Bank

	err := json.NewDecoder(r.Body).Decode(&bank)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	criado, err := h.Service.Create(bank)
	if err != nil {
		if errors.Is(err, services.ErrEmptyBankName) ||
			errors.Is(err, services.ErrInvalidBankColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrBankAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, criado)
}

func (h *BankHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	banks, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, banks)
}

func (h *BankHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	bank, err := h.Service.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrBankNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, bank)
}

func (h *BankHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var bank models.Bank
	err = json.NewDecoder(r.Body).Decode(&bank)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, bank)
	if err != nil {
		if errors.Is(err, services.ErrBankNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrEmptyBankName) ||
			errors.Is(err, services.ErrInvalidBankColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrBankAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *BankHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	err = h.Service.Delete(id)
	if err != nil {
		if errors.Is(err, services.ErrBankNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrCannotDeleteDefaultBank) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
