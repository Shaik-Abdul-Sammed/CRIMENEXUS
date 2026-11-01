# CRIMENEXUS: Figma Design Token System & Handoff Guide

## 1. Overview
This document guides design teams on importing the official CRIMENEXUS Design Tokens into Figma using the **Tokens Studio for Figma** plugin (formerly Figma Tokens). The token schema in [`design/figma-tokens.json`](../design/figma-tokens.json) provides a single source of truth connecting our production Tailwind CSS codebase with high-fidelity Figma components.

---

## 2. Token Architecture

The design token system follows the W3C Design Tokens Community Group specification:

```
design/
└── figma-tokens.json
    ├── color
    │   ├── bg-primary       (#0A1929 - State Command Navy)
    │   ├── bg-secondary     (#112240 - Elevation Surface)
    │   ├── bg-tertiary      (#1E293B - Interactive Surface)
    │   ├── accent-emerald   (#10B981 - Verified Inlier)
    │   ├── accent-crimson   (#DC2626 - Red Notice Fugitive)
    │   ├── accent-amber     (#F59E0B - Remand Warning)
    │   ├── accent-indigo    (#6366F1 - Deep AI / Graph Engine)
    │   └── accent-cyan      (#06B6D4 - ANPR / Transit Path)
    ├── typography
    │   ├── font-family (Inter / JetBrains Mono)
    │   └── font-size   (size-xs to size-3xl)
    ├── spacing         (space-1 to space-12)
    ├── borderRadius    (sm: 4px to xl: 16px)
    └── boxShadow       (glass, glass-elevated, glow-emerald, glow-crimson)
```

---

## 3. Step-by-Step Figma Import Instructions

### Step 1: Install Tokens Studio
1. In Figma, navigate to **Plugins** $\rightarrow$ Search for **Tokens Studio for Figma**.
2. Run the plugin.

### Step 2: Load `figma-tokens.json`
1. Inside the Tokens Studio plugin panel, click on **Settings** $\rightarrow$ **Token Storage**.
2. Select **Add new credentials** $\rightarrow$ Choose **Local File** (or connect directly via GitHub sync using repository `Shaik-Abdul-Sammed/CRIMENEXUS` and path `design/figma-tokens.json`).
3. If importing locally: click **Load from File/URL** and upload `design/figma-tokens.json`.

### Step 3: Apply to Figma Styles
1. In the plugin footer, click **Styles & Variables** $\rightarrow$ **Create Styles and Variables**.
2. Select all token sets: `global`.
3. Click **Create Styles**. Figma will automatically generate:
   - Color styles (`bg-primary`, `accent-crimson`, etc.)
   - Text styles (`size-xs` to `size-3xl` with standard line heights)
   - Effect styles (`shadow-glass`, `glow-crimson`)

---

## 4. Component Mapping Reference

| React / Tailwind Component | Figma Component Master | Active Tokens |
| :--- | :--- | :--- |
| `Card` (`bg-card/backdrop-blur-md`) | `Containers/GlassCard` | `bg-secondary` (80% opacity), `border-subtle`, `shadow-glass`, `radius-lg` |
| `Button` (`variant="primary"`) | `Inputs/Button/Primary` | `accent-indigo`, `text-primary`, `radius-md`, `font-semibold` |
| `Button` (`variant="destructive"`) | `Inputs/Button/Danger` | `accent-crimson`, `glow-crimson`, `text-primary` |
| `Badge` (`variant="destructive"`) | `Feedback/Badge/RedNotice` | `accent-crimson/20`, border `accent-crimson/40`, text `accent-crimson` |
| `Badge` (`variant="success"`) | `Feedback/Badge/Verified` | `accent-emerald/20`, border `accent-emerald/40`, text `accent-emerald` |
| `Input` (`font-mono text-xs`) | `Inputs/TextField` | `bg-primary`, `border-subtle`, focus `border-focus`, `font-mono` |
| `Modal` (`role="dialog"`) | `Overlays/ModalDialog` | `bg-secondary`, `shadow-glass-elevated`, `radius-xl` |

---

## 5. Living Design System
A live interactive showcase of all components and tokens is available in the running application at:
`http://localhost:5173/design-system`
