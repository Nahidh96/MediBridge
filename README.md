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
