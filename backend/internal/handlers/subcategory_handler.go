package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type SubcategoryHandler struct {
	Service *services.SubcategoryService
}

func NewSubcategoryHandler(service *services.SubcategoryService) *SubcategoryHandler {
	return &SubcategoryHandler{Service: service}
}

func isSubcategoryValidationError(err error) bool {
	return errors.Is(err, services.ErrEmptySubcategoryName) ||
		errors.Is(err, services.ErrEmptySubcategoryCategory) ||
		errors.Is(err, services.ErrCategoryNotFound)
}

func (h *SubcategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var subcategory models.Subcategory

	err := json.NewDecoder(r.Body).Decode(&subcategory)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	criada, err := h.Service.Create(subcategory)
	if err != nil {
		if isSubcategoryValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrSubcategoryAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, criada)
}

func (h *SubcategoryHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	subcategories, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, subcategories)
}

func (h *SubcategoryHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	subcategory, err := h.Service.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrSubcategoryNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, subcategory)
}

func (h *SubcategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var subcategory models.Subcategory
	err = json.NewDecoder(r.Body).Decode(&subcategory)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, subcategory)
	if err != nil {
		if errors.Is(err, services.ErrSubcategoryNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if isSubcategoryValidationError(err) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrSubcategoryAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *SubcategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	err = h.Service.Delete(id)
	if err != nil {
		if errors.Is(err, services.ErrSubcategoryNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
