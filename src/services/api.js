const GAS_URL_KEY = 'gas_app_url';

export const getGasUrl = () => {
  return localStorage.getItem(GAS_URL_KEY) || import.meta.env.VITE_GAS_APP_URL || '';
};

export const setGasUrl = (url) => {
  localStorage.setItem(GAS_URL_KEY, url);
};

const callApi = async (data) => {
  const url = getGasUrl();
  if (!url) {
    throw new Error('未設定 Google Apps Script URL，請在設定頁面輸入。');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      // GAS Web App must be user "Me", Access "Anyone".
      // With Access "Anyone", it supports CORS headers usually.
      // So we should try default mode (cors).
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Send as text/plain to avoid preflight options check which GAS doesn't handle well
      },
      body: JSON.stringify(data),
    });

    // With no-cors, we get opaque response. 
    // To get data, we really need CORS.
    // If user deploys as "Anyone", CORS works.

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Call Error:", error);
    // If it's a CORS error (which looks like TypeError: Failed to fetch), we can't distinguish easily.
    // But usually GAS with "Anyone" works.
    throw error;
  }
};

// For GET requests (Query)
const callApiGet = async (params) => {
  const url = getGasUrl();
  if (!url) throw new Error('未設定 GAS URL');

  // params is object
  const query = new URLSearchParams(params).toString();
  const fullUrl = `${url}?${query}`;

  try {
    const response = await fetch(fullUrl);
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

export const api = {
  issueOrder: (orderId) => callApi({ action: 'issue_order', orderId }),
  qcRecord: (orderId) => callApi({ action: 'qc_record', orderId }),
  startWork: (orderId) => callApi({ action: 'start_work', orderId }),
  finishWork: (orderId, quantity) => callApi({ action: 'finish_work', orderId, quantity }),
  queryOrders: () => callApiGet({ action: 'query_orders' }), // For now query all, filtering on client
};
