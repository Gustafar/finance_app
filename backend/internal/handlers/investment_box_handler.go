package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type InvestmentBoxHandler struct {
	Service *services.InvestmentBoxService
}

func NewInvestmentBoxHandler(service *services.InvestmentBoxService) *InvestmentBoxHandler {
	return &InvestmentBoxHandler{Service: service}
}

func (h *InvestmentBoxHandler) Create(w http.ResponseWriter, r *http.Request) {
	var box models.InvestmentBox

	err := json.NewDecoder(r.Body).Decode(&box)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	criado, err := h.Service.Create(box)
	if err != nil {
		if errors.Is(err, services.ErrEmptyInvestmentBoxName) ||
			errors.Is(err, services.ErrInvalidInvestmentBoxColor) ||
			errors.Is(err, services.ErrInvalidInvestmentBoxGoal) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrInvestmentBoxAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, criado)
}

func (h *InvestmentBoxHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	boxes, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, boxes)
}

func (h *InvestmentBoxHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	box, err := h.Service.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrInvestmentBoxNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, box)
}

func (h *InvestmentBoxHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var box models.InvestmentBox
	err = json.NewDecoder(r.Body).Decode(&box)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, box)
	if err != nil {
		if errors.Is(err, services.ErrInvestmentBoxNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrEmptyInvestmentBoxName) ||
			errors.Is(err, services.ErrInvalidInvestmentBoxColor) ||
			errors.Is(err, services.ErrInvalidInvestmentBoxGoal) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrInvestmentBoxAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *InvestmentBoxHandler) SetDefault(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.Service.SetDefault(id); err != nil {
		if errors.Is(err, services.ErrInvestmentBoxNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	updated, err := h.Service.GetByID(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *InvestmentBoxHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	err = h.Service.Delete(id)
	if err != nil {
		if errors.Is(err, services.ErrInvestmentBoxNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrCannotDeleteDefaultInvestmentBox) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
