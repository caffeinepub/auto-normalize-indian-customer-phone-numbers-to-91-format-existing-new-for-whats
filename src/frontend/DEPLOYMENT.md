# Deployment Checklist

This document provides a lightweight checklist for producing a new build from the current codebase state.

## Pre-Deployment Verification

### 1. AMC Tab Visibility
- [ ] Verify AMC tab is visible in Dashboard navigation (6th tab)
- [ ] Confirm AMC tab trigger renders with FileText icon and "AMC" label
- [ ] Ensure AMCTab component mounts without errors when selected
- [ ] Check that authenticated users can access AMC contracts list

### 2. Currency Formatting (₹)
- [ ] Verify all monetary amounts display with ₹ symbol (not Rs.)
- [ ] Check Dashboard overview cards use formatCurrency()
- [ ] Confirm Revenue Analytics tab shows ₹ formatting
- [ ] Validate AMC tab displays amounts with ₹ symbol
- [ ] Test Customer detail dialogs show ₹ for AMC amounts

### 3. Authentication Flow
- [ ] Confirm login prompt appears for unauthenticated users
- [ ] Verify Dashboard only renders after successful authentication
- [ ] Check that data validation message appears after login
- [ ] Ensure logout clears all cached data

## Build Process

### Standard Build Command
