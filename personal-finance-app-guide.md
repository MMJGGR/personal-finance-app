# Persona Switching Guide

This app now supports multiple sample personas bundled under `src/data/personas.json`.
A dropdown in the sidebar lets you pick which persona to work with.

1. **Start the App**
   ```bash
   npm install
   npm run dev
   ```
2. **Select a Persona**
   Use the *Persona* dropdown above the navigation tabs. Choosing a different
   persona clears local storage and loads the selected profile, income sources
   and other data.
3. **Work with the Data**
   All tabs reflect the chosen persona. Changes you make are persisted to local
   storage while that persona is active.
4. **Exporting**
   When exporting JSON or CSV files, the persona’s name is included in the
   filename (e.g. `income-data-Hadi_Mwangi.json`).

Switching personas at any time will repopulate local storage with the new
persona’s dataset.
