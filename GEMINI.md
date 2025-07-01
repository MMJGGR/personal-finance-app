## Action Plan to Stabilize and Harden the Codebase

### 1. **Modularize Context and State Management**

* Break `FinanceContext` into focused providers (e.g., `ProfileContext`, `PersistenceContext`, `ChartDataContext`).
* Expose only necessary slices of state via custom hooks (e.g., `useProfile()`, `usePersistence()`).
* Ensure each provider has its own responsibility and clear boundaries.

### 2. **Guard and Optimize `useEffect` Hooks**

* Add value checks before calling state setters (e.g., `if (newValue !== prevValue) setValue(newValue)`).
* Narrow dependency arrays to primitives or stable references; use `useMemo` or `useCallback` for computed objects/functions.
* Consolidate related effects when possible to reduce cross-triggering.

### 3. **Implement Robust Persistence Flow**

* Debounce or batch state-to-`localStorage` writes to avoid thrashing.
* On app mount, perform a single “hydrate” step and pause sync effects until initial load completes.
* Encapsulate persistence logic in its own module with clear load/save APIs.

### 4. **Separate Business Logic from Presentation**

* Move financial calculations (PV, amortization, risk scoring) into pure utility functions or service classes.
* Consume these utilities in components or hooks; avoid inline calculations in JSX.
* Write unit tests for each utility function to guarantee correctness.

### 5. **Add Memoization for Derived Data**

* Use `useMemo` to cache heavy transforms (e.g., chart series, lifetime-value arrays).
* Use `useCallback` for event handlers passed to child components to prevent unnecessary re-renders.

### 6. **Ensure Proper Cleanup of Side Effects**

* Return cleanup functions in all `useEffect`s that subscribe to events or set up listeners.
* Unsubscribe from any pub-sub channels or window/global event listeners on unmount.

### 7. **Layered Error Handling and Boundaries**

* Introduce a global `ErrorBoundary` component around the main app to catch render errors.
* Wrap async calls (e.g., localStorage, fetch) in `try/catch` blocks and display fallback UI/messages.

### 8. **Streamline State Initialization**

* Centralize default values in a single configuration file or constants module.
* Hydrate state in a controlled sequence: defaults → seed file → persisted state → migrations.
* Log or warn when conflicting sources are detected during initialization.

### 9. **Refactor Large Components**

* Split each tab into smaller subcomponents (e.g., `ExpenseList`, `ExpensePVChart`, `ExpenseControls`).
* Adopt a container/presentational component pattern to separate stateful logic from markup.

### 10. **Introduce Automated Testing**

* Set up unit tests for utility functions and React hooks using Jest and React Testing Library.
* Write integration tests for key user flows (e.g., adding an expense, editing settings).
* Integrate tests into CI to prevent regressions.

### 11. **Adopt Type Safety or Prop Validation**

* Migrate gradually to TypeScript or add `PropTypes` to critical components.
* Define interfaces/types for context state and component props to catch mismatches early.

### 12. **Improve Accessibility & Responsiveness**

* Audit UI with a tool like axe-core; add missing ARIA labels and keyboard support.
* Test across breakpoints, ensuring charts and panels resize or collapse gracefully.

---

*By following this action plan, the codebase will be more maintainable, performant, and robust, enabling safer refactoring and accelerated feature development.*
