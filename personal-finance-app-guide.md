# Persona Data

Earlier versions of the app shipped with multiple sample personas and a dropdown
for switching between them. The current build includes only the **Hadi** profile
and the dropdown has been removed.

1. **Start the App**
   ```bash
   npm install
   npm run dev
   ```
2. **Work with the Data**
   All tabs load Hadi's information automatically. Any changes you make are
   stored in local storage. Use the **Reset to Defaults** button on the Profile
   tab to restore the bundled data.
3. **Exporting**
   When exporting JSON or CSV files, Hadi’s name is included in the filename
   (e.g. `income-data-Hadi_Alsawad.json`).
