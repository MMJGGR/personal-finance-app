````markdown
# Task 1: Profile & Risk Engine Implementation (Enhanced)

**Objective:** Build a production-grade KYC flow in `ProfileTab.jsx` with CFA-aligned risk scoring, audit logging, field validation, seed-data integration, and future extensibility. Below is a **Status Matrix** followed by detailed implementation steps.

---

## Status Overview

- **Seed Data Integration**
  - *Current:* Form fields not pre-populated from Hadi seed.
  - *Desired:* Load `hadiSeed.json` into context and pre-populate form inputs.
  - *Expected Outcome:* Form fields display seed values on initial render.

- **KYC Inputs**
  - *Current:* `FIXME` placeholders remain; key inputs missing.
  - *Desired:* Render all required inputs in Personal, Contact, Address, and Tax & Employment sections.
  - *Expected Outcome:* User sees and can edit all KYC fields.

- **Layout & UX**
  - *Current:* Single-column layout; no risk summary.
  - *Desired:* Two-column grid with form on left and live Risk Summary on right.
  - *Expected Outcome:* Risk Summary updates reactively; form visually balanced.

- **Scoring Logic**
  - *Current:* Placeholder logic only.
  - *Desired:* Implement CFA weights & thresholds via `riskConfig.js`; calculate 0–100 score and category.
  - *Expected Outcome:* Scores and categories reflect CFA standards and are configurable.

- **Audit Logging**
  - *Current:* Basic record API without metadata.
  - *Desired:* Record field, old/new values, userId, timestamp; flush to `localStorage`.
  - *Expected Outcome:* Full audit trail persisted locally; reviewable in logs.

- **Validation & Error Handling**
  - *Current:* Minimal or no validation.
  - *Desired:* Enforce Zod schema in `validation/profileSchema.js`; show inline errors; disable Save when invalid.
  - *Expected Outcome:* Form enforces data integrity; blocks invalid saves.

- **Tests & Coverage**
  - *Current:* Tests exist but coverage and key flows unverified.
  - *Desired:* Add RTL and unit tests for form population, scoring, audit calls, validation; target ≥90% coverage.
  - *Expected Outcome:* Reliable regression safety; key logic and UI flows validated.

### 1. Seed Data Integration
- In `FinanceContext.jsx`, import and set `seedData.profile` as initial state.
- On mount (`useEffect`), call `setProfile(initialProfile)` to pre-populate.
- Ensure no mutations of the JSON seed file; all updates occur in component state.

### 2. UI Integration in `ProfileTab.jsx`
- Remove all `FIXME` placeholders; render inputs for:
  - **Personal:** `firstName`, `lastName`, `birthDate` (date picker)
  - **Contact:** `email`, `phone`
  - **Address:** `street`, `city`, `country`
  - **Tax & Employment:** `taxCountry`, `taxId`, `employmentStatus`, `employerName`
- Use a two-column `<Grid>` layout: left for form, right for `<RiskSummary>` component.
- Wrap inputs in `<FormControl>` with `<FormLabel>`, `<Input>`/`<Select>`, `<FormHelperText>`, and `<FormErrorMessage>`.

### 3. CFA-Aligned Scoring Logic

**Goal:** Implement a robust, transparent risk-scoring system based on CFA best practices, with clear factor weights, normalization methods, and threshold categories that can be tweaked by admins.

### 3.1 Configuration via `config/riskConfig.js`
```js
// weights sum to 1.0
export const riskWeights = {
  age:             0.15,
  annualIncome:    0.20,
  netWorth:        0.20,
  investingExperience: 0.15,
  employmentStatus:    0.10,
  liquidityNeeds:      0.10,
  riskToleranceSurvey: 0.10,
};

// thresholds define category cutoffs
export const riskThresholds = {
  conservative: { max: 30 },
  balanced:    { min: 31, max: 70 },
  growth:      { min: 71 }
};
````

### 3.2 Factor Functions in `utils/riskUtils.js`

```js
import { riskWeights, riskThresholds } from '../config/riskConfig';

