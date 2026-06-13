# ACCESSIBILITY.md - WCAG 2.2 AA Compliance and Keyboard Focus Hardening Guide

**MealMind AI** is fully optimized for digital accessibility, implementing standards from the W3C WCAG 2.2 AA guidelines. 

---

## 1. Hardened Keyboard Focus Trapping (Modals)

During the Final Hardening Pass, we implemented robust focus-trapping routines for the following modal dialogs:
- **Help Guide Dialog** (`/src/components/HelpView.tsx`)
- **Action Testing Sandbox** (`/src/components/TestQAView.tsx`)

### Keyboard Navigation Blueprint:
1. **Focus Capture**: Selecting "Show Help Guide" or "Run Tests Sandbox" immediately opens the respective modal and transitions focus to the very first interactive control (e.g., the close button or execute button).
2. **Tab Trap Cycle**: Pressing the Tab key cycles focus exclusively through the modal's internal elements (Close, Action, Dismiss buttons).
   - *Forward Navigation (Tab)*: On the last interactive element, pressing `Tab` wraps focus back to the first interactive element.
   - *Backward Navigation (Shift + Tab)*: On the first interactive element, pressing `Shift + Tab` moves focus to the last interactive element.
3. **ESC Key Close**: Users can dismiss the active modal at any point by pressing the physical `Escape` key.
4. **Trigger Restoration**: When the dialog closes, focus is automatically restored back to the original element that triggered the modal (e.g., the Help Guide reference link or Sandbox execution trigger). This keeps the keyboard outline in place and prevents focus loss.

---

## 2. Accessible ARIA Dialog Structuring

Each modal uses a screen-reader optimized container format:
- `role="dialog"`: Declares to AT (Assistive Technology) that the container is an interactive pop-up.
- `aria-modal="true"`: Advises the system to ignore background page elements, preventing screen readers from reading background content.
- `aria-labelledby="[id_pointing_to_heading]"`: Associates the dialog container directly with its visible title (e.g. `help-modal-title` or `qa-modal-title`), reading it first upon focus entry.
- `aria-label`: Close buttons feature distinct semantic text overrides (e.g., `aria-label="Close help guide"`) instead of just reading the "X" text or icon.

---

## 3. General Native Semantics & Pointer Quality

- **Landmark Segments**: Layout structures are partitioned into `<header>`, `<main>`, `<section>`, and `<footer>` containers to help users skip block segments.
- **Header Nesting**: No headings levels are skipped. Heading structures scale cleanly from `<h1>` to `<h4>` to ensure a consistent page outline.
- **Physical Controls**: The application prioritizes standard, semantic HTML widgets (`<button>`, `<input>`, `<select>`) that feature native keyboard control and browser support.
- **Focus Rings**: Standard outline halos are replaced by visible, high-contrast, emerald focus halos (`focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none`) to help navigators with low vision.
- **Touch Safe Boundaries**: Touch buttons and form zones maintain minimum sizes of **44x44 pixels**, complying with WCAG 2.2 Criterion 2.5.8 on touch target sizes.

---

## 4. High-Contrast & Vision Support

- **Contrast Ratios**: Body text achieves color contrasts exceeding a **4.5:1 ratio** against backgrounds (relying on slate greys, pure white sheets, and deep charcoal emerald outlines).
- **Dual Visual Signaling**: Categorized statuses (e.g., "Within Budget", "Near Limit", "Over Budget") are designated using **both** descriptive textual labels and distinct visual colors. This ensures screen reader users and users with color vision deficiencies can interpret the statuses correctly.
- **Vestibular Motion Safety**: Route and element transitions rely on subtle fade-ins with custom light delays. Users utilizing low-motion operating systems are protected from extreme scrolling, scaling, or flashing patterns.
