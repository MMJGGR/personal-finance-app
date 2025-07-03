import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'
import { FinanceProvider } from '../FinanceContext'
import { riskSurveyQuestions } from '../config/riskSurvey'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
})

test('end-to-end onboarding through income tab', async () => {
  render(
    <FinanceProvider>
      <App />
    </FinanceProvider>
  )

  await screen.findByText(/Client Profile/i)
  fireEvent.click(screen.getByText('Next'))

  // Income, Assets, and Goals steps
  fireEvent.click(screen.getByText('Next'))
  fireEvent.click(screen.getByText('Next'))
  fireEvent.click(screen.getByText('Next'))

  for (let i = 0; i < riskSurveyQuestions.length; i++) {
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } })
    fireEvent.click(
      screen.getByText(i === riskSurveyQuestions.length - 1 ? 'Finish' : 'Next')
    )
  }

  fireEvent.click(screen.getByRole('tab', { name: /Income/i }))
  const heading = await screen.findByText(/Income Sources/i)
  expect(heading).toBeInTheDocument()
})
