# Orbit: A Futuristic Spatial File Management System

Orbit is a high-performance, canvas-based visual file explorer that reimagines traditional hierarchical file management as a dynamic, interconnected spatial experience. Built with **Angular 21** and **Supabase**, it replaces the standard list-and-grid paradigm with an infinite 2D workspace where files and folders exist as interactive nodes.

---

## 🏛️ Architectural Overview

Orbit is designed as a **Spatial Operating System (SOS)** interface. Unlike traditional explorers that hide context behind navigation, Orbit maintains spatial relationships between folders, allowing users to build a mental map of their data.

### 1. The Core Workspace (The Canvas)
The heart of the application is the `CanvasComponent`. It manages an infinite coordinate system where:
- **Spatial Memory**: Folders are placed at specific `(X, Y)` coordinates.
- **Visual Links**: Dynamic SVG edges (`EdgeComponent`) connect parent folders to their children, visualizing the tree structure.
- **Infinite Navigation**: Users can drag the entire workspace or "panning" to specific areas.
- **Home Navigation**: A specialized "Home" feature that provides a smooth, slow-motion redirection (1.5s easing) to the center of the root directory.

### 2. The Data Layer (Node-Based Storage)
Every element in Orbit is a "Node". 
- **Local Nodes**: Stored in a custom PostgreSQL schema via Supabase, containing metadata like coordinates, parent IDs, and ownership.
- **Virtual Nodes**: Specialized nodes that bridge external cloud storage (Google Drive/Photos) into the Orbit spatial map.

---

## 🌟 Comprehensive Feature Set

### 📁 Folder & Directory Management
- **Spatial Positioning**: Drag-and-drop folders to organize them visually. Coordinates are persisted to the database in real-time.
- **Recursive Expansion**: Click a folder to expand its children. Orbit automatically manages visibility states to keep the canvas clean.
- **Breadcrumb Navigation**: A top-level breadcrumb system allows for quick jumps while keeping the spatial context in sync.
- **CRUD Operations**: Dedicated modal systems for creating, renaming, and deleting folders with built-in validation.

### 📄 Integrated File Ecosystem
Orbit features a robust file management system (`FileService`) that supports:
- **Multi-Format Previews**: A unified `FileViewer` that handles:
  - **Images**: High-performance viewer with smooth zoom and panning.
  - **Videos**: Integrated HTML5 player.
  - **Audio**: Custom-styled audio player with "rotating disc" animations.
  - **PDFs**: Full-frame document viewer.
  - **Text/Code**: Syntax-aware text viewer with line numbers.
- **Cloud Sourcing**: Seamlessly view and interact with files from **Google Drive** and **Google Photos** within the same spatial interface.

### 🔐 Security & Identity
- **Supabase Auth**: Secure authentication flow utilizing Google OAuth and traditional sessions.
- **Auth Guarding**: Protected routes (`/canvas`, `/profile`) ensure that user data and spatial maps are only accessible to authorized owners.
- **Provider Syncing**: Secure handling of external provider tokens (Google) for cloud integration.

### 🎨 The Orbit Design System
Orbit uses a custom-built UI framework defined in `src/app/shared/`:
- **Orbit Dialogs**: A non-blocking, branded modal system replacing native browser prompts.
- **Orbit Toasts**: A notification stack for real-time operation feedback.
- **Global Loader**: A high-fidelity loading interceptor that tracks API states and provides visual feedback during long-running tasks.
- **Futuristic HUD**: The UI uses a "Heads-Up Display" aesthetic—dark glass panels, monochrome typography (IBM Plex Mono), and subtle grid backgrounds.

---

## 🛠️ Technical Implementation

### Key Services
- **`DirectoryService`**: Manages the CRUD operations and coordinate synchronization for the spatial map.
- **`FileService`**: Handles file uploads to Supabase Storage and retrieval of signed URLs for previews.
- **`UserStateService`**: A centralized state management service for the currently authenticated user and their preferences.
- **`GoogleDrive/PhotosService`**: Specialized connectors for the Google Cloud Platform APIs.

### The UI Logic
- **`update()` Loop**: The canvas uses a precision transform loop that updates the `canvas-content`, `edges-group`, and `grid-background` in parallel to maintain performance.
- **`isPanningToHome` State**: A specialized state flag that triggers CSS-optimized transitions for smooth "flight" across the canvas.

---

## 🚀 How It Works (Internal Flow)

1. **Authentication**: User signs in -> Token received -> `AuthGuard` allows entry to `/canvas`.
2. **Initialization**: `Canvas` component loads all directories owned by the user -> Coordinates are applied to the DOM -> SVG edges are calculated and rendered.
3. **Interaction**: 
   - Dragging the canvas updates the global `x, y` offsets.
   - Clicking a folder triggers `getFilesByNode()` -> The `ModelData` panel appears at a calculated anchor point.
4. **Synchronization**: Any movement (folder drag) or state change (rename) is immediately sent to the `DirectoryService` to ensure the "Spatial Map" is always up to date.

---

## 💎 Design Philosophy

> "Orbit isn't just a file explorer; it's a digital territory."

The project prioritizes **Visual Feedback** and **Low Friction**. Every action—from the slow-motion home redirection to the glass-blur overlays—is designed to make the user feel like they are operating a high-end, futuristic workstation rather than a simple web app.

---
*Document Version: 1.1.0*
*Developer: Prabhjot Singh*
*Orbit - Spatial File Management*
