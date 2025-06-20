import React, { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { calculateAmortizedPayment } from '../utils/financeUtils'

function LiabilityRow() {
  const [principal, setPrincipal] = useState(1000)
  const [rate, setRate] = useState(5)
  const [term, setTerm] = useState(1)
  const [payment, setPayment] = useState('')

  const compute = () => {
    const val = calculateAmortizedPayment(principal, rate, term, 12)
    setPayment(val.toFixed(2))
  }

  return (
    <div>
      <input aria-label="Principal" type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value))} />
      <input aria-label="Interest rate" type="number" value={rate} onChange={e => setRate(Number(e.target.value))} />
      <input aria-label="Term years" type="number" value={term} onChange={e => setTerm(Number(e.target.value))} />
      <button onClick={compute}>Compute</button>
      <div data-testid="payment">{payment}</div>
    </div>
  )
}

test('Compute button sets monthly payment', () => {
  render(<LiabilityRow />)
  fireEvent.change(screen.getByLabelText('Principal'), { target: { value: '2000' } })
  fireEvent.change(screen.getByLabelText('Interest rate'), { target: { value: '6' } })
  fireEvent.change(screen.getByLabelText('Term years'), { target: { value: '2' } })
  fireEvent.click(screen.getByText('Compute'))
  const expected = calculateAmortizedPayment(2000, 6, 2, 12)
  expect(Number(screen.getByTestId('payment').textContent)).toBeCloseTo(expected)
})
