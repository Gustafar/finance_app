export const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Saída' },
  { value: 'income', label: 'Entrada' },
  { value: 'investment', label: 'Investimento' },
]

export const TRANSACTION_TYPE_AMOUNT_STYLE = {
  income: { prefix: '+ ', className: 'expense-amount--income' },
  expense: { prefix: '- ', className: 'expense-amount--expense' },
  investment: { prefix: '+ ', className: 'expense-amount--investment' },
}
