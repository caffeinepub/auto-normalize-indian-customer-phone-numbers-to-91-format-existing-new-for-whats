# Specification

## Summary
**Goal:** Restrict payment methods across the app to only UPI and Cash by removing Bank Transfer, Online, Cheque, and Other from backend types/APIs, stored data, and all frontend UI.

**Planned changes:**
- Update backend Motoko payment method types and any related APIs to support only UPI and Cash.
- Update backend revenue/payment breakdown types and computations to return only UPI and Cash totals.
- Add an upgrade-time state migration to convert any persisted records using removed payment methods into a supported method (UPI or Cash).
- Update the Revenue section payment methods UI to show only UPI and Cash.
- Update any other frontend payment method selectors/displays (including AMC-related forms) to offer only UPI and Cash and send only supported values.
- Update frontend React Query hooks and TypeScript types to match the new payment breakdown response shape (UPI + Cash only).

**User-visible outcome:** Users will only see and be able to select UPI or Cash anywhere payment methods appear, and revenue/payment method breakdowns will display only UPI and Cash totals without errors after upgrade.
