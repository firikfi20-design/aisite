const BASE = 'https://aisite-dnay.onrender.com/api/admin';

function headers() {
  return {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  };
}

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const adminApi = {
  // Dashboard
  dashboard: ()                        => req('GET',   '/dashboard'),

  // Users
  users:     (params = {})             => req('GET',   '/users?' + new URLSearchParams(params)),
  setUserPlan:(id, plan)               => req('PATCH', `/users/${id}/plan`,          { plan }),
  setUserRole:(id, role)               => req('PATCH', `/users/${id}/role`,          { role }),
  resetRequests:(id)                   => req('POST',  `/users/${id}/reset-requests`),
  deleteUser: (id)                     => req('DELETE',`/users/${id}`),

  // Settings
  getSettings:()                       => req('GET',   '/settings'),
  saveSettings:(updates)               => req('PATCH', '/settings',                  { updates }),

  // Plans
  getPlans:   ()                       => req('GET',   '/plans'),
  createPlan: (data)                   => req('POST',  '/plans',                     data),
  updatePlan: (id, data)               => req('PUT',   `/plans/${id}`,               data),
  deletePlan: (id)                     => req('DELETE',`/plans/${id}`),

  // Payment methods
  getPaymentMethods:  ()               => req('GET',   '/payment-methods'),
  createPaymentMethod:(data)           => req('POST',  '/payment-methods',           data),
  updatePaymentMethod:(id, data)       => req('PUT',   `/payment-methods/${id}`,     data),
  deletePaymentMethod:(id)             => req('DELETE',`/payment-methods/${id}`),

  // Promo codes
  getPromoCodes:  ()                   => req('GET',   '/promo-codes'),
  createPromoCode:(data)               => req('POST',  '/promo-codes',               data),
  togglePromoCode:(id)                 => req('PATCH', `/promo-codes/${id}/toggle`),
  deletePromoCode:(id)                 => req('DELETE',`/promo-codes/${id}`),

  // Announcements
  getAnnouncements:  ()                => req('GET',   '/announcements'),
  createAnnouncement:(data)            => req('POST',  '/announcements',             data),
  toggleAnnouncement:(id)              => req('PATCH', `/announcements/${id}/toggle`),
  deleteAnnouncement:(id)              => req('DELETE',`/announcements/${id}`),

  // Subscriptions
  getSubscriptions:(params = {})       => req('GET',   '/subscriptions?' + new URLSearchParams(params)),
};
