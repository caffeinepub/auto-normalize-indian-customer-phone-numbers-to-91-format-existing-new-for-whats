# Specification

## Summary
**Goal:** Deploy a new build of the current application state and verify key UI elements post-deployment.

**Planned changes:**
- Produce a new deployment/build from the current codebase without adding or changing features.
- Post-deployment verification: confirm the AMC tab is visible for authenticated users and the AMC screen renders.
- Post-deployment verification: confirm currency amounts display consistently with the ₹ symbol across the UI (including dashboards and analytics views).

**User-visible outcome:** The latest build is accessible via the standard preview/live URL, authenticated users can see and open the AMC tab without errors, and currency values display with the ₹ symbol consistently.
