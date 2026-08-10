import { useState } from 'react'
import { createPaymentMethod, updatePaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } from '../api/paymentMethods'
import { paletteColor, COLOR_KEYS } from '../utils/categoryColor'
import { usePaymentMethods, sortByName } from '../hooks/usePaymentMethods'
import { useBulkSelection } from '../hooks/useBulkSelection'
import ColorSwatchPicker from './ColorSwatchPicker'
import ConfirmDialog from './ConfirmDialog'
import LoadingBar from './LoadingBar'
import SelectionToolbar from './SelectionToolbar'

function PaymentMethodManager() {
  const { paymentMethods, setPaymentMethods, isLoading, error: loadError } = usePaymentMethods()
  const { isSelecting, selectedIds, toggleSelecting, toggleId } = useBulkSelection()
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

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

    createPaymentMethod({ name, color: newColor })
      .then((created) => {
        setPaymentMethods((prev) => sortByName([...prev, created]))
        setNewName('')
        setNewColor(COLOR_KEYS[0])
      })
      .catch((error) => {
        console.error('Erro ao criar método de pagamento:', error)
        setCreateError('Não foi possível criar o método de pagamento. O nome já pode existir.')
      })
      .finally(() => setIsCreating(false))
  }

  const startEditing = (paymentMethod) => {
    setEditingId(paymentMethod.id)
    setEditingName(paymentMethod.name)
    setEditingColor(paymentMethod.color)
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

    updatePaymentMethod(id, { name, color: editingColor })
      .then((updated) => {
        setPaymentMethods((prev) =>
          sortByName(prev.map((paymentMethod) => (paymentMethod.id === id ? updated : paymentMethod)))
        )
        cancelEditing()
      })
      .catch((error) => {
        console.error('Erro ao atualizar método de pagamento:', error)
        setRowError('Não foi possível salvar. O nome já pode existir.')
      })
  }

  const handleSetDefault = (id) => {
    setDefaultError(null)

    setDefaultPaymentMethod(id)
      .then(() => {
        setPaymentMethods((prev) =>
          sortByName(prev.map((paymentMethod) => ({ ...paymentMethod, is_default: paymentMethod.id === id })))
        )
      })
      .catch((error) => {
        console.error('Erro ao definir método de pagamento padrão:', error)
        setDefaultError('Não foi possível definir o método de pagamento padrão. Tente novamente.')
      })
  }

  const handleDelete = (id) => {
    setDeleteError(null)

    deletePaymentMethod(id)
      .then(() => {
        setPaymentMethods((prev) => prev.filter((paymentMethod) => paymentMethod.id !== id))
      })
      .catch((error) => {
        console.error('Erro ao excluir método de pagamento:', error)
        setDeleteError('Não foi possível excluir o método de pagamento. Tente novamente.')
      })
  }

  return (
    <div className="entity-manager">
      {isLoading && <LoadingBar variant="dialog" />}
      <h2>Métodos de pagamento</h2>

      <form className="entity-create-form" onSubmit={handleCreate}>
        <div className="entity-create-form-row">
          <input
            type="text"
            placeholder="Novo método"
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

      {!isLoading && loadError && <p className="state-message state-message--error">{loadError}</p>}
      {!isLoading && !loadError && paymentMethods.length === 0 && (
        <p className="state-message">Nenhum método de pagamento cadastrado ainda.</p>
      )}

      {!isLoading && !loadError && paymentMethods.length > 0 && (
        <SelectionToolbar
          isSelecting={isSelecting}
          count={selectedIds.size}
          onToggle={toggleSelecting}
          onDeleteClick={() => setIsBulkDeleteOpen(true)}
        />
      )}

      {!isLoading && !loadError && paymentMethods.length > 0 && (
        <ul className="entity-list">
          {paymentMethods.map((paymentMethod) => {
            const color = paletteColor(paymentMethod.color)
            const isEditing = editingId === paymentMethod.id
            const isSelected = selectedIds.has(paymentMethod.id)

            return (
              <li
                className={`entity-row${isSelected ? ' entity-row--selected' : ''}`}
                key={paymentMethod.id}
                onClick={() => isSelecting && !paymentMethod.is_default && toggleId(paymentMethod.id)}
              >
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
                          onClick={() => setPendingUpdateId(paymentMethod.id)}
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
                        {paymentMethod.name}
                        {paymentMethod.is_default && ' (padrão)'}
                      </span>
                      <div className="entity-actions">
                        {isSelecting ? (
                          !paymentMethod.is_default && (
                            <input
                              type="checkbox"
                              className="select-checkbox"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleId(paymentMethod.id)}
                              aria-label="Selecionar método de pagamento"
                            />
                          )
                        ) : (
                          <>
                            {!paymentMethod.is_default && (
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => handleSetDefault(paymentMethod.id)}
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
                              onClick={() => startEditing(paymentMethod)}
                              aria-label="Editar método de pagamento"
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
                            {!paymentMethod.is_default && (
                              <button
                                type="button"
                                className="icon-btn icon-btn--danger"
                                onClick={() => setPendingDeleteId(paymentMethod.id)}
                                aria-label="Excluir método de pagamento"
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
                          </>
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
        message="Confirma as alterações neste método de pagamento?"
        confirmLabel="Salvar"
        onConfirm={() => {
          handleUpdate(pendingUpdateId)
          setPendingUpdateId(null)
        }}
        onCancel={() => setPendingUpdateId(null)}
      />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Excluir método de pagamento"
        message="Tem certeza que deseja excluir este método de pagamento? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onConfirm={() => {
          handleDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
        onCancel={() => setPendingDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        title="Excluir métodos de pagamento"
        message={`Tem certeza que deseja excluir os ${selectedIds.size} métodos de pagamento selecionados? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onConfirm={() => {
          selectedIds.forEach((id) => handleDelete(id))
          setIsBulkDeleteOpen(false)
          toggleSelecting()
        }}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />
    </div>
  )
}

export default PaymentMethodManager
