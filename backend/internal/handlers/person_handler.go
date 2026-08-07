package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"finance_app/internal/models"
	"finance_app/internal/services"
)

type PersonHandler struct {
	Service *services.PersonService
}

func NewPersonHandler(service *services.PersonService) *PersonHandler {
	return &PersonHandler{Service: service}
}

func (h *PersonHandler) Create(w http.ResponseWriter, r *http.Request) {
	var person models.Person

	err := json.NewDecoder(r.Body).Decode(&person)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	criado, err := h.Service.Create(person)
	if err != nil {
		if errors.Is(err, services.ErrEmptyPersonName) ||
			errors.Is(err, services.ErrInvalidPersonColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrPersonAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusCreated, criado)
}

func (h *PersonHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	people, err := h.Service.GetAll()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, people)
}

func (h *PersonHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	person, err := h.Service.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrPersonNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, person)
}

func (h *PersonHandler) Update(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var person models.Person
	err = json.NewDecoder(r.Body).Decode(&person)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.Service.Update(id, person)
	if err != nil {
		if errors.Is(err, services.ErrPersonNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrEmptyPersonName) ||
			errors.Is(err, services.ErrInvalidPersonColor) {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, services.ErrPersonAlreadyExists) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	respondJSON(w, http.StatusOK, updated)
}

func (h *PersonHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	err = h.Service.Delete(id)
	if err != nil {
		if errors.Is(err, services.ErrPersonNotFound) {
			respondError(w, http.StatusNotFound, err.Error())
			return
		}
		if errors.Is(err, services.ErrCannotDeleteDefaultPerson) {
			respondError(w, http.StatusConflict, err.Error())
			return
		}

		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
