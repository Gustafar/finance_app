function SummaryCard({ label, value, sub, tone = 'default' }) {
  return (
    <div className={`summary-card summary-card--${tone}`}>
      <span className="summary-card-label">{label}</span>
      <span className="summary-card-value">{value}</span>
      {sub && <span className="summary-card-sub">{sub}</span>}
    </div>
  )
}

export default SummaryCard
