import { useState } from 'react'
import { createMonthNote, updateMonthNote } from '../api/monthNotes'
import { formatMonthLabel } from '../utils/date'

function NoteForm({ note, month, onSaved, onCancel }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const contentMissing = content.trim() === ''

  const handleSubmit = (e) => {
    e.preventDefault()
    setAttemptedSubmit(true)
    if (contentMissing) return

    setError(null)
    setIsSaving(true)

    const payload = { title: title.trim(), content: content.trim() }
    const request = note
      ? updateMonthNote(note.id, payload)
      : createMonthNote(month.year, month.month, payload)

    request
      .then(onSaved)
      .catch((err) => {
        console.error('Erro ao salvar nota:', err)
        setError('Não foi possível salvar a nota. Tente novamente.')
        setIsSaving(false)
      })
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <h2 className="modal-title">{note ? 'Editar nota' : 'Nova nota'}</h2>
      <p className="state-message" style={{ padding: 0, textAlign: 'left' }}>
        Mês de referência: <strong>{formatMonthLabel(month)}</strong>
      </p>

      <div className="field">
        <label htmlFor="note-title">Título (opcional)</label>
        <input id="note-title" type="text" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className={`field${attemptedSubmit && contentMissing ? ' field--error' : ''}`}>
        <label htmlFor="note-content">Nota</label>
        <textarea
          id="note-content"
          rows={8}
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="confirm-dialog-actions" style={{ marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

export default NoteForm
