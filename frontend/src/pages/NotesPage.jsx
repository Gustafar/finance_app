import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import MonthPicker from '../components/MonthPicker'
import NoteForm from '../components/NoteForm'
import { useMonthNotes } from '../hooks/useMonthNotes'
import { deleteMonthNote } from '../api/monthNotes'
import { formatDate } from '../utils/format'
import { currentYearMonth, shiftMonth } from '../utils/date'

function NotesPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth)
  const { notes, setNotes, isLoading, error } = useMonthNotes(selectedMonth.year, selectedMonth.month)

  const [formState, setFormState] = useState(null) // { note } | { note: null }
  const [pendingDeleteNote, setPendingDeleteNote] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSaved = (saved) => {
    setNotes((prev) =>
      prev.some((n) => n.id === saved.id) ? prev.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...prev]
    )
    setFormState(null)
  }

  const handleDelete = () => {
    setIsProcessing(true)
    deleteMonthNote(pendingDeleteNote.id)
      .then(() => setNotes((prev) => prev.filter((n) => n.id !== pendingDeleteNote.id)))
      .catch((err) => console.error('Erro ao excluir nota:', err))
      .finally(() => {
        setIsProcessing(false)
        setPendingDeleteNote(null)
      })
  }

  return (
    <main className="container">
      <div className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1>Notas</h1>
      </div>

      <div className="dashboard-toolbar">
        <div className="month-nav">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSelectedMonth((m) => shiftMonth(m, -1))}
            aria-label="Mês anterior"
            title="Mês anterior"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSelectedMonth((m) => shiftMonth(m, 1))}
            aria-label="Próximo mês"
            title="Próximo mês"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header panel-header--actions">
          <h2>Notas do mês</h2>
          <div className="panel-header-actions-group">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setFormState({ note: null })}>
              + Nova nota
            </button>
          </div>
        </div>

        {isLoading && <p className="state-message">Carregando notas…</p>}
        {!isLoading && error && <p className="state-message state-message--error">{error}</p>}
        {!isLoading && !error && notes.length === 0 && (
          <p className="state-message">Nenhuma nota para este mês ainda.</p>
        )}

        {!isLoading && !error && notes.length > 0 && (
          <ul className="note-list">
            {notes.map((note) => (
              <li className="note-card" key={note.id}>
                <div className="note-card-header">
                  <div className="note-card-heading">
                    {note.title && <span className="note-card-title">{note.title}</span>}
                    <span className="expense-date">
                      {formatDate(note.created_at)}
                      {note.updated_at !== note.created_at && ' · editada'}
                    </span>
                  </div>
                  <div className="debt-item-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setFormState({ note })}
                      aria-label="Editar nota"
                      title="Editar"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M11.333 2a1.2 1.2 0 0 1 1.697 1.697l-7.03 7.03-2.333.637.636-2.334z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => setPendingDeleteNote(note)}
                      aria-label="Excluir nota"
                      title="Excluir"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5m-6.5 0 .6 8.1a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.1"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="note-card-content">{note.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal isOpen={formState !== null} onClose={() => setFormState(null)}>
        {formState && (
          <NoteForm
            note={formState.note}
            month={selectedMonth}
            onSaved={handleSaved}
            onCancel={() => setFormState(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={pendingDeleteNote !== null}
        title="Excluir nota"
        message="Tem certeza que deseja excluir esta nota? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        isConfirming={isProcessing}
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteNote(null)}
      />
    </main>
  )
}

export default NotesPage
