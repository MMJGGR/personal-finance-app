import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinanceProvider } from '../FinanceContext';
import PreferencesTab from '../tabs/PreferencesTab';

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});

test('preferences tab renders correctly', () => {
  render(
    <FinanceProvider>
      <PreferencesTab />
    </FinanceProvider>
  );
  expect(screen.getByText(/Global Settings/i)).toBeInTheDocument();
  expect(screen.getByTitle('Discount rate')).toBeInTheDocument();
  expect(screen.getByTitle('Projection years')).toBeInTheDocument();
});
