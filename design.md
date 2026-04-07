# House Finance App - Design Plan

## Overview

A mobile-first finance management app for household expenses and income tracking. The app features biometric authentication after initial login, a dashboard with financial summaries, transaction management, and a public shopping list.

---

## Screen List

### Public Screens (No Authentication Required)

1. **Shopping List Screen**
   - Browse and manage a shared shopping list
   - Add, edit, and remove items
   - Mark items as purchased
   - No login required

### Protected Screens (Authentication Required)

2. **Login Screen**
   - Email/username and password input
   - "Remember me" option for biometric setup
   - Sign-up link (if new user)

3. **Biometric Authentication Screen**
   - Face ID / Fingerprint prompt
   - Fallback to password option
   - Shown on app launch if user previously logged in

4. **Dashboard Screen**
   - Summary cards showing:
     - Total balance (income - expenses)
     - Current month income
     - Current month expenses
     - Remaining budget (if applicable)
   - Quick action buttons (Add Income, Add Expense)
   - Recent transactions list (last 5-10 items)
   - Chart visualization (monthly trend or category breakdown)

5. **Transactions Screen**
   - List of all incomes and expenses
   - Filter by type (Income/Expense)
   - Filter by date range
   - Search functionality
   - Tap to view/edit transaction details

6. **Add/Edit Transaction Screen**
   - Form fields:
     - Amount (required)
     - Description/Title (required)
     - Category (Income/Expense categories)
     - Date (required)
     - Is Periodic? (toggle)
     - If periodic: Frequency (Weekly, Monthly, Quarterly, Yearly)
     - If periodic: End Date (optional)
     - Notes (optional)
   - Save and Delete buttons
   - Validation feedback

7. **Categories Screen**
   - View all expense categories (e.g., Utilities, Groceries, Rent, etc.)
   - View all income categories (e.g., Salary, Bonus, etc.)
   - Option to add custom categories
   - Edit/delete categories

8. **Monthly Report Screen**
   - Summary for selected month
   - Breakdown by category (pie chart or bar chart)
   - Income vs. Expense comparison
   - Trend analysis
   - Export option (if applicable)

9. **Settings Screen**
   - Change password
   - Enable/disable biometric login
   - Currency selection
   - Theme (light/dark mode)
   - Logout button

---

## Primary Content and Functionality

### Dashboard
- **Summary Cards**: Display key metrics at a glance
- **Recent Transactions**: Quick view of latest activity
- **Chart**: Visual representation of spending trends
- **Quick Actions**: Fast access to add income/expense

### Transaction Management
- **Add Transaction**: Create new income or expense with optional periodic settings
- **Edit Transaction**: Modify existing transactions
- **Delete Transaction**: Remove transactions with confirmation
- **List View**: Browse all transactions with filters and search
- **Periodic Transactions**: Automatically generate recurring transactions

### Shopping List
- **Public Access**: No authentication needed
- **CRUD Operations**: Add, view, edit, mark as purchased, delete items
- **Persistent Storage**: Data saved locally on device

### Categories
- **Predefined Categories**: Default expense and income categories
- **Custom Categories**: Users can create their own
- **Category Management**: Edit or delete custom categories

---

## Key User Flows

### Flow 1: First-Time Login
1. User opens app → Login Screen
2. Enters email/password
3. Chooses to enable biometric (optional)
4. System stores credentials securely
5. Redirected to Dashboard

### Flow 2: Subsequent App Launch (Biometric)
1. User opens app → Biometric Prompt
2. Completes Face ID / Fingerprint
3. Redirected to Dashboard
4. Option to use password if biometric fails

### Flow 3: Add Periodic Expense
1. User taps "Add Expense" on Dashboard
2. Fills in amount, description, category, date
3. Toggles "Is Periodic?" to ON
4. Selects frequency (e.g., Monthly)
5. Optionally sets end date
6. Saves transaction
7. System automatically generates future transactions

### Flow 4: View Monthly Report
1. User navigates to Reports/Dashboard
2. Selects a month
3. Views income, expenses, and breakdown by category
4. Can compare with previous months

### Flow 5: Access Shopping List
1. User opens app
2. Taps "Shopping List" tab (no login required)
3. Views shared shopping list
4. Can add, edit, or mark items as purchased
5. Changes persist locally

---

## Color Choices

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Primary** | Teal | #0a7ea4 | Buttons, highlights, active states |
| **Background** | White (Light) / Dark Gray (Dark) | #ffffff / #151718 | Screen backgrounds |
| **Surface** | Light Gray (Light) / Darker Gray (Dark) | #f5f5f5 / #1e2022 | Cards, elevated surfaces |
| **Foreground** | Dark (Light) / Light (Dark) | #11181C / #ECEDEE | Primary text |
| **Muted** | Medium Gray | #687076 / #9BA1A6 | Secondary text |
| **Success** | Green | #22C55E | Positive actions, saved states |
| **Warning** | Amber | #F59E0B | Caution, pending states |
| **Error** | Red | #EF4444 | Errors, destructive actions |

---

## Navigation Structure

```
Root
├── Public Tab
│   └── Shopping List (no auth required)
├── Auth Stack (if not logged in)
│   ├── Login Screen
│   └── Biometric Prompt
└── Protected Tabs (if logged in)
    ├── Dashboard
    ├── Transactions
    ├── Categories
    ├── Reports
    └── Settings
```

---

## Data Models

### Transaction
```typescript
{
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: Date;
  isPeriodic: boolean;
  frequency?: "weekly" | "monthly" | "quarterly" | "yearly";
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ShoppingItem
```typescript
{
  id: string;
  title: string;
  quantity?: number;
  unit?: string;
  isPurchased: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Category
```typescript
{
  id: string;
  name: string;
  type: "income" | "expense";
  isCustom: boolean;
  color?: string;
}
```

### User
```typescript
{
  id: string;
  email: string;
  passwordHash: string;
  biometricEnabled: boolean;
  currency: string;
  theme: "light" | "dark" | "auto";
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Implementation Notes

- **Local Storage**: Use AsyncStorage for transactions and shopping list
- **Secure Storage**: Use expo-secure-store for credentials and biometric settings
- **Biometric**: Use expo-local-authentication for Face ID / Fingerprint
- **State Management**: React Context + useReducer for global state
- **Charts**: Use a lightweight library like react-native-svg or chart library
- **Responsive Design**: Optimize for portrait orientation (9:16 aspect ratio)
- **Accessibility**: Ensure proper contrast ratios and touch targets (min 44x44 pts)
