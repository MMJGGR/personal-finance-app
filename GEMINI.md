```
# Phased Refactor & Implementation Guide (Updated)

This document outlines a multi-phase plan to refactor and enhance the core tabs of the Personal Finance App. Each phase groups related work so that AI-powered assistants or junior developers can execute changes efficiently and with clear orchestration across files.

---

## Phase 0 – Quality, Testing & CI
**Objective:** Establish a robust foundation for code quality, automated testing, and continuous integration before feature development.

1. **CI/CD Pipeline Setup**
   - Configure GitHub Actions (or equivalent) for:
     - Linting (ESLint, Prettier)
     - Unit & integration tests (Jest, React Testing Library)
     - Code coverage report (threshold ≥ 80%)
   - Add badge to README.
2. **Testing Strategy**
   - Write test plans for each tab’s critical flows.
   - Implement global error boundary and smoke tests for core user journeys.
3. **Quality Gates**
   - Enforce pull-request checks: lint, tests, coverage.
   - Add vulnerability scanning (npm audit or Snyk).  

---

## Phase 1 – Foundation & Core Provider Fixes
**Objective:** Stabilize Context layer, resolve import errors, CSP/HMR issues so downstream UI work can proceed without crashes.

1. **Fix `FinanceContext.jsx`**
   - Add missing JSX `return` & exports after final `useEffect`.
   - Audit `useEffect` loops:
     - Guard state updates (`if (newVal !== oldVal)`).
     - Ensure correct dependency arrays (include source & target variables).
     - Remove redundant two-way mirroring.
2. **Resolve `projectPensionGrowth` ReferenceError**
   - Confirm named vs. default export in `utils/pensionProjection.js`.
   - Align imports in `FinanceContext.jsx`.
3. **Update CSP & HMR Config**
   - In `vite.config.js`, add `img-src 'self' data:` to CSP.
   - Verify `server.hmr` settings; restart Vite to clear WebSocket errors.

---

## Phase 2 – ProfileTab.jsx — Enterprise-Grade KYC & Risk
**Files:** `ProfileTab.jsx`, `auditLog.js`, `PersonaContext.jsx`

1. **Expand & Integrate KYC Fields**
   - Un-`FIXME` and wire up all fields: name, email, phone, address, nationality, ID/passport, tax residence, employment status.
   - Persist in `FinanceContext` and extend `auditLog` to capture changes (field, old/new, timestamp, user ID).
2. **Advanced Risk Engine**
   - Replace basic questionnaire with 2D risk model (capacity vs. willingness).
   - Implement CFA-aligned scoring and categorize into Conservative/Balanced/Growth.
3. **Validation & Security**
   - Add per-field validators (regex, range checks) & inline error messages.
   - Obfuscate or encrypt sensitive data on save.

---

## Phase 3 – PreferencesTab.jsx — Scenario-Ready Settings
**Files:** `PreferencesTab.jsx`, `FinanceContext.jsx`, `validationSchemas.js`

1. **Scenario Management**
   - Group parameters (inflation, return, discount) into named scenarios (Base/Upside/Downside).
   - Add Save/Load Scenario controls; persist to `localStorage` or backend.
2. **Tax Bracket Editor**
   - Replace JSON textarea with table editor component.
   - Validate against schema with inline errors.
3. **API & Localization Prep**
   - Validate `apiEndpoint` (HTTPS only) & auth token input.
   - Extract UI text for i18n (e.g., with `react-intl`).
   - Prepare number & currency formatting settings.
4. **Audit Trail & Help**
   - Log settings changes in `auditLog`.
   - Add inline tooltips via shared `<Tooltip />`.

---

## Phase 4 – IncomeTab.jsx — Detailed PV & Health Metrics
**Files:** `IncomeTab.jsx`, `financeUtils.js`, `IncomeTimelineChart.jsx`

1. **Income Source Enhancements**
   - Support salary sub-types: Base/Bonus/Variable.
   - Bulk import via CSV upload.
2. **Tax Calculation Engine**
   - Integrate stubbed or real API for PAYE/NSSF; make rules configurable by jurisdiction.
3. **Scenario & What-If Analysis**
   - UI toggles for alternate growth assumptions; dynamic timeline regeneration.
   - Compare multiple scenarios side-by-side.
4. **Health Metrics**
   - Add Debt-Service-Ratio, Savings Rate, Emergency Fund Coverage in summary cards.

---

## Phase 5 – ExpensesGoalsTab.jsx — Cashflow & Optimization
**Files:** `ExpensesGoalsTab.jsx`, `cashflowBuilder.js`, `ExpensesStackedBarChart.jsx`

1. **Categorization & Templates**
   - Category/subcategory taxonomy; custom categories.
   - Bulk edit mode & template library.
2. **PV Models & Optimization**
   - Separate PV models for fixed vs. variable expenses.
   - ‘Optimize Expenses’ engine recommending cuts by impact.
3. **Debt Management Dashboard**
   - Liabilities mini-dashboard: amortization schedule, interest saved, refinancing options.
   - Integrate `suggestLoanStrategies` with projections.
4. **Unified Cashflow Timeline**
   - Merge Income, Expenses, Goals, Liabilities, etc., into one timeline.
   - Dynamic filters (e.g., discretionary only).

---

## Phase 6 – InvestmentsTab.jsx & AdviceDashboard
**Files:** `InvestmentsTab.jsx`, `StrategyTab.jsx`, `investmentEngine.js`

1. **InvestmentsTab MVP**
   - CRUD for asset classes; mock real-time pricing API.
   - Portfolio overview: allocation pie, TWR.
2. **AdviceDashboard Prototype**
   - Simple rule-based recommendations (savings rate, allocation tweaks).
   - Export to CSV/JSON.

---

## Phase 7 – RetirementTab.jsx & BalanceSheetTab.jsx — Advanced Planning
**Files:** `RetirementTab.jsx`, `BalanceSheetTab.jsx`, `monteCarlo.js`

1. **RetirementTab: Monte Carlo & Sensitivity**
   - Multi-asset support, inflation-adjusted withdrawals, tax impact.
   - Sensitivity analysis controls.
2. **BalanceSheetTab: Reporting & Alerts**
   - Net worth history, allocation heatmap.
   - Ratio alerts (e.g., debt/assets > 50%).
3. **Exports & Integration**
   - CSV/PDF reports.
   - Backend sync endpoints.

---

## Phase 8 – InsuranceTab.jsx & Final Polish
**Files:** `InsuranceTab.jsx`, `insuranceCalculator.js`

1. **Comprehensive Insurance Needs**
   - Modules for disability, health, LTC, property/casualty.
   - Integrate carrier-quote APIs.
2. **User Education & Compliance**
   - Glossary popovers & inline explanations.
   - Regulatory disclosure modal.
3. **Security Review**
   - Centralized audit log for all tabs.
   - CSP/CORS vulnerability fixes.

---

## Phase 9 – Performance, Accessibility & Internationalization
**Objective:** Ensure enterprise-grade UX and global readiness.

1. **Performance Audits**
   - Bundle-size analysis (Vite Rollup stats).
   - Lighthouse performance score ≥ 90.
2. **Accessibility Compliance**
   - WCAG 2.1 AA audits (axe, Lighthouse).
   - Keyboard navigation & screen-reader testing.
3. **Internationalization (i18n)**
   - Implement locale switcher.
   - Validate currency & date formats across locales.

---

## Phase 10 – Mobile & Final Polish

1. **Responsive Design**
   - Test & fix on mobile breakpoints.
   - Touch-target adjustments.
2. **UX Tweaks & Polish**
   - Final UI animations & transitions.
   - Tone & copy review for clarity.
3. **Release & Rollout Plan**
   - Beta release testing.
   - Gathering user feedback & bug triage.

---

**Important before finalizing each change:**
- Run and verify tests, linting, and CI checks.  
- Summarize modified files and key changes in each commit message.

```
