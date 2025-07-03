## 🧭 Retirement Tab: Enterprise-Grade Enhancements (CFA-Aligned)

### 🔍 Current Observations
- Contains Voluntary Private Pension Contributions input (amount, timing, frequency).
- Missing field labels (e.g. "Start in" year or "Duration").
- Contributions don’t link to visible retirement assets.
- Lacks integration with drawdown strategies or tax treatment.
- UI cluttered; lacks user education or dynamic feedback.

### ✅ Refactor Goals
- Align fully with CFA retirement planning principles.
- Support accumulation + decumulation (drawdown) modeling.
- Surface projected pension income on the balance sheet and timeline.
- Clarify financial assumptions (e.g. annuity rates, life expectancy).
- Deliver a clean UI flow with advisory hooks.
- Solve retirement income risks common in real-life scenarios.

---

### 📋 Developer Implementation Tasks (Exhaustive)

#### Task Group 1: UI/UX Overhaul
**Files to modify:** `RetirementTab.jsx`, `pensionProjection.js`, `inputs.schema.js`
- [ ] Add labeled fields:
  - `Contribution Amount (KES)`
  - `Start in (Years)` or `Start Year`
  - `Contribution Duration (Years)`
  - `Frequency (Monthly/Annually)`
- [ ] Group inputs in two boxes: "Accumulation Phase" and "Drawdown Phase"
- [ ] Add switch/toggle: `Pension Type = Annuity / Self-Managed`
- [ ] Add tooltips for every field linked to glossary or assumptions
- [ ] Include a summary box: `Expected Monthly Income at Retirement`
- [ ] Validate all inputs on blur, block navigation unless all required fields filled

**Success Criteria:**
- All labels are visible and unambiguous
- Selecting toggle modifies projection behavior
- Tooltips explain each concept
- No layout overlap on screen widths ≥ 768px

**Test:**
- Enter values for all fields
- Switch between annuity and drawdown: result preview must update
- Attempt submit with missing fields: must be blocked

---

#### Task Group 2: Pension Projection Engine
**Files:** `pensionProjection.js`, `FinanceContext.jsx`, `incomeProjection.js`
- [ ] Implement accumulation logic: use compound interest to compute total pension value
- [ ] If `pensionType === "Annuity"`, apply annuity formula:
  - MonthlyIncome = PV × AnnuityRate / 12
- [ ] If `pensionType === "Self-Managed"`, apply SWR logic (e.g. 4% rule)
- [ ] Output income stream: `projectedPensionIncome[] = [{ year, amount }]`
- [ ] Save pension accumulation as `syntheticAsset` in context
- [ ] Create and push a new income source object:
  ```js
  {
    id: 'pension-income',
    label: 'Pension Income',
    source: 'projectedPension',
    startYear: retirementAge,
    endYear: lifeExpectancy,
    annualAmount: computedAnnualPension
  }
  ```
- [ ] Add this income source to `incomeStreams[]` in `FinanceContext`

**Success Criteria:**
- Pension value at retirement shown in summary
- Monthly income calculated correctly under both methods
- Income appears in `IncomeTab` if `includeInPlan = true`

**Test:**
- Unit test: Validate annuity vs. drawdown results for identical inputs
- Edge test: Start year after retirement should fail with advisory message
- Test visibility: income stream appears and disappears with toggle

---

#### Task Group 3: CFA Model Alignment
**Files:** `RetirementTab.jsx`, `FinanceContext.jsx`, `AdvisoryEngine.js`
- [ ] Add optional override fields:
  - Life Expectancy (default 85)
  - Target Replacement Rate (%)
  - Real Return Assumption (%)
- [ ] Compute funding adequacy:
  - Compare projected retirement income to replacement rate target
  - Flag shortfall or overfunding

**Success Criteria:**
- Inputs populate with user-defined or default values
- Advisory flag shows if shortfall >10% of target income

**Test:**
- Enter different retirement ages and targets → advisory flags update
- Unit test for funding gap logic

---

#### Task Group 4: Cross-Tab Orchestration
**Files:** `IncomeTab.jsx`, `BalanceSheetTab.jsx`, `StrategyTab.jsx`, `FinanceContext.jsx`
- [ ] Add computed pension stream to `incomeStreams[]` with source `"projectedPension"`
- [ ] Add synthetic asset: `type: "Pension"`, `presentValue: computedPV`
- [ ] Ensure risk capacity + strategy updates use pension certainty (if annuity is selected)

**Success Criteria:**
- Income tab shows "Pension" row after projection
- Balance sheet adds pension as asset (if toggle is on)
- Strategy shifts toward conservative if annuity covers ≥50% of retirement needs

**Test:**
- Activate annuity toggle → pension appears in income + balance sheet
- Disable → it disappears
- Strategy changes observed with toggle switch

---

#### Task Group 5: QA + Scenario Testing
- [ ] Scenario 1: Mid-career user (age 40), 25-year contribution, retirement at 65
- [ ] Scenario 2: FIRE user (age 30), 10-year plan, retirement at 45
- [ ] Scenario 3: Overfunded user (contribution + net worth exceed need)
- [ ] Scenario 4: User changes from drawdown to annuity mid-session

**Success Criteria:**
- All computed results persist across tabs and session reload
- Timeline displays accurate year-to-year pension impact
- UI never crashes on toggle or input changes

---

These tasks ensure the Retirement Tab transitions from basic input form to a full advisory engine with simulations, projections, strategy, and risk alignment — solving real human problems with actionable insights.

### 🎯 Retirement Income Risks Solved by This App

- **Longevity Risk**: Let users set life expectancy and simulate portfolio duration.
- **Sequence Risk**: Use timeline and Monte Carlo simulations to show worst-case paths.
- **Withdrawal Strategy Confusion**: Show both annuity and drawdown models with dynamic toggles.
- **Contribution–Outcome Disconnect**: Show users exactly how their current savings map to future income.
- **Underfunding Risk**: Highlight projected shortfalls early and suggest increase in contributions or delayed retirement.
- **Overconservatism**: Identify when user is overfunded and could afford to retire earlier or spend more.
- **Tax Efficiency**: Introduce toggles for tax-deferred vs taxable contributions and display net income streams.

### 📌 Additional Notes
- Ensure user can "opt in" to projecting pension or self-managing retirement capital.
- Add snapshot and timeline hooks to track pension capital growth + income transitions.
- Consider adding tax treatment toggle (tax-deferred vs. taxable account).
- Consider visualizing user's current position within their retirement arc (accumulation vs. decumulation).

These changes ensure the Retirement Tab becomes an advisor-grade module supporting both accumulation and decumulation phases, aligned with real-world advisory use cases, CFA frameworks, and modern retirement planning behavior.
