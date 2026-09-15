# UI Design Prompt & Reference Design Specification

**Platform:** `chatbot-agent` (Helio / Chatly AI Agent SaaS)  
**Classification:** Official Product Design Specification  
**Version:** 1.0.0  
**Approval Status:** **APPROVED & FINALIZED (DEC-007 Satisfied)**  

---

## 1. Design Direction & Aesthetic Vision

The visual interface for the `chatbot-agent` platform adheres to an **Apple-inspired minimalist design system**:
- **Philosophy:** Content-first clarity, ultra-crisp micro-interactions, subtle glassmorphism, dynamic spring animations, and high contrast without visual clutter.
- **Lighting & Depth:** Soft ambient light with multi-layered subtle shadows (`shadow-2xs`, `shadow-xs`, `shadow-sm`), transparent frosted borders (`border-slate-200/80` or `border-slate-200/90`), and backdrop blurring (`backdrop-blur-md bg-white/80`).
- **Interaction Model:** Interactive elements feature smooth scale and press feedback (`active:scale-[0.98]`, `transition-all duration-200`), state transitions with count-up animations for telemetry numbers, and live pulse indicators for active system status.

---

## 2. Design Tokens & Color Palette

### 2.1. Color System
| Role | Token / Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `#2563eb` / `#4f46e5` | `bg-blue-600` / `bg-indigo-600` | Primary actions, key badges, selected tabs, focus rings |
| **Brand Surface** | `#eff6ff` / `#eef2ff` | `bg-blue-50` / `bg-indigo-50` | Active navigation highlights, subtle pill backgrounds |
| **Success / Active** | `#10b981` (Emerald) | `text-emerald-600 bg-emerald-50` | Active bot status, operational health, high lead scores |
| **Warning / Attention** | `#f59e0b` (Amber) | `text-amber-600 bg-amber-50` | Unsaved changes, degraded status, unverified domains |
| **Danger / Critical** | `#f43f5e` (Rose) | `text-rose-600 bg-rose-50` | Deletion modals, system errors, lost leads |
| **Neutral Surface (Page)** | `#f8fafc` | `bg-slate-50` | Global page background |
| **Neutral Card Surface** | `#ffffff` | `bg-white` | Content cards, data tables, modals, input containers |
| **Neutral Dark (Sidebar)** | `#0f172a` | `bg-[#0f172a]` / `bg-slate-900` | Super admin sidebar, code blocks, high-contrast dark accents |
| **Text Primary** | `#0f172a` | `text-slate-900` | Page headers, metrics values, card titles |
| **Text Secondary** | `#64748b` | `text-slate-500` | Subheadings, timestamps, helper labels, table headers |
| **Text Muted** | `#94a3b8` | `text-slate-400` | Inactive icons, placeholder text, breadcrumbs |

### 2.2. Geometry & Corner Radii
- **Modals & Flyouts:** `rounded-3xl` (24px) or `rounded-2xl` (16px) with `shadow-2xl`
- **Cards & Data Tables:** `rounded-2xl` (16px) with `border border-slate-200/90 shadow-2xs`
- **Buttons & Form Inputs:** `rounded-xl` (12px) with `px-4 py-2 text-sm font-medium`
- **Pills, Badges & Avatars:** `rounded-full`

### 2.3. Typography Scale
- **Headings:**
  - `H1 (Page Titles)`: `text-2xl font-bold tracking-tight text-slate-900`
  - `H2 (Section Titles)`: `text-xl font-bold text-slate-900`
  - `H3 (Card Headings)`: `text-base font-semibold text-slate-900`
- **Body & Captions:**
  - `Body Regular`: `text-sm text-slate-600 leading-relaxed`
  - `Caption / Meta`: `text-xs text-slate-500 font-medium`
  - `Micro Tag`: `text-[11px] font-semibold tracking-wider`

---

## 3. Core Component Layout & Responsive Hierarchy

### 3.1. Operator App Shell (`src/components/layout/AppShell.tsx`)
- **Desktop (>= 1024px):** Fixed navigation sidebar (`w-64`), sticky top bar (`h-16`), fluid main content area with custom scrollbars.
- **Mobile (< 1024px):** Collapsible sheet drawer menu, bottom floating action button for widget preview, stacked tables and cards.

### 3.2. Appearance Studio (`src/components/appearance/AppearanceStudio.tsx`)
- Split-screen studio layout:
  - Left panel: Configuration controls (theme color picker, positioning, welcome message, launcher styles, avatar selector).
  - Right panel: Interactive real-time device preview (Desktop monitor frame & Mobile iPhone frame toggle with live simulated chat interaction).

### 3.3. Multi-Platform Deployment Hub (`src/components/deployment/DeploymentPage.tsx`)
- **Status Hero:** Real-time live status banner with animated pulse indicator and connection verification action.
- **Platform Selector Tabs:** JavaScript embed snippet, WordPress, Shopify, Webflow, and Squarespace tabs.
- **Code Injection Block:** High-contrast dark code block (`bg-slate-950 text-slate-200 font-mono`) with 1-click clipboard copy action and feedback toasts.

### 3.4. Super Admin Management Console (`src/app/admin/`)
- Dark navigation sidebar with quick switcher back to standard operator application.
- Operational telemetry dashboard with system error rate, revenue run rate, user management table, API key vault, and real-time infrastructure health monitoring.

---

## 4. UI/UX Verification Checklist (Green Gate)

- [x] High-contrast, clean Apple-like color scheme and typography.
- [x] Zero unstyled components or default browser controls.
- [x] Responsive layout tested across Mobile (390px), Tablet (768px), Laptop (1280px), and Desktop (1920px).
- [x] Fully functional dark code blocks with copy-to-clipboard functionality.
- [x] Interactive live preview sandbox rendering accurately for all appearance configurations.
- [x] All modals implement accessible backdrop blur, dismiss handling, and keyboard escape guards.
