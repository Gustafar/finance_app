package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type CategoryHandler struct {
	Service *services.CategoryService
}

func NewCategoryHandler(service *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{Service: service}
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var category models.Category

	err := json.NewDecoder(r.Body).Decode(&category)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	criada, err := h.Service.Create(category)
	if err != nil {
		if errors.Is(err, services.ErrEmptyCategoryName) ||
			errors.Is(err, services.ErrInvalidCategoryColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrCategoryAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, criada)
}

func (h *CategoryHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	categories, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, categories)
}

func (h *CategoryHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	category, err := h.Service.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrCategoryNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, category)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var category models.Category
	err = json.NewDecoder(r.Body).Decode(&category)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, category)
	if err != nil {
		if errors.Is(err, services.ErrCategoryNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrEmptyCategoryName) ||
			errors.Is(err, services.ErrInvalidCategoryColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrCategoryAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	err = h.Service.Delete(id)
	if err != nil {
		if errors.Is(err, services.ErrCategoryNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrCannotDeleteDefaultCategory) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
