import React from 'react'
import { render, screen } from '@testing-library/react'
import AppErrorBoundary from '../AppErrorBoundary'

function Boom() {
  throw new Error('Boom')
}

test('boundary renders fallback when child throws', () => {
  render(
    <AppErrorBoundary>
      <Boom />
    </AppErrorBoundary>
  )
  expect(
    screen.getByText(/something went wrong/i)
  ).toBeInTheDocument()
})
