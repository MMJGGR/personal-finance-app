# Personal Finance App

This web application helps you manage your finances by tracking income, expenses and goals. Use the different tabs to add new transactions, review your balance sheet and update your profile or settings. Recurring expenses are entered in the **Expenses** section. One-off outflows should be added as **Goals** so they can be planned for a specific year.

## Getting Started

Install dependencies and launch the development server:

```bash
npm install
npm run dev
```

Visit the printed URL to view the app. Changes under `src/` trigger automatic reloads.

To create a production build run:

```bash
npm run build
npm run preview
```

## Tooling

The project uses [React](https://react.dev/) with [Vite](https://vitejs.dev/) for the build system. Styling is powered by Tailwind CSS and ESLint provides linting rules.

## Configuration

Application settings are stored in local storage and can be modified under the **Settings** tab.  Available keys include:

- `inflationRate` – annual inflation assumption used in PV calculations
- `expectedReturn` – expected yearly portfolio return
- `currency` – default ISO currency code
- `locale` – locale for number formatting
- `apiEndpoint` – URL to POST exported data
- `discretionaryCutThreshold` – percentage of monthly expenses that triggers discretionary advice
- `survivalThresholdMonths` – minimum months of PV coverage considered healthy
- `bufferPct` – buffer percent applied to loan strategy comparisons

## Advice Engine

Utility modules under `src/utils` expose helper functions for generating spending and loan repayment advice.  The main entry point is `generateLoanAdvice`:

```javascript
import generateLoanAdvice from './src/utils/loanAdvisoryEngine'

const advice = generateLoanAdvice(loans, profile, income, expenses, discountRate, years)
console.log(advice.dti, advice.survival)
```

`calcDiscretionaryAdvice` suggests low‑priority expenses to cut when the monthly surplus falls below the configured threshold. `suggestLoanStrategies` ranks liabilities by interest saved when paying them off early.
