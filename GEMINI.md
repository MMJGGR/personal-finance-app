````markdown
# Task 1: Profile & Risk Engine Implementation

**Objective:** Enable a complete, enterprise-grade KYC flow in `ProfileTab.jsx` with CFA-aligned risk scoring and audit logging. This task covers UI wiring, scoring logic, state persistence, and test coverage.

---

## 1. UI Wiring in `ProfileTab.jsx`

1. **Remove `FIXME` placeholders** for all KYC fields:
   - Name (`firstName`, `lastName`)
   - Email (`email`)
   - Phone (`phone`)
   - Address (`address`, `city`, `country`)
   - Tax Residence (`taxCountry`, `taxId`)
   - Employment Status (`employmentStatus`, `employerName`)

2. **Group fields** under headings: Personal, Contact, Tax & Employment, Risk

3. **Add a live Risk Summary card** beside the form:
   ```jsx
   <RiskSummary score={riskScore} category={riskCategory} />
````

4. **Insert helper text** under each field using `<FormHelperText />`, e.g.:

   ```jsx
   <FormControl>
     <FormLabel>Tax ID</FormLabel>
     <Input name="taxId" value={profile.taxId} onChange={handleChange} />
     <FormHelperText>We use this to calculate your tax obligations.</FormHelperText>
   </FormControl>
   ```

---

## 2. Scoring Logic in `riskScoreMap.js`

1. **Expand `riskScoreMap`** to a 2D structure:

   ```js
   export const riskScoreMap = {
     conservative: { min: 0, max: 30 },
     balanced:    { min: 31, max: 70 },
     growth:      { min: 71, max: 100 }
   };
   ```

2. **Implement `calculateRiskScore(profile)`** in `utils/riskUtils.js`:

   ```js
   export function calculateRiskScore({ age, income, netWorth, employmentStatus, ... }) {
     // Normalize inputs, apply weights per CFA guidelines
     let score = 0;
     score += ageWeight(age);
     score += incomeWeight(income);
     score += netWorthWeight(netWorth);
     score += employmentStatusWeight(employmentStatus);
     // ... add other axes
     return Math.min(Math.max(score, 0), 100);
   }

   function deriveCategory(score) {
     if (score <= 30) return 'conservative';
     if (score <= 70) return 'balanced';
     return 'growth';
   }
   ```

3. **In `ProfileTab.jsx`**, import and call:

   ```jsx
   const [riskScore, setRiskScore] = useState(0);
   const [riskCategory, setRiskCategory] = useState('balanced');

   useEffect(() => {
     const score = calculateRiskScore(profile);
     setRiskScore(score);
     setRiskCategory(deriveCategory(score));
   }, [profile]);
   ```

---

## 3. Audit Logging in `auditLog.js`

1. **Extend** `auditLog.record(field, oldValue, newValue)` to include timestamp and user ID.
2. **In `handleChange`** (in `ProfileTab.jsx`), wrap state updates:

   ```js
   function handleChange(e) {
     const { name, value } = e.target;
     auditLog.record(name, profile[name], value);
     setProfile({ ...profile, [name]: value });
   }
   ```
3. **Persist logs** to `localStorage` via `auditLog.flush()` on unmount or periodically.

---

## 4. Tests in `src/__tests__/ProfileTab.test.jsx`

1. **Render form** and assert all inputs exist:

   ```js
   render(<ProfileTab />);
   expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
   // ... repeat for all fields
   ```
2. **Simulate user input** and verify:

   ```js
   fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: '30' } });
   await waitFor(() => expect(screen.getByText(/Risk: Balanced/i)).toBeVisible());
   ```
3. **Audit log test**:

   ```js
   const logSpy = jest.spyOn(auditLog, 'record');
   fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
   expect(logSpy).toHaveBeenCalledWith('email', '', 'a@b.com');
   ```

---

## 5. Acceptance Criteria

* All KYC fields are visible, labeled, and validated (required fields show errors).
* `RiskSummary` updates in real-time based on profile changes.
* Every field change writes an entry to the audit log with correct details.
* All new logic is covered by unit/RTL tests with ≥ 80% coverage on `ProfileTab.jsx`.

```
```
