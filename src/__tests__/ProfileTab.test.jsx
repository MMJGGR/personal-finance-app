import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FinanceProvider } from '../FinanceContext'
import ProfileTab from '../components/Profile/ProfileTab'
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
      <ProfileTab />
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
      <ProfileTab />
    </FinanceProvider>
  )
  expect(screen.getByTitle('First Name').value).toBe('Hadi')
  expect(screen.getByTitle('Email Address').value).toMatch(/hadi\.mwangi/)
})

test('risk summary updates on age change', async () => {
  render(
    <FinanceProvider>
      <ProfileTab />
    </FinanceProvider>
  )
  fireEvent.change(screen.getByTitle('Age'), { target: { value: '40' } })
  await waitFor(() => {
    expect(screen.getByText(/Risk Score:/i)).toBeInTheDocument()
  })
})

test('shows validation error for invalid email', async () => {
  render(
    <FinanceProvider>
      <ProfileTab />
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
      <ProfileTab />
    </FinanceProvider>
  )
  fireEvent.change(screen.getByTitle('Email Address'), { target: { value: 'a@b.com' } })
  expect(spy).toHaveBeenCalled()
})
