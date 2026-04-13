import { apiClient } from './apiClient';

export async function fetchHousemates() {
  const res = await apiClient.get('/house/my-house');
  return res.data.members;
}

export async function fetchHouseBalance() {
  const res = await apiClient.get('/house/my-house');
  return { total: res.data.balance };
}

// Relies on resume
export async function getDashboardResume() {
  const res = await apiClient.get('/house/resume');
  return res.data;
}

export async function fetchPendingTotal() {
  try {
    const res = await apiClient.get('/house/resume');
    return { total: res.data.pendingExpenses?.amount || 0 };
  } catch (e) {
    return { total: 0 };
  }
}

export async function fetchPaidTotal() {
  try {
    const res = await apiClient.get('/house/resume');
    return { total: res.data.monthPaidExpenses?.amount || 0 };
  } catch (e) {
    return { total: 0 };
  }
}

export async function fetchUpcomingDueDates() {
  try {
    const res = await apiClient.get('/house/resume');
    return res.data.nextWeekExpenses || [];
  } catch (e) {
    return [];
  }
}

export async function leaveHouse() {
  await apiClient.delete('/house/leave');
  return true;
}

export async function addExpense(expenseData: any) {
  const res = await apiClient.post('/expenses', expenseData);
  return res.data;
}

export async function removeHouseMember(userId: string) {
  const res = await apiClient.delete(`/house/remove-member?userId=${userId}`);
  return res.data;
}

// Adjust balance
export async function updateHouseBalance(valueToAdd: number, valueToSubtract: number = 0) {
    const res = await apiClient.patch(`/house/balance?valueToAdd=${valueToAdd}&valueToSubtract=${valueToSubtract}`);
    return res.data;
}
