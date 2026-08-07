import { useState } from 'react'
import { createCaixinha, updateCaixinha, deleteCaixinha } from '../api/caixinhas'
import { paletteColor, COLOR_KEYS } from '../utils/categoryColor'
import { useCaixinhas, sortByName } from '../hooks/useCaixinhas'
import ColorSwatchPicker from './ColorSwatchPicker'

function CaixinhaManager() {
  const { caixinhas, setCaixinhas, isLoading, error: loadError } = useCaixinhas()

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_KEYS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState(COLOR_KEYS[0])
  const [rowError, setRowError] = useState(null)

  const [deleteError, setDeleteError] = useState(null)

  const handleCreate = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return

    setCreateError(null)
    setIsCreating(true)

    createCaixinha({ name, color: newColor })
      .then((created) => {
        setCaixinhas((prev) => sortByName([...prev, created]))
        setNewName('')
        setNewColor(COLOR_KEYS[0])
      })
      .catch((error) => {
        console.error('Erro ao criar caixinha:', error)
        setCreateError('Não foi possível criar a caixinha. O nome já pode existir.')
      })
      .finally(() => setIsCreating(false))
  }

  const startEditing = (caixinha) => {
    setEditingId(caixinha.id)
    setEditingName(caixinha.name)
    setEditingColor(caixinha.color)
    setRowError(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
    setRowError(null)
  }

  const handleUpdate = (id) => {
    const name = editingName.trim()
    if (!name) return

    setRowError(null)

    updateCaixinha(id, { name, color: editingColor })
      .then((updated) => {
        setCaixinhas((prev) => sortByName(prev.map((caixinha) => (caixinha.id === id ? updated : caixinha))))
        cancelEditing()
      })
      .catch((error) => {
        console.error('Erro ao atualizar caixinha:', error)
        setRowError('Não foi possível salvar. O nome já pode existir.')
      })
  }

  const handleDelete = (id) => {
    setDeleteError(null)

    deleteCaixinha(id)
      .then(() => {
        setCaixinhas((prev) => prev.filter((caixinha) => caixinha.id !== id))
      })
      .catch((error) => {
        console.error('Erro ao excluir caixinha:', error)
        setDeleteError('Não foi possível excluir a caixinha. Tente novamente.')
      })
  }

  return (
    <div className="entity-manager">
      <h2>Caixinhas</h2>

      <form className="entity-create-form" onSubmit={handleCreate}>
        <div className="entity-create-form-row">
          <input
            type="text"
            placeholder="Nova caixinha"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={isCreating || !newName.trim()}>
            Adicionar
          </button>
        </div>
        <ColorSwatchPicker value={newColor} onChange={setNewColor} />
      </form>
      {createError && <p className="form-error">{createError}</p>}

      {deleteError && <p className="form-error">{deleteError}</p>}

      {isLoading && <p className="state-message">Carregando caixinhas…</p>}
      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}
      {!isLoading && !loadError && caixinhas.length === 0 && (
        <p className="state-message">Nenhuma caixinha cadastrada ainda.</p>
      )}

      {!isLoading && !loadError && caixinhas.length > 0 && (
        <ul className="entity-list">
          {caixinhas.map((caixinha) => {
            const color = paletteColor(caixinha.color)
            const isEditing = editingId === caixinha.id

            return (
              <li className="entity-row" key={caixinha.id}>
                <div className="entity-row-main">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        className="entity-edit-input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                      <div className="entity-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleUpdate(caixinha.id)}
                          disabled={!editingName.trim()}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={cancelEditing}
                          aria-label="Cancelar edição"
                          title="Cancelar"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M4 4l8 8M12 4l-8 8"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="badge" style={{ background: color.bg, color: color.text }}>
                        {caixinha.name}
                        {caixinha.is_default && ' (padrão)'}
                      </span>
                      <div className="entity-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => startEditing(caixinha)}
                          aria-label="Editar caixinha"
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
                        {!caixinha.is_default && (
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            onClick={() => handleDelete(caixinha.id)}
                            aria-label="Excluir caixinha"
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
                        )}
                      </div>
                    </>
                  )}
                </div>
                {isEditing && <ColorSwatchPicker value={editingColor} onChange={setEditingColor} />}
                {isEditing && rowError && <p className="form-error">{rowError}</p>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default CaixinhaManager
