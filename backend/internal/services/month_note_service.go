package services

import (
	"database/sql"
	"errors"
	"strings"

	"finance_app/internal/models"
	"finance_app/internal/repositories"
)

type MonthNoteService struct {
	Repo *repositories.MonthNoteRepository
}

func NewMonthNoteService(repo *repositories.MonthNoteRepository) *MonthNoteService {
	return &MonthNoteService{Repo: repo}
}

func validateNoteMonth(year, month int) error {
	if year < 1 {
		return ErrInvalidNoteYear
	}
	if month < 1 || month > 12 {
		return ErrInvalidNoteMonth
	}
	return nil
}

func normalizeNote(note models.MonthNote) models.MonthNote {
	note.Content = strings.TrimSpace(note.Content)
	if note.Title != nil {
		trimmed := strings.TrimSpace(*note.Title)
		if trimmed == "" {
			note.Title = nil
		} else {
			note.Title = &trimmed
		}
	}
	return note
}

func (s *MonthNoteService) GetByMonth(year, month int) ([]models.MonthNote, error) {
	if err := validateNoteMonth(year, month); err != nil {
		return nil, err
	}
	return s.Repo.GetByMonth(year, month)
}

func (s *MonthNoteService) Create(note models.MonthNote) (models.MonthNote, error) {
	if err := validateNoteMonth(note.Year, note.Month); err != nil {
		return models.MonthNote{}, err
	}

	note = normalizeNote(note)
	if note.Content == "" {
		return models.MonthNote{}, ErrEmptyNoteContent
	}

	return s.Repo.Create(note)
}

func (s *MonthNoteService) Update(id int, note models.MonthNote) (models.MonthNote, error) {
	note = normalizeNote(note)
	if note.Content == "" {
		return models.MonthNote{}, ErrEmptyNoteContent
	}

	updated, err := s.Repo.Update(id, note)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.MonthNote{}, ErrNoteNotFound
		}
		return models.MonthNote{}, err
	}

	return updated, nil
}

func (s *MonthNoteService) Delete(id int) error {
	if err := s.Repo.Delete(id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNoteNotFound
		}
		return err
	}
	return nil
}
