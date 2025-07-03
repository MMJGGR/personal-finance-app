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

-Application settings are stored in local storage and can be modified under the **Settings** tab (Preferences). Available keys include:

- `inflationRate` – annual rate applied to expenses when no specific growth is set
- `expectedReturn` – expected yearly portfolio return
- `currency` – default ISO currency code
- `locale` – locale for number formatting
- `discountRate` – rate used when discounting future cash flows (edit **Discount Rate (%)** under *Settings*)
- `projectionYears` – number of years to project on the Income tab (edit **Projection Years** under *Settings*)
- `apiEndpoint` – URL to POST exported data
- `discretionaryCutThreshold` – percentage of monthly expenses that triggers discretionary advice
- `survivalThresholdMonths` – minimum months of PV coverage considered healthy
- `bufferPct` – buffer percent applied to loan strategy comparisons
- `retirementAge` – age when salary streams automatically cease if no `endYear` is set

Income sources now store a `startYear` and optional `endYear` so each stream can
begin or stop during the projection horizon. Salaries without an `endYear` use
`retirementAge` as the latest possible year.

Expenses and goals also track `startYear` and `endYear`. Recurring expenses can
phase in or out while one-time goals typically use the same year for both
fields.

## Persona Seed

The app ships with a single sample profile for **Hadi Alsawad** under
`src/data/personas.json`. When the app starts with no saved data, Hadi's persona
is loaded automatically so you can explore the features. Use **Add Persona** in
the sidebar to launch the profile wizard and create your own entries. Each
persona's profile, income sources and other lists are stored in local storage
under keys like `profile-{id}`. Delete unwanted personas with the small **Delete
Persona** buttons. Use the **Reset to Defaults** button on the Profile tab to
restore Hadi's data at any time.

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

The app derives a default strategy from your profile. A `riskScore` is computed using the weights defined in `src/config/riskConfig.js`. Scores range from `0`–`100` and are classified as **Conservative** (`0–30`), **Balanced** (`31–70`) or **Growth** (`71+`). Your selected investment horizon can override this: choosing **<3 years** forces **Conservative** while **>7 years** results in **Growth**.

The chosen strategy is stored in `FinanceContext` and persisted in local storage. You may pick a different option under the **Balance Sheet** tab which overrides the automatic choice and is saved for later visits.

### Risk Score Migration

Earlier releases stored risk scores on a 0–12 scale. On startup the app checks
`riskScore` in local storage and treats values of 12 or less as legacy. If a
profile is available the score is recomputed using the new algorithm; otherwise
the old value is scaled to the 0–100 range and written back.

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

### Data Compliance

The submission helper strips personally identifiable information before
POSTing data. Fields such as email, phone number and address are removed
so the payload only contains non-sensitive profile attributes. Unit tests
cover this behavior in `compliance.test.js`.

## Income Views

Above the income chart you'll find **Nominal** and **Discounted** buttons used to toggle between raw projections and present value figures. The expenses chart in **Expenses & Goals** and the surplus (cashflow) chart on the **Balance Sheet** tab offer the same controls. Adjust the assumptions using the **Discount Rate (%)** and **Projection Years** fields under **Settings**.

### Managing Income Sources
The **Income** tab now includes **Clear** and **Reset Defaults** buttons next to the export options. Use **Clear** to remove all entries and **Reset Defaults** to insert a starter salary stream beginning in the selected start year.

## Manual Verification

### Verifying Charts
1. Open the **Balance Sheet** tab and add an asset worth `100000` named *Test Asset*.
2. Add a liability called *Test Loan* for `20000`.
3. The bar and pie charts should refresh immediately. The **Net Worth** figure should read **KES 1,580,000** which equals `1,500,000 + 100,000 - 20,000`.
4. Remove the test entries after confirming the charts update.
#### Lifetime Stacked Chart

The **Lifetime** stacked chart visualizes cash flow across all years. Each series tracks one of the main categories:
- **Income** for projected earnings
- **Expenses** for recurring outflows
- **Goals** for planned one-time spends
- **Debt** for outstanding liabilities
- **Investments** for contributions and growth
- **Pension** for retirement savings

Click any legend label to show or hide that series. The chart is most useful with the default Hadi Persona seed (or another populated profile) loaded.

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

