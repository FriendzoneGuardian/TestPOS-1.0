# Implementation Plan: Beta 1.3, 1.4 & 1.5 (Theming & RBAC)

## 1. Goal Description
Re-implement the core UI personalization and access control features from the legacy Flask version into the new Django framework. This includes role-based color palettes, the "Golden Ledger" accounting theme, and persistent user theme preferences (Dawn/Dusk/Midnight).

## 2. Proposed Changes

### Beta 1.3.1 — "Fifty Shades of Roles: Director's Cut" (Advanced Theming)
**Goal:** Implement the "puddles in the background" visual style from the original Flask version, enhanced with a role-based and time-based matrix.

- #### [MODIFY] `templates/base.html`
    - Inject `data-role="{{ user.role|default:'guest' }}"` into the root `<html>` tag alongside `data-theme`.
    - Add fixed, low-opacity blurred background `div`s (e.g., `blur-[120px] mix-blend-screen opacity-20`) to create the "puddle" ambient glowing effect.
    - These puddles will use new CSS CSS variables (e.g., `var(--bg-puddle-1)`).
- #### [MODIFY] `static/src/input.css` (or `base.html` `<style>`)
    - Move away from calculating `theme_vars` in Python (`core/context_processors.py`) to defining them declaratively in CSS using attribute selectors.
    - Define a matrix of colors based on `html[data-theme="..."][data-role="..."]`.
    - **Admin Palette:**
        - Dawn: Dark Green
        - Dusk/Midnight: Vibrant Green, Lime Green, Yellow Green
    - **Manager Palette:**
        - Dawn: Deep Navy/Indigo
        - Dusk/Midnight: Bright Cyan, Sky Blue, Electric Blue
    - **Cashier Palette:**
        - Dawn: Deep Magenta/Purple
        - Dusk/Midnight: Bright Coral, Pink, Amber
    - **Accounting Palette:**
        - Dawn: Dark Bronze/Brown
        - Dusk/Midnight: Bright Gold, Yellow, Amber
- #### [MODIFY] `core/context_processors.py`
    - Simplify to remove the Python-level HEX literal generation, delegating the logic cleanly to CSS rules.
- #### [MODIFY] `templates/base.html` (Dynamic Assets)
    - Apply role-based coloring to the DjangoShot logo and border elements.

### Beta 1.4 — "The Bean Counters" (RBAC & Accounting)
Formalize the 'accounting' role and restrict access accordingly.
- #### [NEW] `core/mixins.py`
    Create a `RoleRequiredMixin` to enforce role-based access control at the view level.
- #### [MODIFY] `core/context_processors.py`
    Add the "Golden Ledger" (Amber/Orange) palette logic for the `accounting` role.
- #### [MODIFY] `sales/views.py`
    Restrict the POS Terminal to the `cashier` and `admin` roles using `RoleRequiredMixin`.

### Beta 1.5 — "Mood Lighting" (Thematic Persistence)
Allow users to persist their visual preference across sessions.
- #### [MODIFY] `core/models.py`
    Add a `theme_preference` field (choices: `dawn`, `dusk`, `midnight`) to the `User` model.
- #### [NEW] `core/views.py`
    Add a `update_theme` view to handle theme toggling via AJAX/POST.
- #### [MODIFY] `templates/base.html`
    Inject `data-theme="{{ user.theme_preference }}"` into the `<html>` tag and update the settings modal.
- **QA Integration**: Perform the "First Selenium QA Audit" to verify theme persistence and regression test against historical CVEs.

## 3. Future Roadmap: Alpha 2.1 — "The Concrete Hardening"
Post-Beta 1.9, the project will pivot to **Alpha 2.1** to implement advanced business logic from the concrete plan:
- **Finance**: COGS calculation and 3-tier aging categories.
- **Credit**: Strict ₱1,500 enforcement and payroll deduction cycles.
- **Accountability**: Cash session opening/closing with variance auditing.
- **Isolation**: Hardened `store_id` filtering for multi-branch scalability.

## 3. Verification Plan

### Automated Tests
- `python manage.py test core.tests`: Verify that roles are correctly assigned and stored.
- Test view access: Ensure `accounting` role cannot access `/pos/terminal/`.

### Manual Verification
1. **Role Colors**: Log in as different roles (Admin, Manager, Cashier, Accountant) and verify the primary color changes.
2. **Theme Toggle**: Change the theme in the user settings and verify it persists after a page refresh.
3. **Route Protection**: Attempt to access the POS terminal as an Accountant and verify a 403 Forbidden or redirect occurs.