// Normalize each raw input to a 0–100 scale
function normalizeAge(birthDate) {
  const age = calculateAge(birthDate);
  return Math.max(0, Math.min((age / 100) * 100, 100));
}
function normalizeIncome(annualIncome) {
  // Assume 0–1,000,000 KES range; clamp and scale
  return Math.max(0, Math.min((annualIncome / 1_000_000) * 100, 100));
}
function normalizeNetWorth(netWorth) {
  // 0–5,000,000 KES
  return Math.max(0, Math.min((netWorth / 5_000_000) * 100, 100));
}
function normalizeExperience(years) {
  // 0–30 years
  return Math.max(0, Math.min((years / 30) * 100, 100));
}
function normalizeEmployment(status) {
  const mapping = { Retired: 0, Student: 20, 'Self-Employed': 50, Employed: 100 };
  return mapping[status] ?? 50;
}
function normalizeLiquidity(needs) {
  // e.g., months until next income or emergency fund coverage; scale 0–12 months
  return Math.max(0, Math.min((needs / 12) * 100, 100));
}
function normalizeSurveyScore(rawScore) {
  // rawScore from a 10-question survey, 1–5 each => total 10–50
  return Math.max(0, Math.min(((rawScore - 10) / 40) * 100, 100));
}

// Main calculation
export function calculateRiskScore(profile) {
  const scores = {
    age:                 normalizeAge(profile.birthDate) * riskWeights.age,
    annualIncome:        normalizeIncome(profile.annualIncome) * riskWeights.annualIncome,
    netWorth:            normalizeNetWorth(profile.netWorth) * riskWeights.netWorth,
    investingExperience: normalizeExperience(profile.yearsInvesting) * riskWeights.investingExperience,
    employmentStatus:    normalizeEmployment(profile.employmentStatus) * riskWeights.employmentStatus,
    liquidityNeeds:      normalizeLiquidity(profile.emergencyFundMonths) * riskWeights.liquidityNeeds,
    riskToleranceSurvey: normalizeSurveyScore(profile.surveyScore) * riskWeights.riskToleranceSurvey,
  };
  // Sum weighted scores, ensure 0–100
  const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
  return Math.round(Math.max(0, Math.min(total, 100)));
}

export function deriveCategory(score) {
  if (score <= riskThresholds.conservative.max) return 'conservative';
  if (score <= riskThresholds.balanced.max) return 'balanced';
  return 'growth';
}
```

### 3.3 Integration in `ProfileTab.jsx`

```jsx
import { calculateRiskScore, deriveCategory } from '@/utils/riskUtils';

const [riskScore, setRiskScore] = useState(0);
const [riskCategory, setRiskCategory] = useState('balanced');

// Recalculate whenever relevant profile fields change
useEffect(() => {
  const score = calculateRiskScore(profile);
  setRiskScore(score);
  setRiskCategory(deriveCategory(score));
}, [
  profile.birthDate,
  profile.annualIncome,
  profile.netWorth,
  profile.yearsInvesting,
  profile.employmentStatus,
  profile.emergencyFundMonths,
  profile.surveyScore,
]);
```

---

### 4. Audit Logging & Persistence

Audit Logging & Persistence

* Extend `auditLog.record` to accept `(field, oldValue, newValue, userId, timestamp)`.
* In `handleChange`, wrap state update with `auditLog.record` call.
* On component unmount or periodically, call `auditLog.flush()` to save to `localStorage` under a `profile-audit` key.

### 5. Validation & Error Handling

* Define `profileSchema` in `validation/profileSchema.js` using Zod:

  ```js
  export const profileSchema = z.object({ /* field rules */ });
  ```
* In `ProfileTab.jsx`, on blur or before save, run `profileSchema.parse(profile)`.
* Populate an `errors` state and display via `<FormErrorMessage>`.
* Disable the Save button until `errors` is empty.

### 6. Testing

* **Form Tests:** In `__tests__/ProfileTab.test.jsx`, verify:

  1. Inputs are pre-populated with seed.
  2. Changing fields updates state and Risk Summary.
  3. Invalid inputs show error messages and block Save.
  4. `auditLog.record` is called with correct args.
* **Logic Tests:** In `__tests__/riskUtils.test.js`, assert:

  1. Known profiles yield expected scores.
  2. `deriveCategory` returns correct categories at boundaries.
* Ensure overall coverage ≥90% for these modules.

---

## Expected Outcomes

* **User Experience:** On loading Profile tab, users see their existing data and a live risk summary that updates as they edit. Invalid data is clearly flagged.
* **Maintainability:** All scoring parameters live in a config file for future admin adjustments, and form validation rules are centralized in a schema.
* **Auditability:** Every change is logged with full metadata and persisted, enabling compliance reviews.
* **Reliability:** Comprehensive tests guard against regressions, ensuring enterprise-grade stability.

```
```
