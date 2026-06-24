// api.js
// Handles all communication with the Python Backend

const API_BASE_URL = '/api';

// ---------------------------------------------------------------------------
// Token Helpers
// ---------------------------------------------------------------------------

function getToken() {
    return localStorage.getItem('kpi_auth_token');
}

function setToken(token) {
    localStorage.setItem('kpi_auth_token', token);
}

function clearToken() {
    localStorage.removeItem('kpi_auth_token');
}

/** Returns Authorization header object if a token is present, else empty object. */
function authHeaders() {
    const token = getToken();
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
}

// ---------------------------------------------------------------------------
// Response Helper
// ---------------------------------------------------------------------------

async function handleResponse(response, isLogin = false) {
    if (!response.ok) {
        // Handle unauthorized / expired token
        if (response.status === 401 && !isLogin) {
            if (typeof DOM !== 'undefined' && DOM.showToast) {
                DOM.showToast('Session expired. Please log in again.', 'error');
            } else {
                alert('Session expired. Please log in again.');
            }
            setTimeout(() => {
                if (typeof logout === 'function') {
                    logout();
                }
            }, 2000);
            throw new Error('Session expired. Please log in again.');
        }

        let errorMsg = 'Unknown error';
        try {
            const error = await response.json();
            errorMsg = error.detail || JSON.stringify(error);
        } catch (e) {
            errorMsg = `Server Error (${response.status}): ${response.statusText}`;
            try {
                const text = await response.text();
                if (text) errorMsg += ` - ${text.substring(0, 100)}`;
            } catch (textErr) { }
        }
        throw new Error(errorMsg);
    }
    return response.json();
}

// ---------------------------------------------------------------------------
// Session Guard
// ---------------------------------------------------------------------------

/**
 * Proactively validates the current JWT session by calling /api/me.
 * Returns true if the session is valid.
 * If the token is missing or the server returns 401/403, shows a toast,
 * clears credentials, and redirects to the login screen.
 * Callers should `return` immediately when this resolves to false.
 */
async function checkSession() {
    const token = getToken();
    if (!token) {
        if (typeof DOM !== 'undefined' && DOM.showToast) {
            DOM.showToast('Your session has expired. Please log in again.', 'error');
        }
        setTimeout(() => {
            if (typeof logout === 'function') logout();
        }, 1500);
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: { ...authHeaders() }
        });
        if (response.status === 401 || response.status === 403) {
            if (typeof DOM !== 'undefined' && DOM.showToast) {
                DOM.showToast('Your session has expired. Please log in again.', 'error');
            }
            setTimeout(() => {
                if (typeof logout === 'function') logout();
            }, 1500);
            return false;
        }
        return true;
    } catch (e) {
        // Network failure — allow the UI to proceed; the next API write will catch it
        console.warn('checkSession: network error, proceeding optimistically', e);
        return true;
    }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function login(username, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(response, true);
    // Persist token for subsequent authenticated requests
    if (data.token) {
        setToken(data.token);
    }
    return data;
}

async function checkSetupRequired() {
    const response = await fetch(`${API_BASE_URL}/setup-required`);
    return handleResponse(response);
}

async function registerUser(user) {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
    return handleResponse(response);
}

// ---------------------------------------------------------------------------
// Self-Service Profile
// ---------------------------------------------------------------------------

async function fetchMe() {
    const response = await fetch(`${API_BASE_URL}/me`, {
        headers: { ...authHeaders() }
    });
    return handleResponse(response);
}

async function changeMyPassword(currentPassword, newPassword) {
    const response = await fetch(`${API_BASE_URL}/me/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
    return handleResponse(response);
}

// ---------------------------------------------------------------------------
// Admin: User Management
// ---------------------------------------------------------------------------

async function fetchUsers() {
    const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { ...authHeaders() }
    });
    return handleResponse(response);
}

async function fetchUser(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: { ...authHeaders() }
    });
    return handleResponse(response);
}

async function createUser(userData) {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(userData)
    });
    return handleResponse(response);
}

async function updateUser(userId, updateData) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(updateData)
    });
    return handleResponse(response);
}

async function toggleUserStatus(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: { ...authHeaders() }
    });
    return handleResponse(response);
}

async function resetUserPassword(userId, newPassword) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ new_password: newPassword })
    });
    return handleResponse(response);
}

async function resyncAllowedMetrics() {
    const response = await fetch(`${API_BASE_URL}/admin/resync-allowed-metrics`, {
        method: 'POST',
        headers: { ...authHeaders() }
    });
    return handleResponse(response);
}

// ---------------------------------------------------------------------------
// Summary Dashboard
// ---------------------------------------------------------------------------

async function fetchSummaryDashboard(targetDate) {
    const response = await fetch(`${API_BASE_URL}/summary-dashboard?target_date=${targetDate}`, {
        headers: authHeaders()
    });
    return handleResponse(response);
}

// ---------------------------------------------------------------------------
// KPI Records (auth-required reads & writes)
// ---------------------------------------------------------------------------

async function fetchKPIRecords(department, startDate, endDate) {
    let url = `${API_BASE_URL}/kpi/${department}`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
        headers: authHeaders()
    });
    return handleResponse(response);
}

async function saveKPIRecord(department, record) {
    const commentInput = document.getElementById('input-daily-comment');
    if (commentInput && record && record.data) {
        record.data.comment = commentInput.value.trim();
    }
    const response = await fetch(`${API_BASE_URL}/kpi/${department}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(record)
    });
    const result = await handleResponse(response);
    if (commentInput) {
        commentInput.value = '';
    }
    // Clear the persisted draft for this department/metric now that it has been saved.
    if (typeof window.clearFormDraft === 'function' && record && record.metric_name) {
        window.clearFormDraft(department, record.metric_name);
    }
    if (typeof window.afterKPIChange === 'function') {
        try {
            await window.afterKPIChange(department, record ? record.date : null);
        } catch (e) {
            console.warn('afterKPIChange hook failed', e);
        }
    }
    return result;
}

async function deleteKPIRecord(recordId) {
    const response = await fetch(`${API_BASE_URL}/kpi/${recordId}`, {
        method: 'DELETE',
        headers: { ...authHeaders() }
    });
    return handleResponse(response);
}

async function fetchPreviousMTD(department, metric, currentDate, subtype) {
    let url = `${API_BASE_URL}/kpi/${department}/previous-mtd?metric=${encodeURIComponent(metric)}&current_date=${currentDate}`;
    if (subtype) url += `&subtype=${encodeURIComponent(subtype)}`;

    try {
        const response = await fetch(url, {
            headers: authHeaders()
        });
        if (!response.ok) return 0;
        const data = await response.json();
        return parseFloat(data.mtd_actual) || 0;
    } catch (e) {
        console.warn('Failed to fetch previous MTD', e);
        return 0;
    }
}

async function cascadeFixedInputUpdate(department, payload) {
    const response = await fetch(`${API_BASE_URL}/kpi/${department}/cascade-fixed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
}

async function importKPIRecords(department, records) {
    const response = await fetch(`${API_BASE_URL}/kpi/${department}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(records)
    });
    const result = await handleResponse(response);
    if (typeof window.afterKPIChange === 'function') {
        try {
            await window.afterKPIChange(department, null);
        } catch (e) {
            console.warn('afterKPIChange hook failed', e);
        }
    }
    return result;
}

async function forgotPassword(identity) {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity })
    });
    return handleResponse(response);
}

async function resetPassword(identity, code, newPassword) {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, code, new_password: newPassword })
    });
    return handleResponse(response);
}

