// FILE: ProfileModulePlan.md

## 🎯 Objective

Rebuild the Profile & Risk Module from the ground up as the central orchestration engine for every financial and personal data point in the app. It must:

- Ingest, version and expose personal details, financial streams, life events and behavioral insights.
- Drive all other features (Income, Expenses, Goals, Balance Sheet, Planning) through a single source of truth.
- Adapt dynamically to any individual’s circumstances at different life stages, without hard‑coding for one persona.
- Support progressive profiling, allowing data to be added, updated or rolled back without losing history.
- Align with CFA phases (Accumulation → Transition → Distribution) and enterprise‑grade best practices.

---

## 🔄 Dynamic, Multi‑Persona Architecture

Rather than customizing for a single user, the module must be flexible enough to:

- Accept an unlimited variety of personas, each defined by demographic data, financial streams, life events and risk preferences.
- Load, update and version snapshots of a persona’s profile so that past and present states remain accessible.
- Drive personalized insights and recommendations based on any combination of fields.

### Key Capabilities

- **Schema‑driven fields**: Define a JSON schema for each category of data (personal, financial, behavioral, events). Use validation to enforce types and ranges.
- **Version control**: Automatically create a new profile snapshot whenever any field is added or updated. Maintain an audit trail.
- **Event timeline**: Allow users or advisors to insert major life events (marriage, job change, health shock, inheritance) with dates and optional metadata.
- **Data orchestration**: Expose an API for other modules to subscribe to profile changes and recalculate PVs, cash‑flow projections and risk scores in real time.

---

## 📚 Profile Components (Prose + Point Form)

**1. Personal Information**
- Fields: full name, birth date, gender, marital status, dependents count and ages, education level, residential status.
- Use cases: age for lifecycle mapping; marital status and dependents for expense modeling; education and literacy as proxies for financial sophistication.

**2. Financial Streams**
- Income: salary, bonuses, business revenue, rental, dividends, pension, irregular windfalls.
- Assets & Liabilities: deposit accounts, investments, real estate, mortgages, credit lines, loans, credit cards.
- Integration: feed each stream into PV calculators, emergency fund calculators, debt amortization schedules and allocation engines.

**3. Behavioral & Risk Profile**
- Multi‑step questionnaire aligned with CFA guidelines: tolerance, capacity, objectives.
- Store raw answers and compute normalized scores on the fly.
- Tie responses to event triggers and dynamic nudges (e.g., revisit risk profile after a major shock).

**4. Life Events Timeline**
- Users can add or select predefined events: marriage, children, home purchase, divorce, career change, illness, retirement.
- Each event can carry quantitative impacts: income change, expense shift, tax bracket adjustments.
- Timeline drives scenario analysis and “what‑if” projections.

**5. Progressive Versioning & Audit**
- Every profile update (manual or system‑driven) creates a new version.
- Users or QA can roll back to any previous snapshot if errors are found.
- Exportable change log with timestamps, user IDs and field deltas.

**6. Wealth Lifecycle Visualization**
- A dedicated screen (or tab) displays a lifetime graph: net worth over age, income vs expenses vs savings rate.
- Overlay phases: Accumulation (rising net worth), Transition (plateau), Distribution (drawdown).
- Interactive: hover for details, zoom on specific decades.

---

## 🛠 Implementation Checklist

1. **Scaffold Core Module**
   - Define JSON schemas for each profile category.
   - Build Context/Store to hold current profile object + version history.
   - Implement validation and default values.

2. **Personal Data Forms**
   - Create form components for each field group.
   - Wire updates to versioned store.
   - Add inline validation and autosave on blur.

3. **Financial Streams Integration**
   - Build inputs for each stream type with date ranges and amounts.
   - Hook into PV and projection utilities.
   - Ensure real‑time recalculations in linked modules.

4. **Risk & Behavioral Engine**
   - Develop wizard UI for questionnaire.
   - Compute normalized scores; store both answers and scores.
   - Expose event triggers based on answers (e.g., low capacity → suggest debt reduction).

5. **Event Timeline**
   - Implement a dynamic timeline UI with drag/drop events.
   - Link each event to quantitative effects on cash flows.

