# Orbit UI

Orbit is a futuristic, canvas-based visual file management system designed for a seamless and immersive digital organization experience. It moves away from traditional list-based file explorers in favor of a dynamic, interconnected node-based interface.

## 🚀 Key Features

- **Visual Canvas Interface**: Navigate your files and folders in a dynamic, draggable, and zoomable 2D space.
- **Node-Based File System**: Folders and files are represented as interactive nodes with visible relationships.
- **Multimedia Support**: 
    - High-performance image viewer with zoom/pan capabilities.
    - Integrated Video and Audio players.
    - Built-in PDF and Text/Code previewers.
- **Cloud Integration**: Native support for **Google Drive** and **Google Photos** integration.
- **Orbit System Design**:
    - **Custom Dialog System**: Branded replacement for native browser `alert`, `confirm`, and `prompt`.
    - **Toast Notification System**: Real-time feedback for user actions like uploads, renames, and deletions.
- **User Authentication**: Secure sign-in flow powered by **Supabase** and **Google OAuth**.
- **Futuristic Aesthetic**: A "Dark Terminal" design language featuring glass panels, monochrome palettes, and precision typography.

## 🛠️ Technology Stack

- **Framework**: Angular 21 (Standalone Components)
- **State Management**: RxJS & Angular Services
- **Backend/Auth**: Supabase
- **Cloud APIs**: Google Drive API, Google Photos API
- **Styling**: Vanilla CSS (Custom Orbit Design System)
- **Icons**: Custom SVG Library

## 📂 Project Structure

```text
src/app/
├── auth/               # Signin and Registration flows
├── canvas/             # Core visual workspace and logic
├── directory/          # Folder node components
├── header/             # Global navigation and breadcrumbs
├── model-data/         # File grid and preview management
├── services/           # Business logic (Files, Directories, Auth, etc.)
├── shared/             # Reusable UI components
│   ├── orbit-dialog/   # Custom modal system
│   ├── orbit-toast/    # Global notification stack
│   └── loader/         # Branded loading animations
```

## 🏗️ Getting Started

### Prerequisites
- Node.js (v18+)
- Angular CLI

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server
Run the project locally:
```bash
ng serve
```
Navigate to `http://localhost:4200/`.

### Build
Generate a production bundle:
```bash
ng build
```

## 🎨 Design Language

Orbit follows a strict "Visual OS" philosophy:
- **Background**: Deep slate grid (`#161f2c`).
- **Panels**: Dark glass effect (`#0a0f18` with transparency).
- **Accents**: Orbit Red (`#ef4444`) for destructive actions and pure white for highlights.
- **Typography**: IBM Plex Mono (or system monospace) for a technical, precise feel.
- **Interactions**: Hover-based bold underlines and smooth scale transitions.

---

*Built with passion for the next generation of file management.*
