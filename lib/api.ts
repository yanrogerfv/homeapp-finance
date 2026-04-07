// API Placeholder functions for the backend requests

// Example usage:
// import { fetchPendingBalance } from '@/lib/api'

// All these functions should be wired up to actual backend endpoints using trpc or fetch.
// The placeholders log exactly the expected behavior.

export async function fetchHousemates() {
  // return fetch('/api/housemates').then(res => res.json())
  return [
    { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice', email: 'email@email.com' },
    { id: '2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob', email: 'email@email.com' },
    { id: '3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie', email: 'email@email.com' },
  ];
}

export async function fetchHouseBalance() {
  // return fetch('/api/house/balance').then(res => res.json())
  return { total: 12500.00 }; // Placeholder
}

export async function fetchPendingTotal() {
  // return fetch('/api/transactions/pending').then(res => res.json())
  return { total: 450.00 }; // Placeholder
}

export async function fetchPaidTotal() {
  // return fetch('/api/transactions/paid').then(res => res.json())
  return { total: 3200.00 }; // Placeholder
}

export async function fetchUpcomingDueDates() {
  // return fetch('/api/transactions/upcoming').then(res => res.json())
  return [
    { id: '1', title: 'Energia Elétrica', date: '2026-04-10', amount: 150.00 },
    { id: '2', title: 'Internet', date: '2026-04-15', amount: 120.00 },
  ];
}

export async function leaveHouse(houseId: string, userId: string) {
  // return fetch(`/api/house/${houseId}/leave`, { method: 'POST', body: JSON.stringify({ userId }) })
  console.log('User left the house');
  return true;
}

export async function addExpense(expenseData: any) {
  // return fetch('/api/expenses', { method: 'POST', body: JSON.stringify(expenseData) })
  console.log('Expense added', expenseData);
  return { success: true };
}
