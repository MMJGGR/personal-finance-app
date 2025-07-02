import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import Wizard from '../components/Profile/RiskOnboardingWizard'
import { riskSurveyQuestions } from '../config/riskSurvey'
import * as auditLog from '../utils/auditLog'

beforeAll(() => {
  global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} }
})

afterEach(() => {
  localStorage.clear()
  jest.restoreAllMocks()
})

test('renders all basic profile fields', () => {
  render(
    <FinanceProvider>
      <Wizard />
    </FinanceProvider>
  )
  expect(screen.getByTitle('First Name')).toBeInTheDocument()
  expect(screen.getByTitle('Last Name')).toBeInTheDocument()
  expect(screen.getByTitle('Email Address')).toBeInTheDocument()
  expect(screen.getByTitle('Phone Number')).toBeInTheDocument()
})

test('pre-populates form from seed data', () => {
  render(
    <FinanceProvider>
      <Wizard />
    </FinanceProvider>
  )
  expect(screen.getByTitle('First Name').value).toBe('Hadi')
  expect(screen.getByTitle('Email Address').value).toMatch(/hadi\.mwangi/)
})

test('risk summary updates on age change', async () => {
  render(
    <FinanceProvider>
      <Wizard />
    </FinanceProvider>
  )
  fireEvent.change(screen.getByTitle('Age'), { target: { value: '40' } })
  fireEvent.click(screen.getByText('Next'))
  for (let i = 0; i < riskSurveyQuestions.length; i++) {
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } })
    fireEvent.click(screen.getByText(i === riskSurveyQuestions.length - 1 ? 'Finish' : 'Next'))
  }
  await waitFor(() => {
    expect(screen.getByText(/Risk Score:/i)).toBeInTheDocument()
  })
})

test('shows validation error for invalid email', async () => {
  render(
    <FinanceProvider>
      <Wizard />
    </FinanceProvider>
  )
  const email = screen.getByTitle('Email Address')
  fireEvent.change(email, { target: { value: 'bad' } })
  await waitFor(() => {
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
  })
})

test('audit log record called on field change', () => {
  const spy = jest.spyOn(auditLog, 'record')
  render(
    <FinanceProvider>
      <Wizard />
    </FinanceProvider>
  )
  fireEvent.change(screen.getByTitle('Email Address'), { target: { value: 'a@b.com' } })
  expect(spy).toHaveBeenCalled()
})

test('renders risk survey questions', () => {
  render(
    <FinanceProvider>
      <Wizard />
    </FinanceProvider>
  )
  fireEvent.click(screen.getByText('Next'))
  expect(screen.getByText(riskSurveyQuestions[0].text)).toBeInTheDocument()
})
