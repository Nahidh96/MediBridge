<h3 align="center">
  <img src="https://img.shields.io/badge/Project-MediBridge-blue?style=for-the-badge&logo=medrt&logoColor=white" />
  <img src="https://img.shields.io/badge/Focus-Digital%20Healthcare-green?style=for-the-badge&logo=heartbeat&logoColor=white" />
  <img src="https://img.shields.io/badge/Platform-Open%20Source-orange?style=for-the-badge&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/Built%20For-Doctors%20%26%20Clinics-red?style=for-the-badge&logo=stethoscope&logoColor=white" />
  <img src="https://img.shields.io/badge/Priority-Privacy%20%26%20Security-purple?style=for-the-badge&logo=shield&logoColor=white" />
</h3>

# MediBridge Desktop

Offline-first practice management app tailored for Sri Lankan doctors. Built with Electron, React, Vite, Mantine UI, and a local SQLite database for secure data storage without internet requirements.

## ✨ Features
- Guided onboarding wizard that enables only the modules a doctor needs
- Secure offline database using SQLite (via sql.js with on-disk persistence)
- Appointment scheduling, patient records, prescriptions, billing, inventory, analytics, and collaboration modules
- React Query powered data layer with optimistic mutations and caching
- Mantine UI components for an accessible, customizable interface

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or later (ships with npm)

### Install dependencies
```powershell
npm install
```

### Run the app in development
Starts Vite for the renderer and Electron for the main process.
```powershell
npm run dev
```

### Type checking and linting
```powershell
npm run typecheck
npm run lint
```

### Production build
```powershell
npm run build
```
Build artifacts are written to `dist/` (renderer) and `dist-electron/` (main and preload scripts).

## 🧱 Project Structure
- `electron/` – main process, preload bridge, and SQLite-backed persistence
- `src/` – React renderer (routes, features, hooks, stores)
- `shared/` – Reusable TypeScript types shared between main and renderer

## 🗂️ Configuration
- `vite.config.ts` – shared Vite config with Electron plugin
- `tsconfig*.json` – TypeScript configuration with shared path aliases
- `.eslintrc.cjs` / `.prettierrc` – Formatting and linting rules

## 🧪 Next Steps
- Wire automated tests for IPC handlers and React components
- Implement real data persistence workflows per module requirements
- Add packaging scripts (e.g., `electron-builder`) for distributable installers

## 📄 License
MIT © MediBridge Team
