# Phased Refactor & Implementation Guide

This document outlines a multi-phase plan to refactor and enhance the core tabs of the Personal Finance App. Each phase groups related work so that AI-powered assistants or junior developers can execute changes efficiently and with clear orchestration across files.

---

## Phase 1: Foundation & Core Provider Fixes

**Objective:** Stabilize the Context layer, fix import errors, and resolve CSP/HMR issues so downstream UI work can proceed without crashes.

1. **Fix `FinanceContext.jsx`:**
   - **Add missing JSX return & exports** (after final `useEffect`).
   - **Audit `useEffect` loops**:  
     - Add guards (`if (newVal !== oldVal)`) around every `setState` in effects.  
     - Include both source and target variables in dependency arrays.  
     - Remove any two-way mirroring (e.g. avoid writing `settings.startYear ↔ startYear` twice).
2. **Resolve `projectPensionGrowth` ReferenceError:**
   - In `utils/pensionProjection.js`, confirm whether it’s a **default** or **named** export.  
   - Adjust import in `FinanceContext.jsx` accordingly.
3. **Update CSP & HMR Config:**
   - In `vite.config.js` (or server headers), add `img-src 'self' data:` to CSP.  
   - Verify `server.hmr` settings and restart Vite to clear “WebSocket connection failed.”

---

## Phase 2: ProfileTab.jsx — Enterprise-Grade KYC & Risk

**Files:**  
- `src/components/Profile/ProfileTab.jsx`  
- `src/utils/auditLog.js`  
- `src/context/PersonaContext.jsx`

### 2.1 Expand & Integrate KYC Fields
- Un-`FIXME` and wire up all KYC fields (name, email, phone, address, nationality, ID/passport, tax jurisdiction/residence, employmentStatus).  
- Persist in `FinanceContext` and include in audit log.

### 2.2 Advanced Risk Assessment
- Replace basic questionnaire with a **2-dimensional risk engine** (capacity vs. willingness).  
- Map answers to CFA-aligned scoring rules; categorize into Conservative/Balanced/Growth.

### 2.3 Robust Validation & Security
- Add per-field validators (regex for email/phone, range checks).  
- Show inline error messages.  
- Ensure sensitive data is encrypted on save (if backend) or obfuscated in storage.

### 2.4 Audit & Compliance
- Extend `auditLog` to capture: field name, old/new value, timestamp, user/actor ID.  
- Store logs in a secure, append-only store (e.g. `auditLogs.json` or backend API).

---

## Phase 3: PreferencesTab.jsx — Scenario-Ready Settings

**Files:**  
- `src/tabs/PreferencesTab.jsx`  
- `src/context/FinanceContext.jsx`  
- `src/utils/validationSchemas.js`

### 3.1 Scenario Inputs & Backups
- Group core parameters (inflation, return, discount) into named **scenarios** (Base / Upside / Downside).  
- Add “Save Scenario” & “Load Scenario” controls; persist in localStorage or backend.

### 3.2 Enhanced Tax & Compliance
- Replace JSON textarea for tax brackets with a **table editor** component.  
- Validate bracket definitions against schema; show errors inline.

### 3.3 Localization & API Security
- Flesh out `apiEndpoint` field: require HTTPS, validate URL format.  
- Add auth token input; store securely.

### 3.4 Audit Trail & Help
- Log every settings change via `auditLog`.  
- Add inline tooltips/documentation for each field (via a shared `<Tooltip />` component).

---

## Phase 4: IncomeTab.jsx — Detailed PV & Health Metrics

**Files:**  
- `src/components/Income/IncomeTab.jsx`  
- `src/utils/financeUtils.js`  
- `src/components/Charts/IncomeTimelineChart.jsx`

### 4.1 Income Source Enhancements
- Add sub-types for salary: Base / Bonus / Variable.  
- Allow bulk import of income sources (CSV upload).

