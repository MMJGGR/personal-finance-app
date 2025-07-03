import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinanceProvider, useFinance } from '../FinanceContext';

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});

afterEach(() => {
  localStorage.clear();
});

function ScoreDisplay() {
  const { riskScore } = useFinance();
  return <div data-testid="score">{riskScore}</div>;
}

test('marketShock event adjusts risk score', async () => {
  render(
    <FinanceProvider>
      <ScoreDisplay />
    </FinanceProvider>
  );
  const out = await screen.findByTestId('score');
  const start = Number(out.textContent);
  window.dispatchEvent(new CustomEvent('marketShock', { detail: { delta: 5 } }));
  await screen.findByText(String(start + 5));
});