6. **Versioning & Audit Trail**
   - Auto‑version on every store change.
   - Build audit viewer component.
   - Add ability to revert to prior version.

7. **Visualization**
   - Create the Wealth Lifecycle graph using a chart library.
   - Integrate interactive timeline controls.

8. **Testing & QA**
   - Unit tests for schema validation, versioning, score computation.
   - Integration tests for data flow across Profile → Income/Expenses/Goals.
   - UI acceptance: form navigation, autosave, timeline interactions, graph rendering.

---

## 🧪 QA Test Plan

- Validate schema enforcement (missing fields, type mismatches).
- Confirm version history accuracy and revert functionality.
- Test cash flow recalculations after manual profile edits and events.
- Verify risk score updates and behavioral triggers under multiple scenarios.
- Ensure wealth graph updates accurately as profile data changes.
- Cross‑module tests: Income tab reflects salary edits; Expenses tab picks up new dependents; Goals tab recalculates education cost.

## ⏳ Phased Implementation & Check‑Ins

### Phase 1: Foundation & Core Data Store (2 weeks)
- **Week 1:**
  - Scaffold JSON schemas and context/store architecture.
  - Implement version history mechanism (events storage).
  - Check‑in: Review schema definitions and store setup; conduct schema validation demo.
- **Week 2:**
  - Build personal data form components; wire auto‑version on blur.
  - Conduct validation: missing/invalid field scenarios.
  - Check‑in: Demo personal info form flow; QA review of autosave and version snapshots.

### Phase 2: Financial Streams & PV Integration (3 weeks)
- **Week 3:**
  - Create inputs for income streams with date ranges; integrate PV utilities.
  - Unit tests: PV calculations for salary, bonus, rental.
  - Check‑in: PV utility test results and code review.
- **Week 4:**
  - Develop assets/liabilities registry; link to balance sheet and net‑worth computation.
  - Integration test: balance sheet sync with registry updates.
  - Check‑in: Live demo of balance sheet updates; integration test pass status.
- **Week 5:**
  - Hook financial streams to cash‑flow projections and emergency buffer.
  - Cross‑module test: Income → Expenses tabs reflect cash‑flow changes.
  - Check‑in: Screenshot QA of projections and cash‑flow reconciliation.

### Phase 3: Risk & Behavioral Engine (2 weeks)
- **Week 6:**
  - Implement multi‑step risk questionnaire wizard UI and store raw answers.
  - Unit tests: survey normalization logic edge cases.
  - Check‑in: Show questionnaire flow and scoring demo; test coverage report.
- **Week 7:**
  - Tie risk outputs to advisory triggers and UI alerts.
  - Integration test: event-driven re‑evaluation of risk after profile or market shocks.
  - Check‑in: QA session simulating shock scenarios and trigger alerts.

### Phase 4: Timeline Events & Vis Tools (3 weeks)
- **Week 8:**
  - Build life‑events timeline component with drag‑and‑drop and metadata.
  - Unit tests: event creation, editing, and impact calculations.
  - Check‑in: Workflow demo of adding events and verifying data store.
- **Week 9:**
  - Develop wealth lifecycle graph; integrate timeline interactions.
  - Automated UI tests: graph rendering under multiple data sets.
  - Check‑in: Visual QA and performance benchmarking.
- **Week 10:**
  - Snapshot carousel: implement historical snapshot viewer and rollback UI.
  - QA test: revert to prior snapshot and verify state consistency.
  - Check‑in: Snapshot demo and QA sign‑off on rollback.

### Phase 5: Final Integration & Release Prep (2 weeks)
- **Week 11:**
  - Full end‑to‑end testing: onboarding flow through all modules.
  - Penetration test: data compliance (POPIA/GDPR).
  - Check‑in: E2E test report and security compliance review.
- **Week 12:**
  - Bug fixes, performance optimizations, documentation finalization.
  - Developer walkthrough and handoff session.
  - Check‑in: Handoff demo; sign‑off from product and engineering leads.

*Each phase concludes with a formal check‑in presentation, demo, and test report to ensure alignment and quality before proceeding.*
