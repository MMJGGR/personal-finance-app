# Persona Data

Earlier versions of the app shipped with multiple sample personas and a dropdown
for switching between them. The current build still includes **Hadi** by
default but you can now add your own personas from the sidebar. Use **Add
Persona** to launch the profile wizard and create a new entry. Each persona is
stored under unique keys such as `profile-{id}`. Delete a persona using the
**Delete Persona** buttons next to the list.

1. **Start the App**
   ```bash
   npm install
   npm run dev
   ```
2. **Work with the Data**
   All tabs load Hadi's information automatically. Any changes you make are
   stored in local storage. Use the **Reset to Defaults** button on the Profile
   tab to restore the bundled data.
3. **Managing Personas**
   Click **Add Persona** in the sidebar to start a fresh profile. Fill out the
   wizard steps and the new persona will be saved under `profile-{id}` and
   related keys. Remove any persona with the **Delete Persona** buttons.
4. **Exporting**
   When exporting JSON or CSV files, Hadi’s name is included in the filename
   (e.g. `income-data-Hadi_Alsawad.json`).
