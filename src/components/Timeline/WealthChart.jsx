import React from 'react'
import { useFinance } from '../../FinanceContext'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardHeader, CardBody } from '../common/Card.jsx'

export default function WealthChart() {
  const { cumulativePV, startYear } = useFinance()
  const data = cumulativePV.map((v, i) => ({ year: startYear + i, value: v }))
  if (data.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-amber-800">Wealth Lifecycle</h3>
      </CardHeader>
      <CardBody className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#b45309" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  )
}
