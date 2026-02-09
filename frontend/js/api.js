// api.js
// Handles all communication with the Python Backend

const API_BASE_URL = '/api';

// Helper to handle response status
async function handleResponse(response) {
    if (!response.ok) {
        let errorMsg = 'Unknown error';
        try {
            const error = await response.json();
            errorMsg = error.detail || JSON.stringify(error);
        } catch (e) {
            // If JSON parse fails, use status text
            errorMsg = `Server Error (${response.status}): ${response.statusText}`;
            // Try to get text body for more context
            try {
                const text = await response.text();
                if (text) errorMsg += ` - ${text.substring(0, 100)}`;
            } catch (textErr) {}
        }
        throw new Error(errorMsg);
    }
    return response.json();
}

async function login(username, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
}

async function fetchKPIRecords(department, startDate, endDate) {
    let url = `${API_BASE_URL}/kpi/${department}`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url);
    return handleResponse(response);
}

async function saveKPIRecord(department, record) {
    // record structure: { metric_name, date, data: { ...values... }, subtype }
    const response = await fetch(`${API_BASE_URL}/kpi/${department}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
    });
    return handleResponse(response);
}

async function deleteKPIRecord(recordId) {
    const response = await fetch(`${API_BASE_URL}/kpi/${recordId}`, {
        method: 'DELETE'
    });
    return handleResponse(response);
}

async function fetchPreviousMTD(department, metric, currentDate, subtype) {
    let url = `${API_BASE_URL}/kpi/${department}/previous-mtd?metric=${encodeURIComponent(metric)}&current_date=${currentDate}`;
    if (subtype) url += `&subtype=${encodeURIComponent(subtype)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) return 0; // Default to 0 if not found
        const data = await response.json();
        return parseFloat(data.mtd_actual) || 0;
    } catch (e) {
        console.warn('Failed to fetch previous MTD', e);
        return 0;
    }
}


