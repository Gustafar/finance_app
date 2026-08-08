import { useState } from 'react'
import { createInvestmentBox, updateInvestmentBox, deleteInvestmentBox, setDefaultInvestmentBox } from '../api/investmentBoxes'
import { paletteColor, COLOR_KEYS } from '../utils/categoryColor'
import { sortByName } from '../hooks/useInvestmentBoxes'
import ColorSwatchPicker from './ColorSwatchPicker'
import ConfirmDialog from './ConfirmDialog'

function InvestmentBoxManager({ investmentBoxes, setInvestmentBoxes, isLoading, loadError, onBoxDeleted }) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_KEYS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState(COLOR_KEYS[0])
  const [rowError, setRowError] = useState(null)

  const [deleteError, setDeleteError] = useState(null)
  const [pendingUpdateId, setPendingUpdateId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [defaultError, setDefaultError] = useState(null)

  const handleCreate = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return

    setCreateError(null)
    setIsCreating(true)

    createInvestmentBox({ name, color: newColor })
      .then((created) => {
        setInvestmentBoxes((prev) => sortByName([...prev, created]))
        setNewName('')
        setNewColor(COLOR_KEYS[0])
      })
      .catch((error) => {
        console.error('Erro ao criar caixinha:', error)
        setCreateError('Não foi possível criar a caixinha. O nome já pode existir.')
      })
      .finally(() => setIsCreating(false))
  }

  const startEditing = (box) => {
    setEditingId(box.id)
    setEditingName(box.name)
    setEditingColor(box.color)
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

    updateInvestmentBox(id, { name, color: editingColor })
      .then((updated) => {
        setInvestmentBoxes((prev) => sortByName(prev.map((box) => (box.id === id ? updated : box))))
        cancelEditing()
      })
      .catch((error) => {
        console.error('Erro ao atualizar caixinha:', error)
        setRowError('Não foi possível salvar. O nome já pode existir.')
      })
  }

  const handleSetDefault = (id) => {
    setDefaultError(null)

    setDefaultInvestmentBox(id)
      .then(() => {
        setInvestmentBoxes((prev) => sortByName(prev.map((box) => ({ ...box, is_default: box.id === id }))))
      })
      .catch((error) => {
        console.error('Erro ao definir caixinha padrão:', error)
        setDefaultError('Não foi possível definir a caixinha padrão. Tente novamente.')
      })
  }

  const handleDelete = (id) => {
    setDeleteError(null)

    deleteInvestmentBox(id)
      .then(() => {
        setInvestmentBoxes((prev) => prev.filter((box) => box.id !== id))
        onBoxDeleted?.()
      })
      .catch((error) => {
        console.error('Erro ao excluir caixinha:', error)
        setDeleteError('Não foi possível excluir a caixinha. Tente novamente.')
      })
  }

  return (
    <div className="entity-manager">
      <h2>Caixinhas de investimento</h2>

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
      {defaultError && <p className="form-error">{defaultError}</p>}

      {isLoading && <p className="state-message">Carregando caixinhas…</p>}
      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}
      {!isLoading && !loadError && investmentBoxes.length === 0 && (
        <p className="state-message">Nenhuma caixinha cadastrada ainda.</p>
      )}

      {!isLoading && !loadError && investmentBoxes.length > 0 && (
        <ul className="entity-list">
          {investmentBoxes.map((box) => {
            const color = paletteColor(box.color)
            const isEditing = editingId === box.id

            return (
              <li className="entity-row" key={box.id}>
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
                          onClick={() => setPendingUpdateId(box.id)}
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
                        {box.name}
                        {box.is_default && ' (padrão)'}
                      </span>
                      <div className="entity-actions">
                        {!box.is_default && (
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => handleSetDefault(box.id)}
                            aria-label="Definir como padrão"
                            title="Definir como padrão"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M8 1.6l1.85 3.75 4.14.6-3 2.92.71 4.13L8 11.06l-3.7 1.94.71-4.13-3-2.92 4.14-.6L8 1.6Z"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => startEditing(box)}
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
                        {!box.is_default && (
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            onClick={() => setPendingDeleteId(box.id)}
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

      <ConfirmDialog
        isOpen={pendingUpdateId !== null}
        title="Salvar alterações"
        message="Confirma as alterações nesta caixinha?"
        confirmLabel="Salvar"
        onConfirm={() => {
          handleUpdate(pendingUpdateId)
          setPendingUpdateId(null)
        }}
        onCancel={() => setPendingUpdateId(null)}
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Excluir caixinha"
        message="Tem certeza que deseja excluir esta caixinha? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onConfirm={() => {
          handleDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}

export default InvestmentBoxManager