### 4.2 Accurate Tax Calculations
- Integrate real-world tax engines or stubbed API calls; replace `calculatePAYE`/`calculateNSSF` with configurable rules per jurisdiction.

### 4.3 Scenario & What-If Mode
- Add toggles for alternate growth assumptions; regenerate timeline upon scenario selection.  
- Add “compare scenarios” view.

### 4.4 Expanded Health Metrics
- Implement additional metrics: Debt Service Ratio, Savings Rate, Emergency Fund Coverage.  
- Show them in a summary card deck above the chart.

---

## Phase 5: ExpensesGoalsTab.jsx — Cashflow & Optimization

**Files:**  
- `src/tabs/ExpensesGoalsTab.jsx`  
- `src/utils/cashflowBuilder.js`  
- `src/components/Charts/ExpensesStackedBarChart.jsx`

### 5.1 Expense & Goal Categorization
- Introduce category/subcategory taxonomy; allow custom categories.  
- Bulk edit mode & template library for common expenses/goals.

### 5.2 Advanced PV & Strategy
- Expose separate PV models for fixed vs. variable expenses.  
- Add “optimize expenses” engine recommending cuts by priority and impact.

### 5.3 Debt Management Module
- Build a mini-dashboard for liabilities: amortization schedule, interest saved, refinancing options.  
- Integrate `suggestLoanStrategies` with detailed projections.

### 5.4 Full Cashflow Timeline
- Merge Income, Expenses, Goals, Liabilities, Investments, Pension streams into one timeline.  
- Add dynamic filters (e.g. show only discretionary, only loans).

---

## Phase 6: InvestmentsTab.jsx & StrategyTab.jsx — New Modules

**Files:**  
- `src/tabs/InvestmentsTab.jsx`  
- `src/tabs/StrategyTab.jsx`  
- `src/utils/investmentEngine.js`

### 6.1 InvestmentsTab MVP
- CRUD for various asset classes; link to real-time pricing API (mocked).  
- Portfolio overview: allocation pie, time-weighted return.

### 6.2 StrategyTab Analytics
- Pull together data from Profile, Income, Expenses, Investments.  
- Generate personalized recommendations: savings rate, allocation, debt paydown, insurance.  
- Render “What-If” scenario simulator with charts.

---

## Phase 7: RetirementTab.jsx & BalanceSheetTab.jsx — Advanced Planning

**Files:**  
- `src/tabs/RetirementTab.jsx`  
- `src/tabs/BalanceSheetTab.jsx`  
- `src/utils/monteCarlo.js`

### 7.1 RetirementTab: Monte Carlo & Beyond
- Enhance Monte Carlo: multiple asset classes, inflation-adjusted withdrawals, tax impact.  
- Add sensitivity analysis controls.

### 7.2 BalanceSheetTab: Reporting & Alerts
- Historical net worth chart, heatmap of asset allocation over time.  
- Alerts for ratio breaches (e.g. debt/assets > 50%).

### 7.3 Integration & Exports
- CSV/PDF export for reports.  
- Backend sync endpoints for saving/loading full user plans.

---

## Phase 8: InsuranceTab.jsx & Final Polish

**Files:**  
- `src/tabs/InsuranceTab.jsx`  
- `src/utils/insuranceCalculator.js`

### 8.1 Comprehensive Insurance Needs
- Add modules for disability, health, LTC, property/casualty.  
- Integrate with real carrier APIs for quotes.

### 8.2 User Education & Compliance
- Inline explanations, glossary popovers.  
- Regulatory disclosure modal.

### 8.3 Audit & Security Review
- Ensure all tabs write to a centralized audit log.  
- Perform vulnerability scan and fix any CSP/CORS issues.

---

**End of Phases**  
By following these phases, the team can incrementally build out enterprise-grade, CFA-compliant features, maintain orchestration across files, and hand off clear, self-contained tasks to AI or developers at each step.

**Important before finalizing each change**
Please run and verify tests after each change to ensure the code still compiles and functions correctly before committing, and provide a brief summary of what you modified with each commit.