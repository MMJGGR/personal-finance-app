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

## Error Handling

The entire application is wrapped in `AppErrorBoundary`, a thin wrapper around
`react-error-boundary`. If any component fails during render an unobtrusive
message is shown:

```
Oops—something went wrong. Please refresh or try a different tab.
```

Refreshing the page or navigating to another tab will usually recover. You can
customize the fallback by editing `src/AppErrorBoundary.jsx`.

## Linting and Testing

Before running `npm run lint` or `npm test` make sure all development dependencies are installed:

```bash
npm install
```

This ensures that ESLint and Jest are available locally.

## Configuration

Application settings are stored in local storage and can be modified under the **Settings** tab.  Available keys include:

- `inflationRate` – stored for reference only; PV calculations use nominal growth
- `expectedReturn` – expected yearly portfolio return
- `currency` – default ISO currency code
- `locale` – locale for number formatting
- `apiEndpoint` – URL to POST exported data
- `discretionaryCutThreshold` – percentage of monthly expenses that triggers discretionary advice
- `survivalThresholdMonths` – minimum months of PV coverage considered healthy
- `bufferPct` – buffer percent applied to loan strategy comparisons
- `retirementAge` – age when salary streams automatically cease if no `endYear` is set

Income sources now store a `startYear` and optional `endYear` so each stream can
begin or stop during the projection horizon. Salaries without an `endYear` use
`retirementAge` as the latest possible year.

## Hadi Persona Seed

A sample user profile is provided in `public/hadiSeed.json`. When the app starts
with no saved data, this file is fetched automatically so you can explore the
features immediately. Clear the site's local storage and refresh to reload the
defaults.

## Household & KYC Data

The **Profile** tab captures household details alongside optional know-your-client
(KYC) information. Fields such as nationality, tax residence, and ID number are
stored locally and used for risk scoring. These entries can be exported for
broker onboarding or regulatory checks. Update the form and changes will be
persisted automatically.

## Advice Engine

Utility modules under `src/utils` expose helper functions for generating spending and loan repayment advice.  The main entry point is `generateLoanAdvice`:

```javascript
import generateLoanAdvice from './src/utils/loanAdvisoryEngine'

const advice = generateLoanAdvice(loans, profile, income, expenses, discountRate, years)
console.log(advice.dti, advice.survival)
```

`calcDiscretionaryAdvice` suggests low‑priority expenses to cut when the monthly surplus falls below the configured threshold. `suggestLoanStrategies` ranks liabilities by interest saved when paying them off early.

## Local Storage Helper

The `storage` module under `src/utils` wraps `localStorage` and publishes events
whenever a key changes. Subscribe to updates with `storage.subscribe(key, cb)`
and clean up the returned unsubscribe function when done:

```javascript
import storage from './src/utils/storage'

const unsubscribe = storage.subscribe('example', v => {
  console.log('example changed to', v)
})

storage.set('example', '42')
// callback fires with "42"
unsubscribe()
```

Both `set` and `remove` notify subscribers so components stay in sync across
tabs or reloads.

## Investment Strategy

The app derives a default strategy from your profile. A `riskScore` is computed using the mapping in `src/riskScoreConfig.js`. Scores up to `6` yield a **Conservative** strategy, scores from `7–12` produce **Balanced** and anything higher defaults to **Growth**. Your selected investment horizon can override this: choosing **<3 years** forces **Conservative** while **>7 years** results in **Growth**.

The chosen strategy is stored in `FinanceContext` and persisted in local storage. You may pick a different option under the **Balance Sheet** tab which overrides the automatic choice and is saved for later visits.

## Insurance Calculator

The **Insurance** tab provides an estimate of emergency savings and life cover
needs. It relies on the helper functions in
`src/utils/insuranceUtils.js`:

```javascript
import { computeEmergencyFund, computeLifeCover } from './src/utils/insuranceUtils'
```

Monthly expenses along with your dependents and marital status determine the
recommended amounts.

## API Export

Data entered in the app can be posted to an external service. Set the
`apiEndpoint` value under **Settings** and use the helpers from
`src/utils/exportHelpers.js` to build payloads:

```javascript
import { buildIncomeJSON, buildPlanJSON, submitProfile } from './src/utils/exportHelpers'
```

Calling `submitProfile()` sends the generated JSON to the configured endpoint.

## Cash-Flow Adequacy

The file `src/engines/adequacy.js` exposes helpers for evaluating whether future
cash flows cover upcoming expenses. `computeSurvivalMonths` delegates to the
appropriate survival metric—nominal, PV or obligation based—while
`computeFundingGaps` converts the cumulative present value stream into annual
deficits. These functions power the Adequacy Alert described below.

### Adequacy Alert

The `AdequacyAlert` component consumes the `cumulativePV` array from
`FinanceContext` and displays any funding gaps by year. It is rendered below the
income projection chart on the **Income** tab and at the bottom of the
**Balance Sheet** tab. A short "View Funding Gaps" link on each page scrolls to
the alert when deficits exist.

## Manual Verification

### Verifying Charts
1. Open the **Balance Sheet** tab and add an asset worth `100000` named *Test Asset*.
2. Add a liability called *Test Loan* for `20000`.
3. The bar and pie charts should refresh immediately. The **Net Worth** figure should read **KES 1,580,000** which equals `1,500,000 + 100,000 - 20,000`.
4. Remove the test entries after confirming the charts update.

### Stress Testing Metrics
1. In the **Expenses** tab create a monthly expense named *Rent* of `2000`.
2. Switch to the **Income** tab and set `Years` to `5` and `Discount Rate` to `5`.
3. Under **Interrupted Sources** select your salary to simulate losing that income.
4. `Interruption Months` will drop to **0** because no income covers the obligations. Re-select the salary and the metric will recompute.

Testers can mirror these values in a spreadsheet using the formula:
```
Net Worth = Assets - Liabilities + Income PV - Expenses PV - Goals PV
```
With the example figures above the spreadsheet result should match **KES 1,580,000**.

## License

This project is proprietary. All rights are reserved and it is not covered by an open-source license. Redistribution is prohibited without written permission.

