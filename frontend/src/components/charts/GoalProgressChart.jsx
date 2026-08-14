import { RadialBar, RadialBarChart } from 'recharts'

function GoalProgressChart({ percent, color }) {
  const clamped = Math.min(Math.max(percent, 0), 100)
  const data = [{ value: clamped, fill: color }]

  return (
    <div className="goal-progress-chart">
      <RadialBarChart
        width={96}
        height={96}
        cx={48}
        cy={48}
        innerRadius={34}
        outerRadius={46}
        barSize={10}
        startAngle={90}
        endAngle={-270}
        data={data}
      >
        <RadialBar
          dataKey="value"
          background={{ fill: 'var(--border)' }}
          cornerRadius={5}
          fill={color}
        />
      </RadialBarChart>
      <span className="goal-progress-value">{Math.round(percent)}%</span>
    </div>
  )
}

export default GoalProgressChart
