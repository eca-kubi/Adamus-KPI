// app.js
// Main application logic

// State
const STATE = {
    currentUser: null,
    currentDept: "OHS",
    currentMetric: "Fixed Inputs",
    currentView: 'dept',  // 'dept' | 'users' | 'profile' | 'summary'
    summaryDate: null
};

const DEPARTMENTS = ["OHS", "Geology", "Mining", "Crushing", "Milling_CIL", "Engineering"];
const METRIC_ACCESS_OPTIONS = ["All", ...DEPARTMENTS];

const DEPT_ICONS = {
    "OHS": "bi-ohs",
    "Geology": "bi-gem",
    "Mining": "bi-dump-truck",
    "Crushing": "bi-crusher",
    "Milling_CIL": "bi-milling",
    "Engineering": "bi-tools"
};

const validateAdamusEmail = (email) => {
    if (!email) return false;
    return email.toLowerCase().trim().endsWith("@adamusgh.com");
};

const DEPT_METRICS = {
    "Milling_CIL": [
        "Fixed Inputs",
        "Gold Contained",
        "Gold Recovery",
        "Recovery",
        "Plant Feed Grade",
        "Tonnes Treated"
    ],
    "Geology": [
        "Fixed Inputs",
        "Exploration Drilling",
        "Grade Control Drilling",
        "Toll"
    ],
    "Mining": [
        "Fixed Inputs",
        "Ore Mined",
        "Grade - Ore Mined",
        "Grade Rehandle",
        "Total Material Moved",
        "Blast Hole Drilling"
    ],
    "Crushing": [
        "Fixed Inputs",
        "Grade - Ore Crushed",
        "Ore Crushed"
    ],
    "OHS": [
        "Fixed Inputs",
        "Safety Incidents",
        "Environmental Incidents",
        "Property Damage",
        "Near Miss"
    ],
    "Engineering": [
        "Fixed Inputs",
        "Light Vehicles",
        "Tipper Trucks",
        "Prime Excavators",
        "Anx Excavators",
        "Dump Trucks",
        "ART Dump Trucks",
        "Wheel Loaders",
        "Graders",
        "Dozers",
        "Crusher",
        "Mill",
        "Pumps",
        "Drill Rigs"
    ]
};

const IMPORT_CONFIGS = {
    'Fixed Inputs': {
        headers: ['KPI', 'Target Month (YYYY-MM)', 'Days', 'Full Forecast', 'Full Budget', 'Forecast Per Rig'],
        keys: ['metric_name', 'date', 'num_days', 'full_forecast', 'full_budget', 'forecast_per_rig']
    },
    'Exploration Drilling': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Grade Control Drilling': {
        headers: ['Date (YYYY-MM-DD)', 'Rigs', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'num_rigs', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Toll': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual (Wet Tonnes)', 'Dry Tonnes', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'wet_tonnes', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Ore Mined': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Grade - Ore Mined': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Actual(g/t)', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_act_grade', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Grade Rehandle': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual (t)', 'Daily Actual (g/t)', 'Daily Forecast (g/t)'],
        keys: ['date', 'daily_actual', 'daily_act_grade', 'daily_forecast']
    },
    'Total Material Moved': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual(bcm)', 'Daily Forecast(bcm)', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Blast Hole Drilling': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Grade - Ore Crushed': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual(t)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_act_tonnes', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Ore Crushed': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Plant Feed Grade': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual(t)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget', 'Day-2'],
        keys: ['date', 'daily_act_tonnes', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget', 'day2']
    },
    'Gold Contained': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget', 'Day-2'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget', 'day2']
    },
    'Gold Recovery': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget', 'Day-2'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget', 'day2']
    },
    'Recovery': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget', 'Day-2'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget', 'day2']
    },
    'Tonnes Treated': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget', 'Day-2'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget', 'day2']
    },
    'Safety Incidents': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Environmental Incidents': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Property Damage': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    },
    'Near Miss': {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual', 'Daily Forecast', 'Outlook', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'outlook', 'full_forecast', 'full_budget']
    }
};

// Engineering metrics mapping
['Light Vehicles', 'Tipper Trucks', 'Pumps', 'Drill Rigs', 'Prime Excavators', 'Anx Excavators', 'Dump Trucks', 'ART Dump Trucks', 'Wheel Loaders', 'Graders', 'Dozers'].forEach(m => {
    IMPORT_CONFIGS[m] = {
        headers: ['Date (YYYY-MM-DD)', 'Qty Available', 'Daily Actual(%)', 'Daily Forecast(%)', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'qty_available', 'daily_actual', 'daily_forecast', 'full_forecast', 'full_budget']
    };
});
['Crusher', 'Mill'].forEach(m => {
    IMPORT_CONFIGS[m] = {
        headers: ['Date (YYYY-MM-DD)', 'Daily Actual(%)', 'Daily Forecast(%)', 'Full Forecast', 'Full Budget'],
        keys: ['date', 'daily_actual', 'daily_forecast', 'full_forecast', 'full_budget']
    };
});

const ROUTER_STATE = {
    isApplyingRoute: false,
    suppressHashChange: false
};

function slugifyRoutePart(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[_\s]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

const DEPT_BY_SLUG = DEPARTMENTS.reduce((acc, dept) => {
    acc[slugifyRoutePart(dept)] = dept;
    return acc;
}, {});

const METRIC_BY_DEPT_SLUG = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = (DEPT_METRICS[dept] || []).reduce((metricMap, metric) => {
        metricMap[slugifyRoutePart(metric)] = metric;
        return metricMap;
    }, {});
    return acc;
}, {});

function parseRouteFromHash(hashInput = window.location.hash) {
    let hash = (hashInput || '').trim();
    if (!hash || hash === '#') return { view: 'summary' };

    let qs = '';
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
        qs = hash.slice(qIndex + 1);
        hash = hash.slice(0, qIndex);
    }

    if (hash.startsWith('#')) hash = hash.slice(1);
    if (!hash.startsWith('/')) hash = `/${hash}`;

    const parts = hash
        .split('/')
        .filter(Boolean)
        .map(p => decodeURIComponent(p).toLowerCase());

    const route = { invalid: true };

    if (parts.length === 0 || parts[0] === 'summary') {
        route.view = 'summary';
        route.invalid = false;
        if (qs) {
            const urlParams = new URLSearchParams(qs);
            if (urlParams.has('date')) {
                route.date = urlParams.get('date');
            }
        }
    } else if (parts[0] === 'users') {
        route.view = 'users';
        route.invalid = false;
    } else if (parts[0] === 'profile') {
        route.view = 'profile';
        route.invalid = false;
    } else if (parts[0] === 'dept') {
        const dept = DEPT_BY_SLUG[parts[1]];
        if (dept) {
            if (parts.length === 2) {
                route.view = 'dept';
                route.dept = dept;
                route.invalid = false;
            } else if (parts.length === 4 && parts[2] === 'metric') {
                const metric = (METRIC_BY_DEPT_SLUG[dept] || {})[parts[3]];
                if (metric) {
                    route.view = 'dept';
                    route.dept = dept;
                    route.metric = metric;
                    route.invalid = false;
                }
            }
        }
    }

    return route;
}

function getCanonicalHashFromState() {
    if (STATE.currentView === 'users') return '#/users';
    if (STATE.currentView === 'profile') return '#/profile';

    if (STATE.currentView === 'dept') {
        const dept = DEPARTMENTS.includes(STATE.currentDept) ? STATE.currentDept : DEPARTMENTS[0];
        const availableMetrics = DEPT_METRICS[dept] || [];
        const metric = availableMetrics.includes(STATE.currentMetric) ? STATE.currentMetric : availableMetrics[0];

        if (metric) {
            return `#/dept/${slugifyRoutePart(dept)}/metric/${slugifyRoutePart(metric)}`;
        }

        return `#/dept/${slugifyRoutePart(dept)}`;
    }

    if (STATE.summaryDate) {
        return `#/summary?date=${STATE.summaryDate}`;
    }
    return '#/summary';
}

function setRouteHash(hash, { replace = false } = {}) {
    if (!STATE.currentUser || !hash || window.location.hash === hash) return;

    ROUTER_STATE.suppressHashChange = true;

    if (replace) {
        const url = `${window.location.pathname}${window.location.search}${hash}`;
        window.history.replaceState(null, '', url);
        setTimeout(() => {
            ROUTER_STATE.suppressHashChange = false;
        }, 0);
        return;
    }

    window.location.hash = hash;
    setTimeout(() => {
        ROUTER_STATE.suppressHashChange = false;
    }, 0);
}

function syncRouteHashFromState() {
    const canonicalHash = getCanonicalHashFromState();
    setRouteHash(canonicalHash, { replace: ROUTER_STATE.isApplyingRoute });
}

async function applyRouteFromHash() {
    if (!STATE.currentUser) return false;

    const route = parseRouteFromHash(window.location.hash);
    const isAdmin = ((STATE.currentUser.role || '').toLowerCase() === 'admin');

    ROUTER_STATE.isApplyingRoute = true;
    try {
        if (route.invalid) {
            await renderSummaryDashboardPage();
            setRouteHash('#/summary', { replace: true });
            return true;
        }

        if (route.view === 'summary') {
            if (route.date) {
                STATE.summaryDate = route.date;
            }
            await renderSummaryDashboardPage();
            return true;
        }

        if (route.view === 'users') {
            if (!isAdmin) {
                await renderSummaryDashboardPage();
                setRouteHash('#/summary', { replace: true });
                return true;
            }
            await renderUserManagementPage();
            return true;
        }

        if (route.view === 'profile') {
            await renderMyProfilePage();
            return true;
        }

        if (route.view === 'dept') {
            await window.loadDepartmentView(route.dept);
            if (route.metric && route.metric !== STATE.currentMetric) {
                window.loadMetricView(route.metric);
            }
            return true;
        }

        await renderSummaryDashboardPage();
        setRouteHash('#/summary', { replace: true });
        return true;
    } finally {
        ROUTER_STATE.isApplyingRoute = false;
    }
}

window.addEventListener('hashchange', () => {
    if (!STATE.currentUser || ROUTER_STATE.suppressHashChange || ROUTER_STATE.isApplyingRoute) {
        return;
    }
    applyRouteFromHash();
});


document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check if first-time setup is required
        const setupData = await checkSetupRequired();
        if (setupData && setupData.setup_required) {
            renderSetupScreen();
            return;
        }
    } catch (e) {
        console.error("Failed to check setup status", e);
    }

    const storedUser = localStorage.getItem('kpi_current_user');
    const token = localStorage.getItem('kpi_auth_token');
    if (storedUser && token) {
        try {
            STATE.currentUser = JSON.parse(storedUser);
            await initApp();
        } catch (e) {
            renderLoginScreen();
        }
    } else {
        renderLoginScreen();
    }
});

async function initApp() {
    // Failsafe: if no user logic, redirect to login
    if (!STATE.currentUser) {
        // Double check localstorage
        const storedUser = localStorage.getItem('kpi_current_user');
        const token = localStorage.getItem('kpi_auth_token');
        if (storedUser && token) {
            STATE.currentUser = JSON.parse(storedUser);
        } else {
            renderLoginScreen();
            return;
        }
    }

    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    // Switch to dashboard mode
    app.classList.remove('auth-mode');
    content.classList.remove('auth-layout');
    content.classList.add('main-content');
    sidebar.classList.add('show');
    document.getElementById('sidebar-toggle').style.display = 'block';

    await applyRouteFromHash();
}

function renderLoginScreen() {
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    // Switch to auth mode
    app.classList.add('auth-mode');
    sidebar.classList.remove('show');
    content.className = 'main-content auth-layout';
    content.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'auth-container text-center fade-in w-100';

    // Logo
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'mb-4';
    iconWrapper.innerHTML = '<img src="images/adamus_logo.png" alt="Adamus" style="height: 80px;">';
    container.appendChild(iconWrapper);

    const title = document.createElement('h2');
    title.className = 'text-primary mb-2';
    title.textContent = 'Adamus KPI';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Sign in to your account';
    container.appendChild(subtitle);

    const username = DOM.createInputGroup('Username', 'login-username');
    const password = DOM.createInputGroup('Password', 'login-password', 'password');

    container.appendChild(username.container);
    container.appendChild(password.container);

    const handleEnter = (e) => { if (e.key === 'Enter') loginBtn.click(); };
    username.input.onkeypress = handleEnter;
    password.input.onkeypress = handleEnter;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'd-grid gap-2 mt-4';

    const loginBtn = DOM.createButton('Sign In', () => {
        performLogin(username.input.value, password.input.value);
    }, 'primary', 'bi-box-arrow-in-right');
    loginBtn.className = 'btn btn-primary btn-lg';

    const cancelBtn = DOM.createButton('Clear', () => {
        username.input.value = '';
        password.input.value = '';
    }, 'outline-secondary');

    const forgotLink = document.createElement('a');
    forgotLink.className = 'd-block mt-3 text-muted small';
    forgotLink.href = '#';
    forgotLink.textContent = 'Forgot Password?';
    forgotLink.onclick = (e) => {
        e.preventDefault();
        renderForgotPasswordScreen();
    };

    /*     const registerLink = document.createElement('div');
        registerLink.className = 'mt-4 text-muted';
        registerLink.innerHTML = `New user? <a href="#" class="text-primary fw-semibold">Create Account</a>`;
        registerLink.querySelector('a').onclick = (e) => {
            e.preventDefault();
            renderRegisterScreen();
        }; */

    // Append all
    btnContainer.appendChild(loginBtn);
    btnContainer.appendChild(cancelBtn);
    container.appendChild(btnContainer);
    container.appendChild(forgotLink);
    /* container.appendChild(registerLink); */

    content.appendChild(container);
}

function renderForgotPasswordScreen() {
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    // Switch to auth mode
    app.classList.add('auth-mode');
    sidebar.classList.remove('show');
    content.className = 'main-content auth-layout';
    content.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'auth-container text-center fade-in w-100';

    // Logo
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'mb-4';
    iconWrapper.innerHTML = '<img src="images/adamus_logo.png" alt="Adamus" style="height: 80px;">';
    container.appendChild(iconWrapper);

    const title = document.createElement('h2');
    title.className = 'text-primary mb-2';
    title.textContent = 'Forgot Password';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Enter your registered email address or phone number to receive a verification code.';
    container.appendChild(subtitle);

    const identityInput = DOM.createInputGroup('Email Address or Phone Number', 'reset-identity');
    identityInput.input.placeholder = 'e.g. name@adamusgh.com or +233...';
    container.appendChild(identityInput.container);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'd-grid gap-2 mt-4';

    const submitBtn = DOM.createButton('Request Reset Code', async () => {
        const val = identityInput.input.value.trim();
        if (!val) {
            DOM.showToast('Please enter your email address or phone number.', 'error');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        const origText = submitBtn.innerHTML;
        submitBtn.innerHTML = '';

        try {
            const res = await forgotPassword(val);
            DOM.showToast(res.message, 'success');
            renderVerifyResetCodeScreen(val);
        } catch (e) {
            DOM.showToast(e.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
            submitBtn.innerHTML = origText;
        }
    }, 'primary', 'bi-envelope-fill');
    submitBtn.className = 'btn btn-primary btn-lg';

    const backBtn = DOM.createButton('Back to Login', () => {
        renderLoginScreen();
    }, 'outline-secondary', 'bi-arrow-left');
    backBtn.className = 'btn btn-outline-secondary';

    btnContainer.appendChild(submitBtn);
    btnContainer.appendChild(backBtn);
    container.appendChild(btnContainer);
    content.appendChild(container);
}

function renderVerifyResetCodeScreen(identity) {
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    // Switch to auth mode
    app.classList.add('auth-mode');
    sidebar.classList.remove('show');
    content.className = 'main-content auth-layout';
    content.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'auth-container text-center fade-in w-100';

    // Logo
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'mb-4';
    iconWrapper.innerHTML = '<img src="images/adamus_logo.png" alt="Adamus" style="height: 80px;">';
    container.appendChild(iconWrapper);

    const title = document.createElement('h2');
    title.className = 'text-primary mb-2';
    title.textContent = 'Verify Code';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.innerHTML = `Enter the 6-digit code sent to <strong class="text-dark">${identity}</strong> and define your new password.`;
    container.appendChild(subtitle);

    const codeInput = DOM.createInputGroup('6-Digit Verification Code', 'reset-code');
    codeInput.input.placeholder = 'e.g. 123456';
    codeInput.input.maxLength = 6;
    
    const newPasswordInput = DOM.createInputGroup('New Password', 'reset-new-password', 'password');
    const confirmPasswordInput = DOM.createInputGroup('Confirm New Password', 'reset-confirm-password', 'password');

    container.appendChild(codeInput.container);
    container.appendChild(newPasswordInput.container);
    container.appendChild(confirmPasswordInput.container);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'd-grid gap-2 mt-4';

    const submitBtn = DOM.createButton('Reset Password', async () => {
        const code = codeInput.input.value.trim();
        const p1 = newPasswordInput.input.value;
        const p2 = confirmPasswordInput.input.value;

        if (!code) {
            DOM.showToast('Please enter the 6-digit verification code.', 'error');
            return;
        }
        if (code.length !== 6 || isNaN(code)) {
            DOM.showToast('The verification code must be a 6-digit number.', 'error');
            return;
        }
        if (!p1 || p1.length < 6) {
            DOM.showToast('New password must be at least 6 characters.', 'error');
            return;
        }
        if (p1 !== p2) {
            DOM.showToast('Passwords do not match.', 'error');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        const origText = submitBtn.innerHTML;
        submitBtn.innerHTML = '';

        try {
            const res = await resetPassword(identity, code, p1);
            DOM.showToast(res.message, 'success');
            renderLoginScreen();
        } catch (e) {
            DOM.showToast(e.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
            submitBtn.innerHTML = origText;
        }
    }, 'primary', 'bi-check-circle-fill');
    submitBtn.className = 'btn btn-primary btn-lg';

    const resendLink = document.createElement('a');
    resendLink.className = 'd-block mt-3 mb-2 text-primary small fw-semibold';
    resendLink.href = '#';
    resendLink.textContent = 'Resend Verification Code';
    resendLink.onclick = async (e) => {
        e.preventDefault();
        try {
            const res = await forgotPassword(identity);
            DOM.showToast('Verification code resent successfully.', 'success');
        } catch (err) {
            DOM.showToast(err.message, 'error');
        }
    };

    const backBtn = DOM.createButton('Back to Login', () => {
        renderLoginScreen();
    }, 'outline-secondary', 'bi-arrow-left');
    backBtn.className = 'btn btn-outline-secondary';

    btnContainer.appendChild(submitBtn);
    btnContainer.appendChild(backBtn);
    container.appendChild(resendLink);
    container.appendChild(btnContainer);
    content.appendChild(container);
}


function renderSetupScreen() {
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    // Switch to auth mode
    app.classList.add('auth-mode');
    sidebar.classList.remove('show');
    content.className = 'main-content auth-layout';
    content.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'auth-container text-center fade-in border border-2 border-primary w-100';

    // Logo
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'mb-4';
    iconWrapper.innerHTML = '<img src="images/adamus_logo.png" alt="Adamus" style="height: 80px;">';
    container.appendChild(iconWrapper);

    const title = document.createElement('h2');
    title.className = 'text-primary mb-2';
    title.textContent = 'Initial Admin Setup';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Please create the first Administrator account.';
    container.appendChild(subtitle);

    const username = DOM.createInputGroup('Username (Admin)', 'reg-username');
    const fullName = DOM.createInputGroup('Full Name', 'reg-fullname');
    const email = DOM.createInputGroup('Corporate Email (@adamusgh.com)', 'reg-email', 'email');
    email.input.placeholder = 'your-username@adamusgh.com';
    const phoneNumber = DOM.createInputGroup('Phone Number', 'reg-phone');
    const password = DOM.createInputGroup('Password', 'reg-password', 'password');
    const confirm = DOM.createInputGroup('Confirm Password', 'reg-confirm', 'password');

    // Helper text under email field
    const emailHint = document.createElement('p');
    emailHint.className = 'text-muted small mt-n2 mb-2 text-start';
    emailHint.textContent = 'A confirmation email will be sent to this address.';

    container.appendChild(username.container);
    container.appendChild(fullName.container);
    container.appendChild(email.container);
    container.appendChild(emailHint);
    container.appendChild(phoneNumber.container);
    container.appendChild(password.container);
    container.appendChild(confirm.container);

    // Real-time validation
    email.input.addEventListener('input', () => {
        if (!email.input.value) {
            email.input.classList.remove('is-invalid', 'is-valid');
            return;
        }
        if (validateAdamusEmail(email.input.value)) {
            email.input.classList.remove('is-invalid');
            email.input.classList.add('is-valid');
        } else {
            email.input.classList.remove('is-valid');
            email.input.classList.add('is-invalid');
        }
    });

    const handleEnter = (e) => { if (e.key === 'Enter') createBtn.click(); };
    [username, fullName, email, phoneNumber, password, confirm].forEach(g => { if (g.input) g.input.onkeypress = handleEnter; });

    const createBtn = DOM.createButton('Create Admin Account', async () => {
        const u = username.input.value.trim();
        const fn = fullName.input.value.trim();
        const e = email.input.value.trim();
        const ph = phoneNumber.input.value.trim();
        const p = password.input.value;
        const c = confirm.input.value;

        if (!u || !p || !e) { DOM.showToast('Please fill all required fields, including email', 'error'); return; }
        if (!validateAdamusEmail(e)) { DOM.showToast('Only @adamusgh.com email addresses are allowed', 'error'); return; }
        if (p !== c) { DOM.showToast('Passwords do not match', 'error'); return; }

        try {
            await registerUser({
                username: u,
                full_name: fn || null,
                email: e || null,
                phone_number: ph || null,
                password: p,
                departments: ['All'],
                role: 'Admin'
            });
            DOM.showToast('Admin account created! A confirmation email has been sent.');
            renderLoginScreen();
        } catch (err) {
            DOM.showToast(err.message, 'error');
        }
    }, 'primary', 'bi-person-plus-fill');
    createBtn.className = 'btn btn-primary btn-lg w-100 mt-4';

    container.appendChild(createBtn);
    content.appendChild(container);
}

function renderRegisterScreen() {
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    // Switch to auth mode
    app.classList.add('auth-mode');
    sidebar.classList.remove('show');
    content.className = 'main-content auth-layout';
    content.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'auth-container text-center fade-in w-100';

    // Logo
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'mb-4';
    iconWrapper.innerHTML = '<img src="images/adamus_logo.png" alt="Adamus" style="height: 80px;">';
    container.appendChild(iconWrapper);

    const title = document.createElement('h2');
    title.className = 'text-primary mb-2';
    title.textContent = 'Create Account';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Fill in your details to register';
    container.appendChild(subtitle);

    const username = DOM.createInputGroup('Username', 'reg-username');
    const password = DOM.createInputGroup('Password', 'reg-password', 'password');
    const confirm = DOM.createInputGroup('Confirm Password', 'reg-confirm', 'password');

    // Access Select (renamed from Department) - will be changed to checkboxes in User Management
    const deptGroup = DOM.createSelect('Metric Access', 'reg-dept', METRIC_ACCESS_OPTIONS, 'Select Access');

    // Role Select
    const ROLES = ['Admin', 'GM', 'HOD', 'Staff'];
    const roleGroup = DOM.createSelect('Role', 'reg-role', ROLES, 'Select Role');

    container.appendChild(username.container);
    container.appendChild(password.container);
    container.appendChild(confirm.container);
    container.appendChild(deptGroup.container);
    container.appendChild(roleGroup.container);

    const handleEnter = (e) => { if (e.key === 'Enter') createBtn.click(); };
    [username, password, confirm].forEach(g => { if (g.input) g.input.onkeypress = handleEnter; });

    const createBtn = DOM.createButton('Create Account', async () => {
        const u = username.input.value;
        const p = password.input.value;
        const c = confirm.input.value;
        const d = deptGroup.select.value;
        const r = roleGroup.select.value;

        if (!u || !p || !d || !r) { DOM.showToast('Please fill all fields', 'error'); return; }
        if (p !== c) { DOM.showToast('Passwords do not match', 'error'); return; }

        try {
            await registerUser({
                username: u,
                password: p,
                departments: [d],
                role: r
            });
            DOM.showToast('User created! Please login.');
            renderLoginScreen();
        } catch (e) {
            DOM.showToast(e.message, 'error');
        }
    }, 'primary', 'bi-check-circle');
    createBtn.className = 'btn btn-primary btn-lg w-100 mt-4';

    const backBtn = DOM.createButton('Back to Login', () => {
        renderLoginScreen();
    }, 'outline-secondary', 'bi-arrow-left');
    backBtn.className = 'btn btn-outline-secondary w-100 mt-2';

    container.appendChild(createBtn);
    container.appendChild(backBtn);
    content.appendChild(container);
}

async function performLogin(u, p) {
    try {
        const data = await login(u, p);
        STATE.currentUser = data.user;
        localStorage.setItem('kpi_current_user', JSON.stringify(data.user));
        // Token is already saved by login() in api.js via setToken()
        await initApp();
    } catch (e) {
        DOM.showToast(e.message, 'error');
    }
}

function logout() {
    STATE.currentUser = null;
    localStorage.removeItem('kpi_current_user');
    clearToken();
    renderLoginScreen();
}

function sidebarNavigate(callback) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        return; // Don't navigate, just expand
    }
    if (callback) callback();
}

function renderSidebar() {
    const nav = document.getElementById('sidebar');
    const userDisplay = STATE.currentUser ? STATE.currentUser.username : 'User';
    const userRole = STATE.currentUser ? STATE.currentUser.role : '';
    const isAdmin = (userRole || '').toLowerCase() === 'admin';

    nav.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4 w-100">
            <h2 class="d-flex align-items-center gap-2 mb-0 overflow-hidden">
                <img src="images/adamus_logo_transparent_white_text.png" alt="Adamus Logo" style="height: 32px; flex-shrink:0;">
                <span class="fs-5">Adamus KPI</span>
            </h2>
            <button class="btn btn-link text-white p-0 hover-lift sidebar-toggle-btn" 
                onclick="document.getElementById('sidebar').classList.toggle('collapsed')" title="Toggle Sidebar">
                <i class="bi bi-list fs-5"></i>
            </button>
        </div>
        
        <nav class="nav flex-column flex-grow-1" style="margin-top: -1rem;">
            <a href="#" onclick="sidebarNavigate(renderSummaryDashboardPage); return false;"
               class="nav-link ${STATE.currentView === 'summary' ? 'active' : ''}"
               data-tooltip="Summary Dashboard">
               <i class="bi bi-grid-1x2-fill"></i>
               <span>Summary Dashboard</span>
            </a>

            <hr style="border-color: rgba(255,255,255,0.1); margin: 0.5rem 0;">

            ${DEPARTMENTS.map(dept => `
                <a href="#" onclick="sidebarNavigate(() => loadDepartmentView('${dept}')); return false;" 
                   class="nav-link ${STATE.currentView === 'dept' && STATE.currentDept === dept ? 'active' : ''}"
                   data-tooltip="${dept.replace('_', ' ')}">
                   <i class="bi ${DEPT_ICONS[dept] || 'bi-folder2'}"></i>
                   <span>${dept.replace('_', ' ')}</span>
                </a>
            `).join('')}

            <hr style="border-color: rgba(255,255,255,0.1); margin: 0.75rem 0;">

            ${isAdmin ? `
            <a href="#" onclick="sidebarNavigate(renderUserManagementPage); return false;"
               class="nav-link ${STATE.currentView === 'users' ? 'active' : ''}"
               data-tooltip="User Management">
               <i class="bi bi-people-fill"></i>
               <span>User Management</span>
            </a>
            ` : ''}

            <a href="#" onclick="sidebarNavigate(renderMyProfilePage); return false;"
               class="nav-link ${STATE.currentView === 'profile' ? 'active' : ''}"
               data-tooltip="My Profile">
               <i class="bi bi-person-circle"></i>
               <span>My Profile</span>
            </a>
        </nav>

        <div class="user-info mt-auto">
            <div class="d-flex align-items-center justify-content-between w-100">
                <div class="d-flex align-items-center gap-3 overflow-hidden">
                    <div class="avatar-circle">
                        <i class="bi bi-person-fill"></i>
                    </div>
                    <div class="user-details text-truncate">
                        <div class="user-name text-truncate" title="${userDisplay}">${userDisplay}</div>
                        <div class="user-role text-truncate">${userRole}</div>
                    </div>
                </div>
                
                <div class="dropdown dropup">
                    <button class="btn btn-link text-white p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                        <li>
                            <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="renderMyProfilePage(); return false;">
                                <i class="bi bi-person-circle"></i> My Profile
                            </a>
                        </li>
                        ${isAdmin ? `
                        <li>
                            <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="renderUserManagementPage(); return false;">
                                <i class="bi bi-people-fill"></i> User Management
                            </a>
                        </li>
                        ` : ''}
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item text-danger d-flex align-items-center gap-2" href="#" onclick="logout(); return false;">
                                <i class="bi bi-box-arrow-right"></i> Logout
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Make loadDepartmentView global so HTML onclick can find it
window.loadDepartmentView = async function (dept) {
    STATE.currentDept = dept;
    const availableMetrics = DEPT_METRICS[dept] || ["General"];
    // Default to the first metric if not set or if switching depts
    if (!availableMetrics.includes(STATE.currentMetric)) {
        STATE.currentMetric = availableMetrics[0];
    }

    // Update sidebar active state
    renderSidebar();

    const content = document.getElementById('content');
    content.className = 'main-content fade-in';
    content.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4">
            <h2 class="mb-0"><i class="bi ${DEPT_ICONS[dept] || 'bi-speedometer2'} me-2 text-primary"></i>${dept.replace('_', ' ')} Dashboard</h2>
        </div>
        
        <!-- Submenu Navigation -->
        <div id="submenu-nav" class="d-flex gap-2 mb-4 flex-wrap">
            ${availableMetrics.map(metric => `
                <button class="metric-btn ${STATE.currentMetric === metric ? 'active' : ''}" 
                    onclick="loadMetricView('${metric}')">
                    ${metric}
                </button>
            `).join('')}
        </div>

        <div id="kpi-forms-container" class="mb-4"></div>
        <div id="records-table-container">
            <div class="card p-4">
                <div class="card-header d-flex flex-wrap gap-2 align-items-center justify-content-between">
                    <h5 class="mb-0"><i class="bi bi-table me-2"></i>Records: <span id="table-metric-title" class="text-primary">${STATE.currentMetric}</span></h5>
                    <div class="d-flex align-items-center gap-2">
                        <label class="form-label mb-0 fw-bold text-nowrap" style="font-size: 0.9rem;">Date Range:</label>
                        <input type="date" id="record-start-date" class="form-control form-control-sm" style="max-width: 130px; border-radius: 0.5rem;" onchange="loadRecentRecords('${dept}')">
                        <span class="text-muted text-nowrap" style="font-size: 0.9rem;">to</span>
                        <input type="date" id="record-end-date" class="form-control form-control-sm" style="max-width: 130px; border-radius: 0.5rem;" onchange="loadRecentRecords('${dept}')">
                        <button class="btn btn-sm btn-outline-secondary" style="border-radius: 0.5rem;" onclick="document.getElementById('record-start-date').value=''; document.getElementById('record-end-date').value=''; loadRecentRecords('${dept}');" title="Clear Filter"><i class="bi bi-x-lg"></i></button>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-primary dropdown-toggle d-flex align-items-center gap-1" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="border-radius: 0.5rem;">
                                <i class="bi bi-file-earmark-arrow-up"></i> Import
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow">
                                <li><a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="handleImportClick('${dept}', STATE.currentMetric); return false;"><i class="bi bi-upload"></i> Upload CSV</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="downloadImportTemplate('${dept}', STATE.currentMetric); return false;"><i class="bi bi-download"></i> Download Template</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table id="records-table" class="table table-striped table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Metric</th>
                                    <th>Daily Actual</th>
                                    <th>Daily Forecast</th>
                                    <th>Var %</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadMetricView(STATE.currentMetric);
};

// Helper to determine status emoji based on variance
window.getStatusEmoji = function (varianceStr) {
    if (!varianceStr || varianceStr === '-') return '';
    const cleanStr = varianceStr.toString().replace(/[%,\s]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return '';
    return num >= 0 ? '🙂' : '😟';
};

window.loadMetricView = function (metric) {
    STATE.currentView = 'dept';
    STATE.currentMetric = metric;

    // Update active button state with Bootstrap-friendly approach
    const buttons = document.querySelectorAll('#submenu-nav .metric-btn');
    buttons.forEach(btn => {
        if (btn.textContent.trim() === metric) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Dynamic Table Headers
    const tableHead = document.querySelector('#records-table thead tr');
    if (tableHead) {
        if (metric === "Fixed Inputs") {
            if (STATE.currentDept === "Geology") {
                tableHead.innerHTML = `
                    <th style="padding: 12px; text-align: left;">KPI</th>
                    <th style="padding: 12px; text-align: left;">Target Month</th>
                    <th style="padding: 12px; text-align: left;">Number of Days</th>
                    <th style="padding: 12px; text-align: left;">Full Forecast</th>
                    <th style="padding: 12px; text-align: left;">Full Budget</th>
                    <th style="padding: 12px; text-align: left;">Forecast Per Rig</th>
                `;
            } else {
                tableHead.innerHTML = `
                    <th style="padding: 12px; text-align: left;">KPI</th>
                    <th style="padding: 12px; text-align: left;">Target Month</th>
                    <th style="padding: 12px; text-align: left;">Number of Days</th>
                    <th style="padding: 12px; text-align: left;">Full Forecast</th>
                    <th style="padding: 12px; text-align: left;">Full Budget</th>
                `;
            }
        } else if (metric === "Exploration Drilling" || metric === "Grade Control Drilling") {
            const showRigs = metric === "Grade Control Drilling";
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                ${showRigs ? '<th style="padding: 12px; text-align: left;">Number of Rigs</th>' : ''}
            `;
        } else if (metric === "Toll") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual (Wet Tonnes)</th>
                <th style="padding: 12px; text-align: left;">Dry Tonnes</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if (metric === "Ore Mined") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if (metric === "Grade - Ore Mined") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(g/t)</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if (metric === "Total Material Moved") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(bcm)</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast(bcm)</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if (metric === "Blast Hole Drilling") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if (metric === "Grade - Ore Crushed") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(t)</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if (metric === "Ore Crushed") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if (metric === "Plant Feed Grade" && STATE.currentDept === "Milling_CIL") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(t)</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
            `;
        } else if ((metric === "Pumps" || metric === "Drill Rigs" || metric === "Light Vehicles" || metric === "Tipper Trucks" || metric === "Prime Excavators" || metric === "Anx Excavators" || metric === "Dump Trucks" || metric === "ART Dump Trucks" || metric === "Wheel Loaders" || metric === "Graders" || metric === "Dozers") && STATE.currentDept === "Engineering") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Qty Available</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(%)</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast(%)</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if ((metric === "Crusher" || metric === "Mill") && STATE.currentDept === "Engineering") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(%)</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast(%)</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if (metric === "Safety Incidents" || metric === "Environmental Incidents" || metric === "Property Damage" || metric === "Near Miss") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        } else if ((metric === "Gold Contained" || metric === "Gold Recovery" || metric === "Recovery" || metric === "Tonnes Treated") && STATE.currentDept === "Milling_CIL") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
            `;
        } else {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Metric</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            `;
        }
    }

    syncRouteHashFromState();

    document.getElementById('table-metric-title').textContent = metric;
    document.getElementById('kpi-forms-container').innerHTML = ''; // Clear previous form

    renderKPIForm(STATE.currentDept, metric);
    // In a real app we might filter loadRecentRecords by metric too
    loadRecentRecords(STATE.currentDept);
}

function renderKPIForm(dept, metricName) {
    const container = document.getElementById('kpi-forms-container');
    const card = document.createElement('div');
    card.className = 'card p-4';

    const title = document.createElement('h3');
    title.textContent = metricName;
    card.appendChild(title);

    // Differentiate form based on metric if needed
    if (metricName === "Fixed Inputs") {
        renderFixedInputForm(dept, card);
    } else if (dept === "Geology" && (metricName === "Exploration Drilling" || metricName === "Grade Control Drilling")) {
        renderGeologyDrillingForm(dept, metricName, card);
    } else if (dept === "Geology" && metricName === "Toll") {
        renderGeologyTollForm(dept, metricName, card);
    } else if (dept === "Mining" && metricName === "Ore Mined") {
        renderMiningOreForm(dept, metricName, card);
    } else if (dept === "Mining" && metricName === "Grade - Ore Mined") {
        renderMiningGradeForm(dept, metricName, card);
    } else if (dept === "Mining" && metricName === "Grade Rehandle") {
        renderMiningGradeRehandleForm(dept, metricName, card);
    } else if (dept === "Mining" && metricName === "Total Material Moved") {
        renderMiningMaterialForm(dept, metricName, card);
    } else if (dept === "Mining" && metricName === "Blast Hole Drilling") {
        renderMiningBlastHoleForm(dept, metricName, card);
    } else if (dept === "Crushing" && metricName === "Grade - Ore Crushed") {
        renderCrushingGradeForm(dept, metricName, card);
    } else if (dept === "Crushing" && metricName === "Ore Crushed") {
        renderCrushingOreForm(dept, metricName, card);
    } else if (dept === "Milling_CIL" && metricName === "Gold Contained") {
        renderMillingGoldContainedForm(dept, metricName, card);
    } else if (dept === "Milling_CIL" && metricName === "Gold Recovery") {
        renderMillingGoldRecoveryForm(dept, metricName, card);
    } else if (dept === "Milling_CIL" && metricName === "Recovery") {
        renderMillingRecoveryForm(dept, metricName, card);
    } else if (dept === "Milling_CIL" && metricName === "Plant Feed Grade") {
        renderMillingPlantFeedGradeForm(dept, metricName, card);
    } else if (dept === "Milling_CIL" && metricName === "Tonnes Treated") {
        renderMillingTonnesTreatedForm(dept, metricName, card);
    } else if (dept === "OHS" && (metricName === "Safety Incidents" || metricName === "Near Miss")) {
        renderOHSSafetyIncidentsForm(dept, metricName, card);
    } else if (dept === "OHS" && metricName === "Environmental Incidents") {
        renderOHSEnvironmentalIncidentsForm(dept, metricName, card);
    } else if (dept === "OHS" && metricName === "Property Damage") {
        renderOHSPropertyDamageForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Light Vehicles") {
        renderEngineeringLightVehiclesForm(dept, metricName, card);
    } else if (dept === "Engineering" && (metricName === "Tipper Trucks" || metricName === "Pumps" || metricName === "Drill Rigs")) {
        renderEngineeringTipperTrucksForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Prime Excavators") {
        renderEngineeringPrimeExcavatorsForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Anx Excavators") {
        renderEngineeringAnxExcavatorsForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Dump Trucks") {
        renderEngineeringDumpTrucksForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "ART Dump Trucks") {
        renderEngineeringArtDumpTrucksForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Wheel Loaders") {
        renderEngineeringWheelLoadersForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Graders") {
        renderEngineeringGradersForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Dozers") {
        renderEngineeringDozersForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Crusher") {
        renderEngineeringCrusherForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Mill") {
        renderEngineeringMillForm(dept, metricName, card);
    } else {
        renderStandardKPIForm(dept, metricName, card);
    }

    // Add comment input field to daily input forms (non-Fixed Inputs)
    if (metricName !== "Fixed Inputs") {
        const commentGroup = DOM.createInputGroup("Comment", "input-daily-comment", "text", "Add a comment...");
        const btnContainer = card.lastElementChild;
        if (btnContainer) {
            card.insertBefore(commentGroup.container, btnContainer);
        } else {
            card.appendChild(commentGroup.container);
        }
    }

    container.appendChild(card);
}

function renderFixedInputForm(dept, card) {
    // Use a table layout to align headers and inputs perfectly
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '20px';

    const isGeology = dept === 'Geology';
    const isOHS = dept === 'OHS';
    const colWidth = isGeology ? '16.66%' : '20%';

    // Helper to retrieve current options list (for saving)
    let getCurrentRigOptions = () => null;

    // Track whether to show Forecast Per Rig based on selected KPI
    let shouldShowForecastPerRig = () => {
        if (!isGeology) return false;
        const selectedKPI = selectKPI.value;
        // Hide for Exploration Drilling and Toll
        return selectedKPI !== 'Exploration Drilling' && selectedKPI !== 'Toll';
    };

    const thead = document.createElement('thead');
    let headerHTML = `
        <tr style="background-color: #f9fafb;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">KPI</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">Target Month</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">Number of Days</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">${isOHS ? 'Annual Target' : 'Full Budget'}</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">Full Forecast</th>
    `;

    if (isGeology) {
        headerHTML += `<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};" id="forecast-per-rig-header">Forecast Per Rig</th>`;
    }

    headerHTML += `</tr>`;
    thead.innerHTML = headerHTML;

    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');

    // Helper to create styled input cell
    const createCell = (element) => {
        const td = document.createElement('td');
        td.style.padding = '10px';
        element.style.width = '100%';
        element.style.padding = '8px';
        element.style.border = '1px solid #d1d5db';
        element.style.borderRadius = '6px';
        element.style.boxSizing = 'border-box';
        td.appendChild(element);
        return td;
    };

    // 1. KPI Select
    const selectKPI = document.createElement('select');
    selectKPI.id = `input-${dept}-fixed-kpi`;
    const metrics = (DEPT_METRICS[dept] || []).filter(m => m !== 'Fixed Inputs');
    if (metrics.length === 0) {
        const opt = document.createElement('option');
        opt.text = "General";
        selectKPI.add(opt);
    } else {
        metrics.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            selectKPI.appendChild(opt);
        });
    }
    tr.appendChild(createCell(selectKPI));

    // 2. Target Month
    const inputMonth = document.createElement('input');
    inputMonth.type = 'month';
    inputMonth.id = `input-${dept}-target-month`;

    // Auto-fill Number of Days when Month is selected or KPI is changed
    const updateDays = () => {
        const val = inputMonth.value;
        if (val) {
            const [year, month] = val.split('-').map(Number);
            // new Date(year, month, 0) gives the last day of the month
            const daysInMonth = new Date(year, month, 0).getDate();
            inputDays.value = daysInMonth;
        }
    };

    // Function to update Forecast Per Rig visibility
    const updateForecastPerRigVisibility = () => {
        if (!isGeology) return;

        const forecastPerRigCell = document.getElementById('forecast-per-rig-cell');
        const forecastPerRigHeader = document.getElementById('forecast-per-rig-header');
        const show = shouldShowForecastPerRig();

        if (forecastPerRigCell) {
            forecastPerRigCell.style.display = show ? '' : 'none';
        }
        if (forecastPerRigHeader) {
            forecastPerRigHeader.style.display = show ? '' : 'none';
        }
    };

    inputMonth.addEventListener('change', updateDays);
    selectKPI.addEventListener('change', () => {
        updateDays();
        updateForecastPerRigVisibility();
    });

    tr.appendChild(createCell(inputMonth));

    // 3. Num Days
    const inputDays = document.createElement('input');
    inputDays.type = 'number';
    inputDays.id = `input-${dept}-num-days`;
    tr.appendChild(createCell(inputDays));

    // 5. Budget
    const inputBudget = document.createElement('input');
    inputBudget.type = 'number';
    inputBudget.id = `input-${dept}-full-budget`;
    
    // 4. Forecast
    const inputForecast = document.createElement('input');
    inputForecast.type = 'number';
    inputForecast.id = `input-${dept}-full-forecast`;
    if (isOHS) {
        inputForecast.readOnly = true;
    }

    if (isOHS) {
        inputBudget.placeholder = "Enter Annual Target";
        inputBudget.addEventListener('input', () => {
            const annualTarget = parseFloat(inputBudget.value);
            if (!isNaN(annualTarget)) {
                inputForecast.value = (annualTarget / 12).toFixed(2);
            } else {
                inputForecast.value = '';
            }
        });
    }
    const budgetCell = createCell(inputBudget);
    tr.appendChild(budgetCell);
    tr.appendChild(createCell(inputForecast));

    // 6. Forecast Per Rig (Geology Only)
    if (isGeology) {
        const inputFcstRig = document.createElement('select');
        inputFcstRig.id = `input-${dept}-fcst-per-rig`;

        // Predefined options
        let currentOptions = [80, 150, 230, 300];

        const renderOptions = (selectedValue = null) => {
            inputFcstRig.innerHTML = '';

            // Sort
            const sorted = [...new Set(currentOptions)].sort((a, b) => a - b);

            sorted.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                if (parseFloat(val) === parseFloat(selectedValue)) {
                    opt.selected = true;
                }
                inputFcstRig.appendChild(opt);
            });

            // Add "Add New" option
            const addOpt = document.createElement('option');
            addOpt.value = '__ADD_NEW__';
            addOpt.textContent = '➕ Add new value...';
            addOpt.style.fontWeight = 'bold';
            addOpt.style.color = '#007bff';
            inputFcstRig.appendChild(addOpt);

            // If nothing selected and options exist, ensure one is selected visually
            if (!selectedValue && sorted.length > 0 && !inputFcstRig.value) {
                inputFcstRig.value = sorted[0];
            }
        };

        // Load options from DB
        const loadOptionsFromDB = async () => {
            try {
                // Fetch all records, then filter for fixed_inputs with available_rig_options
                const records = await fetchKPIRecords(dept);

                const withOptions = records.filter(r =>
                    r.subtype === 'fixed_input' &&
                    r.data &&
                    Array.isArray(r.data.available_rig_options) &&
                    r.data.available_rig_options.length > 0
                );

                if (withOptions.length > 0) {
                    // Sort by date DESC to get most recent
                    withOptions.sort((a, b) => new Date(b.date) - new Date(a.date));
                    const latest = withOptions[0];
                    currentOptions = latest.data.available_rig_options.map(Number);
                }

                renderOptions();
            } catch (e) {
                console.error("Failed to load rig options", e);
                // Fallback to defaults (already set)
                renderOptions();
            }
        };

        // Initial Load
        renderOptions();
        loadOptionsFromDB();

        // Change Event Listener for "Add New"
        inputFcstRig.addEventListener('change', () => {
            if (inputFcstRig.value === '__ADD_NEW__') {
                // Use a timeout to allow the option to render as selected briefly
                setTimeout(() => {
                    const newValStr = prompt("Enter new Forecast Per Rig value:");
                    if (newValStr) {
                        const newVal = parseFloat(newValStr);
                        if (!isNaN(newVal)) {
                            // Update current options
                            if (!currentOptions.includes(newVal)) {
                                currentOptions.push(newVal);
                            }
                            renderOptions(newVal);
                            DOM.showToast(`Added value: ${newVal}`, 'success');
                        } else {
                            DOM.showToast("Invalid number entered", "warning");
                            renderOptions(); // Reset
                        }
                    } else {
                        // Cancelled
                        renderOptions(); // Reset
                    }
                }, 10);
            }
        });

        // Update getter
        getCurrentRigOptions = () => currentOptions;

        const forecastPerRigCell = createCell(inputFcstRig);
        forecastPerRigCell.id = 'forecast-per-rig-cell';
        tr.appendChild(forecastPerRigCell);

        // Set initial visibility
        setTimeout(() => updateForecastPerRigVisibility(), 0);
    }

    tbody.appendChild(tr);
    table.appendChild(thead);
    table.appendChild(tbody);
    card.appendChild(table);

    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Fixed Input", async () => {
        const kpiVal = selectKPI.value;
        const monthVal = inputMonth.value;
        const daysVal = inputDays.value;
        const fcstVal = inputForecast.value;
        const budgVal = inputBudget.value;

        if (!kpiVal || !monthVal) {
            DOM.showToast("Please select KPI and Target Month", "error");
            return;
        }

        if (!daysVal || !fcstVal || !budgVal) {
            const fieldMsg = isOHS ? "Number of Days, Full Forecast, Annual Target" : "Number of Days, Full Forecast, Full Budget";
            DOM.showToast(`Please fill in all fields (${fieldMsg}) before saving.`, "error");
            return;
        }

        const dataPayload = {
            num_days: parseInt(daysVal) || 0,
            full_forecast: parseFloat(fcstVal.toString().replace(/,/g, '')) || 0,
            full_budget: parseFloat(budgVal.toString().replace(/,/g, '')) || 0
        };

        if (isOHS) {
            dataPayload.annual_target = dataPayload.full_budget;
        }

        if (isGeology) {
            // Only save forecast_per_rig if it should be shown for this KPI
            if (shouldShowForecastPerRig()) {
                const rigElem = document.getElementById(`input-${dept}-fcst-per-rig`);
                if (rigElem) {
                    dataPayload.forecast_per_rig = parseFloat(rigElem.value.replace(/,/g, '')) || 0;
                }

                // Save the list of options to persist them for next time
                const opts = getCurrentRigOptions();
                if (opts && Array.isArray(opts)) {
                    dataPayload.available_rig_options = opts;
                }
            }
        }

        const record = {
            date: `${monthVal}-01`,
            department: dept,
            metric_name: kpiVal,
            data: dataPayload,
            subtype: 'fixed_input'
        };

        try {
            await saveKPIRecord(dept, record);

            // Cascade update to daily records
            // Transform date YYYY-MM-DD -> YYYY-MM
            const cascadePayload = {
                metric_name: kpiVal,
                target_month: monthVal,
                full_forecast: dataPayload.full_forecast,
                full_budget: dataPayload.full_budget
            };

            if (isOHS) {
                cascadePayload.annual_target = dataPayload.full_budget;
            }

            if (isGeology && dataPayload.forecast_per_rig !== undefined) {
                cascadePayload.forecast_per_rig = dataPayload.forecast_per_rig;
            }

            try {
                const cascadeResult = await cascadeFixedInputUpdate(dept, cascadePayload);
                if (cascadeResult && cascadeResult.updated_count > 0) {
                    DOM.showToast(`Fixed Inputs saved. Updated ${cascadeResult.updated_count} daily records.`);
                } else {
                    DOM.showToast("Fixed Inputs saved successfully!");
                }
            } catch (cascadeErr) {
                console.error("Cascade update failed", cascadeErr);
                DOM.showToast("Fixed Inputs saved, but failed to update daily records.", "warning");
            }

            loadRecentRecords(dept);

            // Clear inputs
            inputDays.value = '';
            inputForecast.value = '';
            inputBudget.value = '';
            if (isGeology) {
                const rigElem = document.getElementById(`input-${dept}-fcst-per-rig`);
                if (rigElem) {
                    // Do not clear the list, but maybe reset selection
                    // But typically users might want to add another with same rig value?
                    // Let's just leave it or reset to first?
                    // resetting to blank or first is fine.
                    // Actually, if we clear it, 'value' becomes empty string.
                    // But it's a select.
                    // Let's just leave it or set to default (min value).
                    const opts = getCurrentRigOptions();
                    if (opts && opts.length) rigElem.value = Math.min(...opts);
                }
            }
        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save Fixed Inputs: " + e.message, "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderGeologyDrillingForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    let currentForecastPerRig = 0; // Store retrieved Fixed Input value
    let loadedForecastPerRigMonth = "";

    // Row 1
    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date(); // Keep empty by default

    const rigs = DOM.createInputGroup("Number of Rigs", `input-${dept}-rigs`, "number");
    if (metricName === "Exploration Drilling") {
        rigs.container.classList.add('kpi-hidden-field');
    }

    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");

    // Row 2
    let dFcst;
    if (metricName === "Exploration Drilling") {
        dFcst = DOM.createSelect("Daily Forecast", `input-${dept}-daily-fcst`, [
            { value: "80", label: "80" },
            { value: "150", label: "150" },
            { value: "230", label: "230" },
            { value: "300", label: "300" }
        ], "Select Daily Forecast...");
        dFcst.input = dFcst.select;

        // Dispatch 'input' event on change to trigger validation/MTD/outlook listeners
        dFcst.input.addEventListener('change', () => {
            dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    } else {
        dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    }

    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");

    // Row 3
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");

    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Auto-calculate MTD Actual and MTD Forecast for Exploration Drilling and Grade Control Drilling
    if (metricName === "Exploration Drilling" || metricName === "Grade Control Drilling") {
        const calculateMTD = async () => {
            const dateVal = date.input.value;
            const currentDailyActStr = dAct.input.value;
            const currentDailyAct = parseFloat(currentDailyActStr) || 0;

            const currentDailyFcstStr = dFcst.input.value;
            const currentDailyFcst = parseFloat(currentDailyFcstStr) || 0;

            if (!dateVal) {
                mAct.input.value = currentDailyAct;
                mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

                mFcst.input.value = currentDailyFcst;
                mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                return;
            }

            const d = new Date(dateVal);
            const year = d.getFullYear();
            const month = d.getMonth() + 1; // 1-based
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            // Get last day of the month to fetch full month context
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            try {
                // Fetch all records for the target month
                const records = await fetchKPIRecords(dept, startDate, endDate);

                const relevantRecords = records.filter(r =>
                    r.metric_name === metricName &&
                    r.date < dateVal && // Exclude current and future dates to avoid double counting
                    r.subtype !== 'fixed_input'
                );

                // Calculate MTD Actual
                const prevActSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_actual) || 0), 0);
                const totalMTDAct = prevActSum + currentDailyAct;
                mAct.input.value = totalMTDAct.toFixed(0);
                mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

                // Calculate MTD Forecast
                const prevFcstSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);
                const totalMTDFcst = prevFcstSum + currentDailyFcst;
                mFcst.input.value = totalMTDFcst.toFixed(0);
                mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

            } catch (e) {
                console.warn("Auto-calc MTD failed", e);
                mAct.input.value = currentDailyAct;
                mFcst.input.value = currentDailyFcst;
            }
        };

        dAct.input.addEventListener('input', calculateMTD);
        dFcst.input.addEventListener('input', calculateMTD); // Listen to Forecast input
        date.input.addEventListener('change', calculateMTD);
    }

    // Auto-fetch Fixed Inputs (Full Forecast/Budget)
    const fetchFixedInputs = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const [year, month] = dateVal.split('-').map(Number);
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        try {
            const records = await fetchKPIRecords(dept); // Fetch all (or filter by date range if optimized)
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                fullFcst.input.value = fixedRecord.data.full_forecast || 0;
                fullBudg.input.value = fixedRecord.data.full_budget || 0;

                // Store Forecast Per Rig for GC Drilling calculations
                currentForecastPerRig = parseFloat(fixedRecord.data.forecast_per_rig) || 0;
                loadedForecastPerRigMonth = targetMonth;

                // Trigger Grade Control Auto-Calc immediately if rigs are present
                if (metricName === 'Grade Control Drilling') {
                    calculateGradeControlDaily();
                }

                // Trigger variance calculation
                fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                // Clear if no record found
                fullFcst.input.value = '';
                fullBudg.input.value = '';
                currentForecastPerRig = 0;
                loadedForecastPerRigMonth = '';
            }
        } catch (e) {
            console.error("Error fetching fixed inputs", e);
        }
    };
    date.input.addEventListener('change', fetchFixedInputs);

    // Auto-Calc for Grade Control Drilling (Rigs * ForecastPerRig = Daily Actual)
    const calculateGradeControlDaily = async () => {
        if (metricName !== 'Grade Control Drilling') return;

        const dateVal = date.input.value;
        if (!dateVal) return;

        const [year, month] = dateVal.split('-').map(Number);
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        const rigsVal = parseFloat(rigs.input.value);
        if (isNaN(rigsVal)) return;

        if (loadedForecastPerRigMonth !== targetMonth) {
            try {
                const records = await fetchKPIRecords(dept);
                const fixedRecord = records.find(r =>
                    r.subtype === 'fixed_input' &&
                    r.metric_name === metricName &&
                    r.date === targetMonth
                );
                if (fixedRecord && fixedRecord.data) {
                    currentForecastPerRig = parseFloat(fixedRecord.data.forecast_per_rig) || 0;
                    loadedForecastPerRigMonth = targetMonth;
                } else {
                    currentForecastPerRig = 0;
                }
            } catch (e) {
                console.error("Error fetching fixed inputs for auto-calc", e);
            }
        }

        if (currentForecastPerRig > 0 && rigsVal >= 0) {
            // Instruction: Multiply matching ForecastPerRig by Rigs and put into Daily Forecast
            const calculatedVal = (rigsVal * currentForecastPerRig).toFixed(0);
            dFcst.input.value = calculatedVal;

            // Trigger variance update
            dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };
    rigs.input.addEventListener('input', calculateGradeControlDaily);

    // Auto-calculate Outlook (a)
    const calculateOutlook = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const currentDailyAct = parseFloat(dAct.input.value) || 0;
        const currentDailyFcst = parseFloat(dFcst.input.value) || 0;

        const d = new Date(dateVal);
        const day = d.getDate();

        let outlookVal = 0;

        if (day === 1) {
            // 1st of Month: (Daily Actual - Daily Forecast) + Full Forecast
            const currentFullFcst = parseFloat(fullFcst.input.value) || 0;
            outlookVal = (currentDailyAct - currentDailyFcst) + currentFullFcst;
        } else {
            // Subsequent Days: (Daily Actual - Daily Forecast) + Previous Outlook
            const prevDateObj = new Date(d);
            prevDateObj.setDate(d.getDate() - 1);
            const y = prevDateObj.getFullYear();
            const m = String(prevDateObj.getMonth() + 1).padStart(2, '0');
            const da = String(prevDateObj.getDate()).padStart(2, '0');
            const prevDateStr = `${y}-${m}-${da}`;

            try {
                // Ideally fetch specific record. Reusing department fetch for now (cached/optimized by browser usually)
                // For efficiency, a direct API call for single record would be better
                const records = await fetchKPIRecords(dept);
                const prevRecord = records.find(r =>
                    r.metric_name === metricName &&
                    r.subtype !== 'fixed_input' &&
                    r.date === prevDateStr
                );

                const prevOutlook = prevRecord && prevRecord.data ? (parseFloat(prevRecord.data.outlook) || 0) : 0;
                outlookVal = (currentDailyAct - currentDailyFcst) + prevOutlook;
            } catch (e) {
                console.warn("Error calculating outlook", e);
            }
        }

        outlook.input.value = outlookVal.toFixed(0);
        outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    dAct.input.addEventListener('input', calculateOutlook);
    dFcst.input.addEventListener('input', calculateOutlook);
    fullFcst.input.addEventListener('input', calculateOutlook); // Triggered by fetchFixedInputs
    date.input.addEventListener('change', calculateOutlook);


    // Add to Grid (order matters)
    add(date); add(rigs); add(dAct);
    add(dFcst); add(dVar); add(mAct);
    add(mFcst); add(mVar); add(outlook);
    add(fullFcst); add(fullBudg); add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { DOM.showToast("Please select a date", "error"); return; }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                num_rigs: parseFloat(rigs.input.value) || 0,
                daily_actual: parseFloat(dAct.input.value) || 0,
                daily_forecast: parseFloat(dFcst.input.value) || 0,
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value) || 0,
                mtd_forecast: parseFloat(mFcst.input.value) || 0,
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value) || 0,
                full_forecast: parseFloat(fullFcst.input.value) || 0,
                full_budget: parseFloat(fullBudg.input.value) || 0,
                var3: budgVar.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            date.input.value = '';
            rigs.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';

        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderGeologyTollForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date();

    const dryTonnes = DOM.createInputGroup("Dry Tonnes", `input-${dept}-wet-tonnes`, "number");
    dryTonnes.input.readOnly = true;

    const dAct = DOM.createInputGroup("Daily Actual (Wet Tonnes)", `input-${dept}-daily-act`, "number");

    // Auto-calculate Dry Tonnes from Daily Actual (Wet Tonnes) (Dry Tonnes = Daily Actual * 0.85)
    dAct.input.addEventListener('input', () => {
        const val = parseFloat(dAct.input.value) || 0;
        dryTonnes.input.value = (val * 0.85).toFixed(0);
        dryTonnes.input.dispatchEvent(new Event('input'));
    });

    // Row 2
    let dFcst;
    if (metricName === "Exploration Drilling") {
        dFcst = DOM.createSelect("Daily Forecast", `input-${dept}-daily-fcst`, [
            { value: "80", label: "80" },
            { value: "150", label: "150" },
            { value: "230", label: "230" },
            { value: "300", label: "300" }
        ], "Select Daily Forecast...");
        dFcst.input = dFcst.select;

        // Dispatch 'input' event on change to trigger validation/MTD/outlook listeners
        dFcst.input.addEventListener('change', () => {
            dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    } else {
        dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    }
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");

    // Row 3
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");

    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Auto-fetch Fixed Inputs and Calculate Daily Forecast
    const fetchAndCalculateForecast = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        // Days in month calculation
        const daysInMonth = new Date(year, month, 0).getDate();

        try {
            const records = await fetchKPIRecords(dept);
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                // Populate Full Budget (c) placeholder
                fullBudg.input.value = fixedRecord.data.full_budget || '';

                if (fixedRecord.data.full_forecast) {
                    const fullForecast = parseFloat(fixedRecord.data.full_forecast);
                    // Calculate Daily Forecast: Full Forecast / Days in Month
                    const dailyForecastVal = fullForecast / daysInMonth;
                    dFcst.input.value = dailyForecastVal.toFixed(0);

                    // Populate Full Forecast (b) placeholder
                    fullFcst.input.value = fixedRecord.data.full_forecast || '';
                } else {
                    dFcst.input.value = '';
                    fullFcst.input.value = '';
                }

                // Trigger variance calculation
                dFcst.input.dispatchEvent(new Event('input'));
                fullFcst.input.dispatchEvent(new Event('input')); // Updates Budget Variance
            } else {
                dFcst.input.value = '';
                fullFcst.input.value = '';
                fullBudg.input.value = '';
            }
        } catch (e) {
            console.error("Error fetching fixed inputs for Toll", e);
        }
    };
    date.input.addEventListener('change', fetchAndCalculateForecast);

    // Auto-calculate MTD Actual and MTD Forecast
    const calculateMTD = async () => {
        const dateVal = date.input.value;
        const currentDryTonnes = parseFloat(dryTonnes.input.value) || 0;
        const currentDailyFcst = parseFloat(dFcst.input.value) || 0;

        if (!dateVal) {
            mAct.input.value = currentDryTonnes;
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            mFcst.input.value = currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        try {
            const records = await fetchKPIRecords(dept, startDate, endDate);

            const relevantRecords = records.filter(r =>
                r.metric_name === metricName &&
                r.date < dateVal &&
                r.subtype !== 'fixed_input'
            );

            // Calculate MTD Actual using wet_tonnes (Dry Tonnes)
            const prevActSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.wet_tonnes) || 0), 0);
            const totalMTDAct = prevActSum + currentDryTonnes;
            mAct.input.value = totalMTDAct.toFixed(0);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            // Calculate MTD Forecast
            const prevFcstSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);
            const totalMTDFcst = prevFcstSum + currentDailyFcst;
            mFcst.input.value = totalMTDFcst.toFixed(0);
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.warn("Auto-calc MTD failed", e);
            mAct.input.value = currentDryTonnes;
            mFcst.input.value = currentDailyFcst;
        }
    };

    dryTonnes.input.addEventListener('input', calculateMTD);
    dFcst.input.addEventListener('input', calculateMTD);
    date.input.addEventListener('change', calculateMTD);

    // Row 4
    const grade = DOM.createInputGroup("Grade", `input-${dept}-grade`, "number");
    const grade7 = DOM.createInputGroup("Grade (Day - 7)", `input-${dept}-grade-7`, "number");

    // Auto-calculate Outlook (a) for Toll
    const calculateOutlook = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const currentDailyAct = parseFloat(dAct.input.value) || 0;
        const currentDailyFcst = parseFloat(dFcst.input.value) || 0;

        const d = new Date(dateVal);
        const day = d.getDate();

        let outlookVal = 0;

        if (day === 1) {
            // 1st of Month: (Daily Actual - Daily Forecast) + Full Forecast
            const currentFullFcst = parseFloat(fullFcst.input.value) || 0;
            outlookVal = (currentDailyAct - currentDailyFcst) + currentFullFcst;
        } else {
            // Subsequent Days: (Daily Actual - Daily Forecast) + Previous Outlook
            const prevDateObj = new Date(d);
            prevDateObj.setDate(d.getDate() - 1);
            const y = prevDateObj.getFullYear();
            const m = String(prevDateObj.getMonth() + 1).padStart(2, '0');
            const da = String(prevDateObj.getDate()).padStart(2, '0');
            const prevDateStr = `${y}-${m}-${da}`;

            try {
                const records = await fetchKPIRecords(dept); // Optimize if needed
                const prevRecord = records.find(r =>
                    r.date === prevDateStr &&
                    r.metric_name === metricName &&
                    r.subtype !== 'fixed_input'
                );

                // Check if it's the same month to ensure continuity (though date calc handles it, ensure logic doesn't grab prev month end if that's not desired.
                // However, "Subsequent days" usually implies within the same month for reporting periods, but visually it usually just looks back 1 day.
                // Given the prompt "check if the... month in the date placeholder matches", we should ensure strictly same month logic or just trust previous date.
                // "matches existing records... " - if day 2, we look for day 1.

                const prevOutlook = prevRecord ? (parseFloat(prevRecord.data.outlook) || 0) : 0;
                outlookVal = (currentDailyAct - currentDailyFcst) + prevOutlook;
            } catch (e) {
                console.warn("Error calculating outlook", e);
            }
        }

        outlook.input.value = outlookVal.toFixed(0);
        outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    dAct.input.addEventListener('input', calculateOutlook);
    dFcst.input.addEventListener('input', calculateOutlook);
    fullFcst.input.addEventListener('input', calculateOutlook); // Triggered by fixed inputs
    date.input.addEventListener('change', calculateOutlook);

    // Auto-calculate Grade (Day - 7)
    const calculateGrade7 = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const day = d.getDate();

        if (day <= 6) {
            grade7.input.value = 0;
        } else {
            // Pick record from (Day - 6)
            // e.g. Day 7 -> Day 1, Day 8 -> Day 2
            const targetDay = day - 6;

            const prevDateObj = new Date(d);
            prevDateObj.setDate(targetDay); // Sets day of month directly

            const y = prevDateObj.getFullYear();
            const m = String(prevDateObj.getMonth() + 1).padStart(2, '0');
            const da = String(prevDateObj.getDate()).padStart(2, '0');
            const targetDateStr = `${y}-${m}-${da}`;

            try {
                // We're looking for a specific single record.
                // Optimization: fetchKPIRecords(dept) might be cached or we can fetch specifics.
                // Assuming fetchKPIRecords fetches for dept.
                // We might want to pass start/end date for optimization if the list is huge,
                // but usually fine for monthly data.
                const records = await fetchKPIRecords(dept);

                const targetRecord = records.find(r =>
                    r.date === targetDateStr &&
                    r.metric_name === metricName &&
                    r.subtype !== 'fixed_input'
                );

                if (targetRecord && targetRecord.data && targetRecord.data.grade !== undefined) {
                    grade7.input.value = targetRecord.data.grade;
                } else {
                    grade7.input.value = 0;
                }

            } catch (e) {
                console.error("Error fetching Grade - 7 record", e);
                grade7.input.value = 0;
            }
        }
    };
    date.input.addEventListener('change', calculateGrade7);

    // Add to Grid
    add(date); add(dAct); add(dryTonnes);
    add(dFcst); add(dVar); add(mAct);
    add(mFcst); add(mVar); add(outlook);
    add(fullFcst); add(fullBudg); add(budgVar);
    
    // Hide grade and grade-7 input fields
    grade.container.style.display = 'none';
    grade7.container.style.display = 'none';
    add(grade); add(grade7);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { DOM.showToast("Please select a date", "error"); return; }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                wet_tonnes: parseFloat(dryTonnes.input.value) || 0,
                daily_actual: parseFloat(dAct.input.value) || 0,
                daily_forecast: parseFloat(dFcst.input.value) || 0,
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value) || 0,
                mtd_forecast: parseFloat(mFcst.input.value) || 0,
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value) || 0,
                full_forecast: parseFloat(fullFcst.input.value) || 0,
                full_budget: parseFloat(fullBudg.input.value) || 0,
                var3: budgVar.input.value,
                grade: parseFloat(grade.input.value) || 0,
                grade_7: parseFloat(grade7.input.value) || 0
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            // date.input.value = ''; // Keep date? Usually cleared or incremented. User said "date placeholder value should always be empty unless it is updated by uses"
            date.input.value = '';
            dryTonnes.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            grade.input.value = '';
            grade7.input.value = '';

        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMiningOreForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date();

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-calculate MTD Actual and MTD Forecast
    const calculateMTD = async () => {
        const dateVal = date.input.value;
        const currentDailyAct = parseFloat(dAct.input.value) || 0;
        const currentDailyFcst = parseFloat(dFcst.input.value) || 0;

        if (!dateVal) {
            mAct.input.value = currentDailyAct;
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            mFcst.input.value = currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        try {
            const records = await fetchKPIRecords(dept, startDate, endDate);

            const relevantRecords = records.filter(r =>
                r.metric_name === metricName &&
                r.date < dateVal &&
                r.subtype !== 'fixed_input'
            );

            // Calculate MTD Actual
            const prevActSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_actual) || 0), 0);
            const totalMTDAct = prevActSum + currentDailyAct;
            mAct.input.value = totalMTDAct.toFixed(0);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            // Calculate MTD Forecast
            const prevFcstSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);
            const totalMTDFcst = prevFcstSum + currentDailyFcst;
            mFcst.input.value = totalMTDFcst.toFixed(0);
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.warn("Auto-calc MTD failed", e);
            mAct.input.value = currentDailyAct;
            mFcst.input.value = currentDailyFcst;
        }
    };

    dAct.input.addEventListener('input', calculateMTD);
    dFcst.input.addEventListener('input', calculateMTD);
    date.input.addEventListener('change', calculateMTD);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Auto-calculate Outlook (a)
    const calculateOutlook = () => {
        const dateVal = date.input.value;
        const fullForecastVal = parseFloat(fullFcst.input.value) || 0;
        const mtdActualVal = parseFloat(mAct.input.value) || 0;

        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();

        // Days in Month
        const daysInMonth = new Date(year, month, 0).getDate();

        if (daysInMonth > 0) {
            // Step 1: Average per day = Full Forecast / Days in Month (Forecast Per Day)
            const dailyAverage = fullForecastVal / daysInMonth;

            // Step 2: Remaining Days = DaysInMonth - CurrentDay
            const remainingDays = daysInMonth - day;

            // Step 3: Remaining Forecast = RemainingDays * Average
            const remainingForecast = remainingDays * dailyAverage;

            // Step 4: Final Outlook = MTD Actual + Remaining Forecast
            const finalOutlook = mtdActualVal + remainingForecast;

            outlook.input.value = finalOutlook.toFixed(0);
            outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    // Attach listeners for Outlook calculation
    date.input.addEventListener('change', calculateOutlook);
    fullFcst.input.addEventListener('input', calculateOutlook);
    mAct.input.addEventListener('input', calculateOutlook); // MTD Act changes cause Outlook update

    // Auto-fetch Fixed Inputs (Full Forecast/Budget)
    const fetchFixedInputs = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        // Construct target month string YYYY-MM-01 (as stored in Fixed Input)
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                const fullForecastVal = parseFloat(fixedRecord.data.full_forecast) || 0;
                fullFcst.input.value = fixedRecord.data.full_forecast || '';
                fullBudg.input.value = fixedRecord.data.full_budget || '';

                // Calculate Daily Forecast: Full Forecast / Days in Month
                const daysInMonth = new Date(year, month, 0).getDate();
                if (daysInMonth > 0 && fullForecastVal > 0) {
                    dFcst.input.value = (fullForecastVal / daysInMonth).toFixed(0);
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Trigger variance calculation
                fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                // Clear if no record found
                fullFcst.input.value = '';
                fullBudg.input.value = '';
                dFcst.input.value = '';
            }
        } catch (e) {
            console.error("Error fetching fixed inputs", e);
        }
    };
    date.input.addEventListener('change', fetchFixedInputs);

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Add to Grid (3 cols)
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { DOM.showToast("Please select a date", "error"); return; }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: parseFloat(dAct.input.value) || 0,
                daily_forecast: parseFloat(dFcst.input.value) || 0,
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value) || 0,
                mtd_forecast: parseFloat(mFcst.input.value) || 0,
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value) || 0,
                full_forecast: parseFloat(fullFcst.input.value) || 0,
                full_budget: parseFloat(fullBudg.input.value) || 0,
                var3: budgVar.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            date.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMiningGradeForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date();

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dActGrade = DOM.createInputGroup("Daily Actual(g/t)", `input-${dept}-daily-act-gt`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dActGrade.input, dFcst.input, dVar.input);

    // Row 3 (3 cols to stretch) -> lets keep 4 col grid and use spacers or spans
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Auto-fetch Fixed Inputs
    const fetchFixedInputs = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                dFcst.input.value = fixedRecord.data.full_forecast || '';
                dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                // MTD Forecast for Grade matches Full Forecast (Target Grade)
                mFcst.input.value = fixedRecord.data.full_forecast || '';
                mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                if (!fullFcst.input.value) fullFcst.input.value = fixedRecord.data.full_forecast || '';
                if (!fullBudg.input.value) fullBudg.input.value = fixedRecord.data.full_budget || '';
            }
        } catch (e) {
            console.error("Error fetching fixed inputs", e);
        }
    };
    date.input.addEventListener('change', fetchFixedInputs);

    // Auto-Calculate MTD Actual (Weighted Average Formula)
    const calculateMTD = async () => {
        const dateVal = date.input.value;
        const currentDailyActGrade = parseFloat(dActGrade.input.value) || 0;
        const currentDailyForecast = parseFloat(dFcst.input.value) || 0;

        if (!dateVal) {
            mAct.input.value = currentDailyActGrade.toFixed(2);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        try {
            const records = await fetchKPIRecords(dept, startDate, endDate);

            // Filter: Same KPI, same Month (handled by startDate/endDate fetch range), exclude current day and fixed inputs
            const relevantRecords = records.filter(r =>
                r.metric_name === metricName &&
                r.date < dateVal &&
                r.subtype !== 'fixed_input'
            );

            // Numerator: SumProduct = Σ (DailyActualGrade * DailyForecast)
            let sumProduct = relevantRecords.reduce((sum, r) => {
                const rGrade = parseFloat(r.data.daily_act_grade) || 0; // Using daily_act_grade for Grade (g/t)
                const rFcst = parseFloat(r.data.daily_forecast) || 0; // Using daily_forecast
                return sum + (rGrade * rFcst);
            }, 0);

            // Add Current Day Product
            sumProduct += (currentDailyActGrade * currentDailyForecast);

            // Denominator: Sum = Σ (DailyForecast)
            let sumWeights = relevantRecords.reduce((sum, r) => {
                return sum + (parseFloat(r.data.daily_forecast) || 0);
            }, 0);

            // Add Current Day Weight
            sumWeights += currentDailyForecast;

            // Result
            if (sumWeights !== 0) {
                const weightedAvg = sumProduct / sumWeights;
                mAct.input.value = weightedAvg.toFixed(2);
            } else {
                mAct.input.value = 0;
            }
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.warn("Auto-calc MTD failed", e);
        }
    };

    dActGrade.input.addEventListener('input', calculateMTD);
    dFcst.input.addEventListener('input', calculateMTD);
    date.input.addEventListener('change', calculateMTD);

    // Auto-Calculate Outlook (Mirror MTD Actual)
    const calculateOutlook = () => {
        outlook.input.value = mAct.input.value;
        outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    mAct.input.addEventListener('input', calculateOutlook);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dAct); add(dActGrade); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(outlook); add(fullFcst); add(fullBudg); add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { DOM.showToast("Please select a date", "error"); return; }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: parseFloat(dAct.input.value) || 0,
                daily_act_grade: parseFloat(dActGrade.input.value) || 0,
                daily_forecast: parseFloat(dFcst.input.value) || 0,
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value) || 0,
                mtd_forecast: parseFloat(mFcst.input.value) || 0,
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value) || 0,
                full_forecast: parseFloat(fullFcst.input.value) || 0,
                full_budget: parseFloat(fullBudg.input.value) || 0,
                var3: budgVar.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dAct.input.value = '';
            dActGrade.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            // Date is usually kept or reset? Usually kept in other forms but let's clear for fresh entry or keep. 
            // Others clear it.
            date.input.value = '';
        } catch (e) {
            console.error("Save failed", e);
            DOM.showToast("Failed to save record", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMiningGradeRehandleForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual (t)", `input-${dept}-daily-act`, "number");
    const dActGrade = DOM.createInputGroup("Daily Actual (g/t)", `input-${dept}-daily-act-gt`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast (g/t)", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dActGrade.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Calculate MTD Actual (Weighted Average Formula using daily tonnes & daily grade)
    const calculateMTD = async () => {
        const dateVal = date.input.value;
        const currentDailyAct = parseFloat(dAct.input.value) || 0;
        const currentDailyActGrade = parseFloat(dActGrade.input.value) || 0;
        const currentDailyForecast = parseFloat(dFcst.input.value) || 0;

        if (!dateVal) {
            mAct.input.value = currentDailyActGrade.toFixed(2);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            mFcst.input.value = currentDailyForecast.toFixed(2);
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        try {
            const records = await fetchKPIRecords(dept, startDate, endDate);

            // Filter: Same KPI, same Month, exclude current day and fixed inputs
            const relevantRecords = records.filter(r =>
                r.metric_name === metricName &&
                r.date < dateVal &&
                r.subtype !== 'fixed_input'
            );

            // Numerator: SumProduct = Σ (DailyActualTonnes * DailyActualGrade)
            let sumProduct = relevantRecords.reduce((sum, r) => {
                const rTonnes = parseFloat(r.data.daily_actual) || 0;
                const rGrade = parseFloat(r.data.daily_act_grade) || 0;
                return sum + (rTonnes * rGrade);
            }, 0);

            // Add Current Day Product
            sumProduct += (currentDailyAct * currentDailyActGrade);

            // Denominator: Sum = Σ (DailyActualTonnes)
            let sumWeights = relevantRecords.reduce((sum, r) => {
                return sum + (parseFloat(r.data.daily_actual) || 0);
            }, 0);

            // Add Current Day Weight
            sumWeights += currentDailyAct;

            // Result
            if (sumWeights !== 0) {
                const weightedAvg = sumProduct / sumWeights;
                mAct.input.value = weightedAvg.toFixed(2);
            } else {
                mAct.input.value = (0).toFixed(2);
            }
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            // MTD Forecast is simply the daily forecast for the day (e.g. current day's daily forecast)
            mFcst.input.value = currentDailyForecast.toFixed(2);
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.warn("Auto-calc MTD failed", e);
        }
    };

    dAct.input.addEventListener('input', calculateMTD);
    dActGrade.input.addEventListener('input', calculateMTD);
    dFcst.input.addEventListener('input', calculateMTD);
    date.input.addEventListener('change', calculateMTD);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dAct); add(dActGrade); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { DOM.showToast("Please select a date", "error"); return; }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: parseFloat(dAct.input.value) || 0,
                daily_act_grade: parseFloat(dActGrade.input.value) || 0,
                daily_forecast: parseFloat(dFcst.input.value) || 0,
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value) || 0,
                mtd_forecast: parseFloat(mFcst.input.value) || 0,
                var2: mVar.input.value,
                outlook: "-",
                full_forecast: "-",
                full_budget: "-",
                var3: "-"
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dAct.input.value = '';
            dActGrade.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            date.input.value = '';
        } catch (e) {
            console.error("Save failed", e);
            DOM.showToast("Failed to save record", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMiningMaterialForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date();

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual(bcm)", `input-${dept}-daily-act-bcm`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast(bcm)", `input-${dept}-daily-fcst-bcm`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Calculate MTD Actual (Sum of previous records in month + current daily actual)
    // AND MTD Forecast (Sum of previous records in month + current daily forecast)
    const calculateMTD = async () => {
        const dateVal = date.input.value;
        const currentDailyAct = parseFloat(dAct.input.value) || 0;
        const currentDailyFcst = parseFloat(dFcst.input.value) || 0;

        if (!dateVal) {
            mAct.input.value = currentDailyAct;
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            mFcst.input.value = currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        try {
            const records = await fetchKPIRecords(dept);

            // Filter: Same KPI, same Month (handled by startDate/endDate fetch range), exclude current day and fixed inputs
            const relevantRecords = records.filter(r =>
                r.metric_name === metricName &&
                r.date < dateVal &&
                r.subtype !== 'fixed_input' &&
                r.date >= startDate && r.date <= endDate
            );

            // MTD Actual Calculation
            const prevActSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_actual) || 0), 0);
            const totalMTDAct = prevActSum + currentDailyAct;
            mAct.input.value = totalMTDAct.toFixed(0);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            // MTD Forecast Calculation
            const prevFcstSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);
            const totalMTDFcst = prevFcstSum + currentDailyFcst;
            mFcst.input.value = totalMTDFcst.toFixed(0);
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

            // Trigger variance for MTD
            mVar.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.warn("Auto-calc MTD failed", e);
            mAct.input.value = currentDailyAct;
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            mFcst.input.value = currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    dAct.input.addEventListener('input', calculateMTD);
    // Trigger Recalculation when Daily Forecast changes (e.g. autofill)
    dFcst.input.addEventListener('input', calculateMTD);
    date.input.addEventListener('change', calculateMTD);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullFcst.input, budgVar.input);

    // Auto-fetch Fixed Inputs (Full Forecast) and Calculate Daily Forecast
    const fetchFixedInputs = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        // Construct target month string YYYY-MM-01 (as stored in Fixed Input)
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                const fullForecastVal = parseFloat(fixedRecord.data.full_forecast) || 0;
                fullFcst.input.value = fixedRecord.data.full_forecast || '';
                fullBudg.input.value = fixedRecord.data.full_budget || '';

                // Calculate Daily Forecast: Full Forecast / Days in Month
                const daysInMonth = new Date(year, month, 0).getDate();
                if (daysInMonth > 0 && fullForecastVal > 0) {
                    dFcst.input.value = (fullForecastVal / daysInMonth).toFixed(0);
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Trigger variance calculation
                fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } catch (e) {
            console.error("Error fetching fixed inputs", e);
        }
    };
    date.input.addEventListener('change', fetchFixedInputs);

    // Auto-Calculate Outlook: MTD Act + ( (Full Forecast / Days in Month) * Remaining Days )
    const calculateOutlook = () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const mtdActVal = parseFloat(mAct.input.value) || 0;
        const fullForecastVal = parseFloat(fullFcst.input.value) || 0;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        const currentDay = d.getDate();
        const remainingDays = daysInMonth - currentDay;

        if (daysInMonth > 0 && remainingDays >= 0) {
            // "divide the value in Full Forecast by the number of days in a month... then multiple remaining days by Results"
            const dailyRate = fullForecastVal / daysInMonth;
            const remainderForecast = dailyRate * remainingDays;

            // "then add the final results to the value in MTD Actual placeholder"
            const outlookVal = mtdActVal + remainderForecast;

            outlook.input.value = outlookVal.toFixed(0);
            outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    mAct.input.addEventListener('input', calculateOutlook);
    fullFcst.input.addEventListener('input', calculateOutlook); // Trigger when Full Forecast loads
    date.input.addEventListener('change', calculateOutlook);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date", "error");
            return;
        }

        const val = (input) => input.value.replace(/,/g, '');
        const num = (input) => parseFloat(val(input)) || 0;
        const str = (input) => val(input);

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: num(dAct.input),
                daily_forecast: num(dFcst.input),
                daily_var: str(dVar.input),
                mtd_actual: num(mAct.input),
                mtd_forecast: num(mFcst.input),
                mtd_var: str(mVar.input),
                outlook: num(outlook.input),
                full_forecast: num(fullFcst.input),
                full_budget: num(fullBudg.input),
                budget_var: str(budgVar.input)
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully");
            // Refresh the table if it's currently showing this department
            if (typeof loadRecentRecords === 'function') {
                loadRecentRecords(dept);
            }

            // Clear inputs except KPI
            date.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';

        } catch (e) {
            console.error("Save failed", e);
            DOM.showToast("Failed to save record", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMiningBlastHoleForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date();

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Calculate MTD Actual (Sum of previous records in month + current daily actual)
    // AND MTD Forecast (Sum of previous records in month + current daily forecast)
    const calculateMTD = async () => {
        const dateVal = date.input.value;
        const currentDailyAct = parseFloat(dAct.input.value) || 0;
        const currentDailyFcst = parseFloat(dFcst.input.value) || 0;

        if (!dateVal) {
            mAct.input.value = currentDailyAct;
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            mFcst.input.value = currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        try {
            const records = await fetchKPIRecords(dept);

            // Filter: Same KPI, same Month (handled by startDate/endDate fetch range), exclude current day and fixed inputs
            const relevantRecords = records.filter(r =>
                r.metric_name === metricName &&
                r.date < dateVal &&
                r.subtype !== 'fixed_input' &&
                r.date >= startDate && r.date <= endDate
            );

            // MTD Actual Calculation
            const prevActSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_actual) || 0), 0);
            const totalMTDAct = prevActSum + currentDailyAct;
            mAct.input.value = totalMTDAct.toFixed(0);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            // MTD Forecast Calculation
            const prevFcstSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);
            const totalMTDFcst = prevFcstSum + currentDailyFcst;
            mFcst.input.value = totalMTDFcst.toFixed(0);
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.warn("Auto-calc MTD failed", e);
            mAct.input.value = currentDailyAct;
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            mFcst.input.value = currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    dAct.input.addEventListener('input', calculateMTD);
    dFcst.input.addEventListener('input', calculateMTD);
    date.input.addEventListener('change', calculateMTD);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Auto-fetch Fixed Inputs (Full Forecast)
    const fetchFixedInputs = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        // Construct target month string YYYY-MM-01 (as stored in Fixed Input)
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                fullFcst.input.value = fixedRecord.data.full_forecast || '';
                fullBudg.input.value = fixedRecord.data.full_budget || '';

                // Trigger variance calculation
                fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } catch (e) {
            console.error("Error fetching fixed inputs", e);
        }
    };
    date.input.addEventListener('change', fetchFixedInputs);

    // Auto-Calculate Outlook (a) - Specific Formula
    const calculateOutlook = () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const mtdActVal = parseFloat(mAct.input.value) || 0;
        const fullFcstVal = parseFloat(fullFcst.input.value) || 0;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        const currentDay = d.getDate();

        // "deduct the day in the date placeholder from number of days in a month as remaining days"
        const remainingDays = daysInMonth - currentDay;

        if (remainingDays > 0) {
            // "deduct the value in MTD Actual... from Full Forecast as results"
            const results = fullFcstVal - mtdActVal;

            // "divide the results by the remaining days"
            const output = results / remainingDays;

            // "add the output to the value in MTD Actual"
            const finalVal = output + mtdActVal;

            outlook.input.value = finalVal.toFixed(0);
            outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // Fallback for last day of month
            outlook.input.value = mtdActVal.toFixed(0);
            outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    mAct.input.addEventListener('input', calculateOutlook);
    fullFcst.input.addEventListener('input', calculateOutlook);
    date.input.addEventListener('change', calculateOutlook);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        const dailyActVal = parseFloat(dAct.input.value);
        const dailyFcstVal = parseFloat(dFcst.input.value);

        if (!dateVal) {
            DOM.showToast("Please select a date", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: dailyActVal,
                daily_forecast: dailyFcstVal,
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value),
                mtd_forecast: parseFloat(mFcst.input.value),
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value),
                full_forecast: parseFloat(fullFcst.input.value),
                full_budget: parseFloat(fullBudg.input.value),
                var3: budgVar.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            date.input.value = '';

        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderCrushingGradeForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date();

    // Row 2
    const dActT = DOM.createInputGroup("Daily Actual(t)", `input-${dept}-daily-act-t`, "number");
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullFcst.input, budgVar.input);

    // Auto-fetch Fixed Inputs for Daily Forecast (and Full Forecast/Budget)
    const fetchFixedInputs = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        // Construct target month string YYYY-MM-01 (as stored in Fixed Input)
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                // User Request: Daily Forecast is manual now.

                // Also populate Full Forecast/Budget for reference/outlook calc
                fullFcst.input.value = fixedRecord.data.full_forecast || '';
                fullBudg.input.value = fixedRecord.data.full_budget || '';
                fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } catch (e) {
            console.error("Error fetching fixed inputs", e);
        }
    };
    date.input.addEventListener('change', fetchFixedInputs);

    // Auto-Calculate MTD Actual (Sum of previous records in month + current daily actual)
    // AND MTD Forecast (Sum of previous records in month + current daily forecast)
    const calculateMTD = async () => {
        const dateVal = date.input.value;
        const currentDailyAct = parseFloat(dAct.input.value) || 0;
        const currentDailyFcst = parseFloat(dFcst.input.value) || 0;

        if (!dateVal) {
            mAct.input.value = currentDailyAct;
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            mFcst.input.value = currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        try {
            const records = await fetchKPIRecords(dept);

            // Filter: Same KPI, same Month (handled by startDate/endDate fetch range), exclude current day and fixed inputs
            const relevantRecords = records.filter(r =>
                r.metric_name === metricName &&
                r.date < dateVal &&
                r.subtype !== 'fixed_input' &&
                r.date >= startDate && r.date <= endDate
            );

            // MTD Actual Calculation (Weighted Average: SumProduct(DailyAct * DailyFcst) / Sum(DailyFcst))
            // Only using Daily Forecast as weight based on user request "add all the values in Daily Forecast column to the value in Daily Forecast placeholder... let called is sum"

            let numerator = 0;
            let denominator = 0;

            relevantRecords.forEach(r => {
                const rAct = parseFloat(r.data.daily_actual) || 0;
                const rFcst = parseFloat(r.data.daily_forecast) || 0;
                numerator += (rAct * rFcst);
                denominator += rFcst;
            });

            // Add current inputs
            numerator += (currentDailyAct * currentDailyFcst);
            denominator += currentDailyFcst;

            const totalMTDAct = (denominator !== 0) ? (numerator / denominator) : 0;

            mAct.input.value = totalMTDAct.toFixed(2);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            // MTD Forecast Calculation - MANUAL now
            // const prevFcstSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);
            // const totalMTDFcst = prevFcstSum + currentDailyFcst;
            // mFcst.input.value = totalMTDFcst.toFixed(2);
            // mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.warn("Auto-calc MTD failed", e);
            // Fallback: Weighted calc with just current values
            const denom = currentDailyFcst;
            const num = currentDailyAct * currentDailyFcst;
            const res = denom !== 0 ? num / denom : 0;

            mAct.input.value = res.toFixed(2);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            // mFcst.input.value = currentDailyFcst;
            // mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    dAct.input.addEventListener('input', calculateMTD);
    dFcst.input.addEventListener('input', calculateMTD);
    date.input.addEventListener('change', calculateMTD);

    // Auto-Calculate Outlook (mirror MTD Actual)
    const calculateOutlook = () => {
        outlook.input.value = mAct.input.value;
        outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    mAct.input.addEventListener('input', calculateOutlook);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dActT); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(outlook); add(fullFcst); add(fullBudg); add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        const dailyActTVal = parseFloat(dActT.input.value);
        const dailyActVal = parseFloat(dAct.input.value); // Grade
        const dailyFcstVal = parseFloat(dFcst.input.value);

        if (!dateVal) {
            DOM.showToast("Please select a date", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_act_tonnes: dailyActTVal, // Tonnage
                daily_actual: dailyActVal, // Grade
                daily_forecast: dailyFcstVal,
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value),
                mtd_forecast: parseFloat(mFcst.input.value),
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value),
                full_forecast: parseFloat(fullFcst.input.value),
                full_budget: parseFloat(fullBudg.input.value),
                var3: budgVar.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dActT.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            date.input.value = '';

        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderCrushingOreForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date();

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Auto-fetch Fixed Inputs and Calculate Daily Forecast
    let priorMtdSum = 0;
    let priorMtdFcstSum = 0;

    const updateMTD = () => {
        const currentDaily = parseFloat(dAct.input.value) || 0;
        const currentMtdAct = priorMtdSum + currentDaily;
        mAct.input.value = currentMtdAct.toFixed(0);
        mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        const currentDailyFcst = parseFloat(dFcst.input.value) || 0;
        mFcst.input.value = (priorMtdFcstSum + currentDailyFcst).toFixed(0);
        mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        // Outlook Calculation (Run Rate)
        // Logic: Outlook = MTD + (MTD * (RemainingDays / CurrentDay))
        const dateVal = date.input.value;
        if (dateVal) {
            const d = new Date(dateVal);
            const totalDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const currentDay = d.getDate();

            if (currentDay > 0) {
                const remainingDays = totalDays - currentDay;
                const ratio = remainingDays / currentDay;
                const adjustment = ratio * currentMtdAct;
                const calculatedOutlook = adjustment + currentMtdAct;

                outlook.input.value = calculatedOutlook.toFixed(0);
                outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    };

    const fetchFixedInputs = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        // Construct target month string YYYY-MM-01 (as stored in Fixed Input)
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        // Get number of days in the month
        const daysInMonth = new Date(year, month, 0).getDate();

        try {
            const records = await fetchKPIRecords(dept);
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                // "get it corresponding value on Full Forecast column and divide it by the number of days in month in date placeholder"
                const fullForecastVal = parseFloat(fixedRecord.data.full_forecast) || 0;

                // "and divide it by the number of days in month in date placeholder"
                if (daysInMonth > 0) {
                    const calculatedDailyFcst = fullForecastVal / daysInMonth;
                    dFcst.input.value = calculatedDailyFcst.toFixed(0);
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Also populate Full placeholders
                fullFcst.input.value = fixedRecord.data.full_forecast || '';
                fullBudg.input.value = fixedRecord.data.full_budget || '';
                fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // MTD Calculation
            // Filter records for same month/year, excluding current date
            const historicRecords = records.filter(r => {
                if (r.metric_name !== metricName) return false;
                if (!r.data || (r.data.daily_actual === undefined && r.data.daily_forecast === undefined)) return false;
                if (r.subtype === 'fixed_input') return false;

                const rd = new Date(r.date);
                return rd.getFullYear() === year &&
                    (rd.getMonth() + 1) === month &&
                    r.date < dateVal;
            });

            priorMtdSum = historicRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_actual) || 0), 0);
            priorMtdFcstSum = historicRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);
            updateMTD();

        } catch (e) {
            console.error("Error fetching fixed inputs", e);
        }
    };
    date.input.addEventListener('change', fetchFixedInputs);
    dAct.input.addEventListener('input', updateMTD);
    dFcst.input.addEventListener('input', updateMTD);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        try {
            if (!date.input.value) throw new Error("Please select a date");

            const record = {
                subtype: 'daily_input',
                department: dept,
                metric_name: metricName,
                date: date.input.value,
                data: {
                    daily_actual: dAct.input.value,
                    daily_forecast: dFcst.input.value,
                    mtd_actual: mAct.input.value,
                    mtd_forecast: mFcst.input.value,
                    outlook: outlook.input.value,
                    full_forecast: fullFcst.input.value,
                    full_budget: fullBudg.input.value,
                    var1: dVar.input.value,
                    var2: mVar.input.value,
                    var3: budgVar.input.value
                }
            };

            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully", "success");
            loadRecentRecords(dept);

            // Clear inputs
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            date.input.value = '';

        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save: " + e.message, "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMillingGoldContainedForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullFcst.input, budgVar.input);

    const day2 = DOM.createInputGroup("Day-2", `input-${dept}-day2`, "number");

    // Logic Variables
    let priorMtdAct = 0;
    let priorMtdFcst = 0;

    const updateCalculations = () => {
        const curDAct = parseFloat(dAct.input.value) || 0;
        const curDFcst = parseFloat(dFcst.input.value) || 0;

        // MTD Actual = History Sum + Current Daily
        const currentMtdAct = priorMtdAct + curDAct;
        mAct.input.value = currentMtdAct.toFixed(0);
        mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        // MTD Forecast = History Sum + Current Forecast
        mFcst.input.value = (priorMtdFcst + curDFcst).toFixed(0);
        mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        // Outlook Logic
        const dateVal = date.input.value;
        if (dateVal) {
            const d = new Date(dateVal);
            const totalDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const currentDay = d.getDate();

            if (currentDay > 0) {
                const remainingDays = totalDays - currentDay;
                const ratio = remainingDays / currentDay;
                const adjustment = ratio * currentMtdAct;
                const finalVal = adjustment + currentMtdAct;

                outlook.input.value = finalVal.toFixed(0);
                outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    };

    const handleDateChange = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        try {
            const records = await fetchKPIRecords(dept);

            // 1. Calculate History Sums (excluding current date)
            const historicRecords = records.filter(r => {
                if (r.metric_name !== metricName || r.subtype === 'fixed_input') return false;
                if (!r.data) return false;

                const rd = new Date(r.date);
                return rd.getFullYear() === year &&
                    (rd.getMonth() + 1) === month &&
                    r.date < dateVal;
            });

            priorMtdAct = historicRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_actual) || 0), 0);
            priorMtdFcst = historicRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);

            // 2. Fetch Full Forecast/Budget from Fixed Inputs
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                // fullFcst.input.value = fixedRecord.data.full_forecast || ''; // User requested manual input for Full Forecast
                fullBudg.input.value = fixedRecord.data.full_budget || '';
                // Trigger events
                // fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // 3. Calculate Day-2 Value
            if (d.getDate() === 1) {
                day2.input.value = 0;
            } else {
                // Find previous date logic
                const prevDate = new Date(d);
                prevDate.setDate(d.getDate() - 1);

                const pY = prevDate.getFullYear();
                const pM = String(prevDate.getMonth() + 1).padStart(2, '0');
                const pD = String(prevDate.getDate()).padStart(2, '0');
                const prevDateStr = `${pY}-${pM}-${pD}`;

                const prevRecord = records.find(r =>
                    r.metric_name === metricName &&
                    r.subtype !== 'fixed_input' &&
                    r.date === prevDateStr
                );

                if (prevRecord && prevRecord.data) {
                    day2.input.value = prevRecord.data.daily_actual || 0;
                } else {
                    day2.input.value = 0;
                }
            }

            // Run calculations
            updateCalculations();

        } catch (e) {
            console.error("Error fetching context for Gold Contained", e);
        }
    };

    date.input.addEventListener('change', handleDateChange);
    dAct.input.addEventListener('input', updateCalculations);
    dFcst.input.addEventListener('input', updateCalculations);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar); add(day2);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: parseFloat(dAct.input.value),
                daily_forecast: parseFloat(dFcst.input.value),
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value),
                mtd_forecast: parseFloat(mFcst.input.value),
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value),
                full_forecast: parseFloat(fullFcst.input.value),
                full_budget: parseFloat(fullBudg.input.value),
                var3: budgVar.input.value,
                day2: parseFloat(day2.input.value)
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            date.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            day2.input.value = '';

            // Reset logic variables
            priorMtdAct = 0;
            priorMtdFcst = 0;

        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save: " + e.message, "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMillingGoldRecoveryForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    // attachVarianceListener(outlook.input, fullBudg.input, budgVar.input); // Custom logic implemented in updateCalculations

    const day2 = DOM.createInputGroup("Day-2", `input-${dept}-day2`, "number");

    // Logic State
    let priorMtdAct = 0;
    let priorMtdFcst = 0;

    const updateCalculations = () => {
        const curDAct = parseFloat(dAct.input.value) || 0;
        const curDFcst = parseFloat(dFcst.input.value) || 0;

        // Logic: Prior Month Sum + Current Daily
        // Only if we found records. If not (priorMtdAct is 0), it just equals Daily Actual (plus 0).
        const finalMtd = priorMtdAct + curDAct;
        mAct.input.value = finalMtd.toFixed(0);
        mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        const finalMtdFcst = priorMtdFcst + curDFcst;
        mFcst.input.value = finalMtdFcst.toFixed(0);
        mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        // Outlook Logic
        let currentOutlook = 0;
        const dateVal = date.input.value;
        if (dateVal) {
            const d = new Date(dateVal);
            const totalDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const currentDay = d.getDate();

            if (currentDay > 0) {
                const remainingDays = totalDays - currentDay;
                const ratio = remainingDays / currentDay;
                const adjustment = ratio * finalMtd;
                const finalVal = adjustment + finalMtd;

                currentOutlook = finalVal;
                outlook.input.value = finalVal.toFixed(0);
                outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        // Outlook Variance: (Outlook - Full Forecast) / Full Forecast * 100
        const fFcstVal = parseFloat(fullFcst.input.value);
        if (fFcstVal && fFcstVal !== 0 && currentOutlook !== 0) {
            const varVal = ((currentOutlook - fFcstVal) / fFcstVal) * 100;
            budgVar.input.value = varVal.toFixed(0) + '%';
        } else {
            budgVar.input.value = '';
        }
    };

    const handleDateChange = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        try {
            const records = await fetchKPIRecords(dept);

            // Filter for: Same Metric, Same Month/Year, NOT Same Date (exclude self/current input)
            const historicRecords = records.filter(r => {
                if (r.metric_name !== metricName || r.subtype === 'fixed_input') return false;
                if (!r.data) return false;

                const rd = new Date(r.date);
                return rd.getFullYear() === year &&
                    (rd.getMonth() + 1) === month &&
                    r.date < dateVal;
            });

            priorMtdAct = historicRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_actual) || 0), 0);
            priorMtdFcst = historicRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);

            // Fetch Full Budget from Fixed Inputs
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                fullBudg.input.value = fixedRecord.data.full_budget || '';
                fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // 3. Calculate Day-2 Value
            if (d.getDate() === 1) {
                day2.input.value = 0;
            } else {
                // Find previous date logic
                const prevDate = new Date(d);
                prevDate.setDate(d.getDate() - 1);

                const pY = prevDate.getFullYear();
                const pM = String(prevDate.getMonth() + 1).padStart(2, '0');
                const pD = String(prevDate.getDate()).padStart(2, '0');
                const prevDateStr = `${pY}-${pM}-${pD}`;

                const prevRecord = records.find(r =>
                    r.metric_name === metricName &&
                    r.subtype !== 'fixed_input' &&
                    r.date === prevDateStr
                );

                if (prevRecord && prevRecord.data) {
                    day2.input.value = prevRecord.data.daily_actual || 0;
                } else {
                    day2.input.value = 0;
                }
            }

            updateCalculations();

        } catch (e) {
            console.error("Error fetching context for Gold Recovery", e);
        }
    };

    date.input.addEventListener('change', handleDateChange);
    dAct.input.addEventListener('input', updateCalculations);
    dFcst.input.addEventListener('input', updateCalculations);
    fullFcst.input.addEventListener('input', updateCalculations);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar); add(day2);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: parseFloat(dAct.input.value),
                daily_forecast: parseFloat(dFcst.input.value),
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value),
                mtd_forecast: parseFloat(mFcst.input.value),
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value),
                full_forecast: parseFloat(fullFcst.input.value),
                full_budget: parseFloat(fullBudg.input.value),
                var3: budgVar.input.value,
                day2: parseFloat(day2.input.value)
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            date.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            day2.input.value = '';

            // Reset Logic
            priorMtdAct = 0;

        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save: " + e.message, "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMillingRecoveryForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "text");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "text");

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    const day2 = DOM.createInputGroup("Day-2", `input-${dept}-day2`, "number");

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar); add(day2);

    // Logic: Calculate Outlook from Gold Recovery & Gold Contained
    // Also mirror Daily Forecast to MTD Forecast

    // Listener for Daily Forecast mirroring
    dFcst.input.addEventListener('input', () => {
        mFcst.input.value = dFcst.input.value;
        mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const handleDateChange = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const targetMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        try {
            const records = await fetchKPIRecords(dept);

            // Helper for date comparison (handle potential timestamps)
            const isSameDate = (rDate, target) => {
                if (!rDate) return false;
                return rDate === target || rDate.startsWith(target);
            };

            // Fetch Full Forecast from Fixed Inputs
            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetMonth
            );

            if (fixedRecord && fixedRecord.data) {
                const ff = fixedRecord.data.full_forecast;
                fullFcst.input.value = (ff !== undefined && ff !== null && ff !== '') ? ff + '%' : '';
                fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                const fb = fixedRecord.data.full_budget;
                fullBudg.input.value = (fb !== undefined && fb !== null && fb !== '') ? fb + '%' : '';
                fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Find Gold Recovery Record for this date (exclude fixed_inputs which share the 1st of month date)
            const grRecord = records.find(r =>
                r.metric_name === 'Gold Recovery' &&
                r.subtype !== 'fixed_input' &&
                isSameDate(r.date, dateVal)
            );

            // Find Gold Contained Record for this date
            const gcRecord = records.find(r =>
                r.metric_name === 'Gold Contained' &&
                r.subtype !== 'fixed_input' &&
                isSameDate(r.date, dateVal)
            );

            console.log("Outlook Calc Debug:", { dateVal, grRecord, gcRecord });

            if (grRecord && gcRecord && grRecord.data && gcRecord.data) {
                const grMtd = parseFloat(grRecord.data.mtd_actual) || 0;
                const gcMtd = parseFloat(gcRecord.data.mtd_actual) || 0;

                if (gcMtd !== 0) {
                    // (Gold Recovery / Gold Contained) * 100
                    const result = (grMtd / gcMtd) * 100;
                    const formattedResult = result.toFixed(2);

                    outlook.input.value = formattedResult + '%';
                    // Mirror to MTD Actual (numeric value for input type="number" if strict, but let's check input type)
                    // mAct is initialized as "number". So we should pass the raw number.
                    // But Recovery is usually displayed as %. 
                    // If input type is number, it won't take "95.42%".
                    // If we derived it, we should probably set the numeric value.

                    mAct.input.value = formattedResult; // input type="number" from definition

                    // Trigger change for listeners
                    outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
                    mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    outlook.input.value = '';
                    mAct.input.value = '';
                }
            } else {
                outlook.input.value = '';
                mAct.input.value = '';
            }

            // 3. Calculate Day-2 Value (Metric: Recovery)
            if (d.getDate() === 1) {
                day2.input.value = 0;
            } else {
                // Find previous date logic
                const prevDate = new Date(d);
                prevDate.setDate(d.getDate() - 1);

                const pY = prevDate.getFullYear();
                const pM = String(prevDate.getMonth() + 1).padStart(2, '0');
                const pD = String(prevDate.getDate()).padStart(2, '0');
                const prevDateStr = `${pY}-${pM}-${pD}`;

                // Look for previous record of THIS metric (Recovery)
                const prevRecord = records.find(r =>
                    r.metric_name === metricName &&
                    r.subtype !== 'fixed_input' &&
                    isSameDate(r.date, prevDateStr)
                );

                if (prevRecord && prevRecord.data) {
                    day2.input.value = prevRecord.data.daily_actual || 0;
                } else {
                    day2.input.value = 0;
                }
            }

        } catch (e) {
            console.error("Error fetching dependencies for Recovery:", e);
        }
    };

    date.input.addEventListener('change', handleDateChange);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { DOM.showToast("Please select a date", "error"); return; }

        const record = {
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: parseFloat(dAct.input.value),
                daily_forecast: parseFloat(dFcst.input.value),
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value),
                mtd_forecast: parseFloat(mFcst.input.value),
                var2: mVar.input.value,
                // store output as string or number? usually DB stores number/string. 
                // Since it's a percentage display, saving strict number might be better for backend, 
                // but front end showed %. I'll parseFloat it to store number.
                outlook: parseFloat(outlook.input.value),
                full_forecast: parseFloat(fullFcst.input.value),
                full_budget: parseFloat(fullBudg.input.value),
                var3: budgVar.input.value,
                day2: parseFloat(day2.input.value)
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved!");
            loadRecentRecords(dept);

            // Clear
            date.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            day2.input.value = '';

        } catch (e) {
            DOM.showToast("Error: " + e.message, "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMillingPlantFeedGradeForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dActT = DOM.createInputGroup("Daily Actual(t)", `input-${dept}-daily-act-t`, "number");
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    const day2 = DOM.createInputGroup("Day-2", `input-${dept}-day2`, "number");

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dActT); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(outlook); add(fullFcst); add(fullBudg); add(budgVar);
    add(day2);

    card.appendChild(grid);

    // ================== LOGIC INJECTION START ==================
    // 1. Fetch Full Forecast (b) from Fixed Inputs when Date changes
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        // Extract "YYYY-MM" to match Fixed Inputs "Target Month" (which defaults to full YYYY-MM-DD string with "-01")
        // Fixed Input logic in this app usually stores full dates like '2023-10-01'.
        const d = new Date(dateVal);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const targetMonthStr = `${y}-${m}-01`;

        try {
            // We need to search the 'fixed_inputs' for a matching record
            // Since Fixed Inputs are often just records with subtype='fixed_input', we check that.
            const records = await fetchKPIRecords(dept);

            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName && // 'Plant Feed Grade'
                r.date === targetMonthStr
            );

            if (fixedRecord && fixedRecord.data) {
                if (fixedRecord.data.full_forecast !== undefined) {
                    fullFcst.input.value = fixedRecord.data.full_forecast;
                    // Dispatch input event to trigger any variance listeners
                    fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (fixedRecord.data.full_budget !== undefined) {
                    fullBudg.input.value = fixedRecord.data.full_budget;
                    fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } else {
                fullFcst.input.value = ''; // Clear if not found
                fullBudg.input.value = '';
            }

        } catch (err) {
            console.error("Error fetching fixed inputs for Plant Feed Grade:", err);
        }
    });

    // Also clear if date is cleared
    date.input.addEventListener('input', () => {
        if (!date.input.value) {
            fullFcst.input.value = '';
            fullBudg.input.value = '';
        }
    });

    // 2. MTD Actual Calculation (Weighted Average)
    // Formula: Sum(Daily Actual * Daily Forecast) / Sum(Daily Actual)
    const calculateMTD = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const curValAct = parseFloat(dAct.input.value) || 0;
        const curValFcst = parseFloat(dFcst.input.value) || 0;

        // If current inputs are empty/zero, should we calculate? 
        // User says "add all values... to value in placeholder". If placeholder is empty, add 0.

        const d = new Date(dateVal);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const monthPrefix = `${y}-${m}`;

        try {
            const records = await fetchKPIRecords(dept);

            // Filter: Same Metric, Not Fixed, Same Month, NOT Current Day (to avoid double count if editing)
            const monthRecords = records.filter(r =>
                r.metric_name === metricName &&
                r.subtype !== 'fixed_input' &&
                r.date && r.date.startsWith(monthPrefix) &&
                r.date < dateVal
            );

            let numerator = 0;
            let denominator = 0;

            monthRecords.forEach(r => {
                const da = parseFloat(r.data.daily_actual) || 0;
                const df = parseFloat(r.data.daily_forecast) || 0;

                // "Multiple them... then add to result"
                const product = da * df;
                numerator += product;

                // "add all values in Daily Actual column"
                denominator += da;
            });

            // Add current inputs
            numerator += (curValAct * curValFcst);
            denominator += curValAct;

            if (denominator !== 0) {
                // "final results will semi results/sum"
                const res = numerator / denominator;
                mAct.input.value = res.toFixed(2);
                mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                mAct.input.value = 0;
            }

        } catch (e) {
            console.error("MTD Calc Error:", e);
        }
    };

    // Trigger calculation on inputs
    dAct.input.addEventListener('input', calculateMTD);
    dFcst.input.addEventListener('input', calculateMTD);
    date.input.addEventListener('change', calculateMTD);

    // Mirror MTD Actual to Outlook
    mAct.input.addEventListener('input', () => {
        outlook.input.value = mAct.input.value;
        outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // 3. Day-2 Logic Calculation
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);

        if (d.getDate() === 1) {
            day2.input.value = 0;
            return;
        }

        // Get previous day
        const prev = new Date(d);
        prev.setDate(d.getDate() - 1);
        const y = prev.getFullYear();
        const m = String(prev.getMonth() + 1).padStart(2, '0');
        const day = String(prev.getDate()).padStart(2, '0');
        const prevDateStr = `${y}-${m}-${day}`;

        try {
            const records = await fetchKPIRecords(dept);
            const prevRecord = records.find(r =>
                r.metric_name === metricName &&
                r.subtype !== 'fixed_input' &&
                r.date === prevDateStr
            );

            if (prevRecord && prevRecord.data) {
                day2.input.value = prevRecord.data.daily_actual || 0;
            } else {
                day2.input.value = 0;
            }

        } catch (e) {
            console.error("Day-2 Calc Error:", e);
        }
    });

    // ================== LOGIC INJECTION END ==================

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { DOM.showToast("Please select a date", "error"); return; }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_act_tonnes: parseFloat(dActT.input.value),
                daily_actual: parseFloat(dAct.input.value),
                daily_forecast: parseFloat(dFcst.input.value),
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value),
                mtd_forecast: parseFloat(mFcst.input.value),
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value),
                full_forecast: parseFloat(fullFcst.input.value),
                full_budget: parseFloat(fullBudg.input.value),
                var3: budgVar.input.value,
                day2: parseFloat(day2.input.value)
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved!");
            loadRecentRecords(dept);

            // Clear form? Or keep values? Usually clear or reset standard daily fields.
            // Clearing helps prevent double entry.
            date.input.value = '';
            dActT.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            day2.input.value = '';

        } catch (e) {
            DOM.showToast("Error: " + e.message, "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMillingTonnesTreatedForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    const day2 = DOM.createInputGroup("Day-2", `input-${dept}-day2`, "number");

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar); add(day2);

    card.appendChild(grid);

    // ================== LOGIC INJECTION START ==================
    // 1. Fetch Fixed Inputs for Calculation (Daily Forecast) and Auto-fill
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const targetMonthStr = `${y}-${m}-01`;

        try {
            const records = await fetchKPIRecords(dept);

            const fixedRecord = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName && // 'Tonnes Treated'
                r.date === targetMonthStr
            );

            if (fixedRecord && fixedRecord.data) {
                // Populate Full Forecast and Budget
                const ff = fixedRecord.data.full_forecast;
                const fb = fixedRecord.data.full_budget;
                const days = fixedRecord.data.num_days;

                if (ff !== undefined) {
                    fullFcst.input.value = ff;
                    fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                }
                if (fb !== undefined) {
                    fullBudg.input.value = fb;
                    fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Calculate Daily Forecast: Full Forecast / Days
                // "divide Full Forecast column value by Days column value, run to whole number"
                if (ff && days && days > 0) {
                    const calculatedDailyFcst = Math.round(ff / days);
                    dFcst.input.value = calculatedDailyFcst;
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    // Could not calc
                    dFcst.input.value = '';
                }

            } else {
                fullFcst.input.value = '';
                fullBudg.input.value = '';
                dFcst.input.value = '';
            }

        } catch (err) {
            console.error("Error fetching fixed inputs for Tonnes Treated:", err);
        }
    });

    // Clear on date clear
    date.input.addEventListener('input', () => {
        if (!date.input.value) {
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            dFcst.input.value = '';
        }
    });

    // 2. MTD Actual & Forecast Calculation (Sum)
    const calculateMTD = async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const curValAct = parseFloat(dAct.input.value) || 0;
        const curValFcst = parseFloat(dFcst.input.value) || 0;

        const d = new Date(dateVal);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const monthPrefix = `${y}-${m}`;

        try {
            const records = await fetchKPIRecords(dept);

            // Filter: Same Metric, Not Fixed, Same Month, NOT Current Day
            const monthRecords = records.filter(r =>
                r.metric_name === metricName &&
                r.subtype !== 'fixed_input' &&
                r.date && r.date.startsWith(monthPrefix) &&
                r.date < dateVal
            );

            let sumAct = 0;
            let sumFcst = 0;

            monthRecords.forEach(r => {
                const da = parseFloat(r.data.daily_actual) || 0;
                sumAct += da;

                const df = parseFloat(r.data.daily_forecast) || 0;
                sumFcst += df;
            });

            // Add current inputs
            sumAct += curValAct;
            sumFcst += curValFcst;

            // Round to whole numbers
            mAct.input.value = Math.round(sumAct);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            mFcst.input.value = Math.round(sumFcst);
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.error("MTD Calc Error:", e);
        }
    };

    // Trigger calculation
    dAct.input.addEventListener('input', calculateMTD);
    dFcst.input.addEventListener('input', calculateMTD);
    date.input.addEventListener('change', calculateMTD);

    // 3. Outlook Calculation (Linear Projection)
    // Formula: ( (TotalDays - CurrentDay) / CurrentDay ) * MTD_Actual + MTD_Actual
    const calculateOutlook = () => {
        const dateVal = date.input.value;
        const mtdVal = parseFloat(mAct.input.value);

        if (!dateVal || isNaN(mtdVal)) return;

        const d = new Date(dateVal);
        const currentDay = d.getDate();

        // Get total days in current month (day 0 of next month)
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const totalDays = new Date(year, month, 0).getDate();

        if (currentDay > 0) {
            const remainingDays = totalDays - currentDay;
            const ratio = remainingDays / currentDay;
            const adjustment = ratio * mtdVal;
            const result = adjustment + mtdVal;

            outlook.input.value = Math.round(result);
            outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    // Listen to MTD Actual changes (which cascade from Daily Actual)
    mAct.input.addEventListener('input', calculateOutlook);
    // Also re-calc if date changes (though date change triggers MTD calc which triggers this anyway)
    date.input.addEventListener('change', calculateOutlook);

    // 4. Day-2 Logic Calculation
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);

        if (d.getDate() === 1) {
            day2.input.value = 0;
            return;
        }

        // Get previous day
        const prev = new Date(d);
        prev.setDate(d.getDate() - 1);
        const y = prev.getFullYear();
        const m = String(prev.getMonth() + 1).padStart(2, '0');
        const day = String(prev.getDate()).padStart(2, '0');
        const prevDateStr = `${y}-${m}-${day}`;

        try {
            const records = await fetchKPIRecords(dept);
            const prevRecord = records.find(r =>
                r.metric_name === metricName &&
                r.subtype !== 'fixed_input' &&
                r.date === prevDateStr
            );

            if (prevRecord && prevRecord.data) {
                day2.input.value = prevRecord.data.daily_actual || 0;
            } else {
                day2.input.value = 0;
            }

        } catch (e) {
            console.error("Day-2 Calc Error:", e);
        }
    });

    // ================== LOGIC INJECTION END ==================

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { DOM.showToast("Please select a date", "error"); return; }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: parseFloat(dAct.input.value),
                daily_forecast: parseFloat(dFcst.input.value),
                var1: dVar.input.value,
                mtd_actual: parseFloat(mAct.input.value),
                mtd_forecast: parseFloat(mFcst.input.value),
                var2: mVar.input.value,
                outlook: parseFloat(outlook.input.value),
                full_forecast: parseFloat(fullFcst.input.value),
                full_budget: parseFloat(fullBudg.input.value),
                var3: budgVar.input.value,
                day2: parseFloat(day2.input.value)
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved!");
            loadRecentRecords(dept);

            // Clear form
            date.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
            day2.input.value = '';

        } catch (e) {
            DOM.showToast("Error: " + e.message, "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderOHSSafetyIncidentsForm(dept, metricName, card) {
    const formContainer = document.createElement('div');
    formContainer.className = 'mb-4';

    const createRow = () => {
        const row = document.createElement('div');
        row.className = 'row gx-3';
        return row;
    };

    const addToRow = (row, group, colClass = 'col-md-4') => {
        group.container.classList.add(...colClass.split(' '));
        row.appendChild(group.container);
    };

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = ''; // Ensure empty by default

    // Custom Variance Logic: (Forecast - Actual) / Forecast for "Lower is Better"
    const updateSafetyVariance = (actInput, fcstInput, varInput, useActDenom = false) => {
        let act = parseFloat(actInput.value);
        let fcst = parseFloat(fcstInput.value);

        if (isNaN(act) || isNaN(fcst)) {
            varInput.value = '';
            return;
        }

        act = Math.ceil(act);
        fcst = Math.ceil(fcst);

        if (useActDenom) {
            if (act === 0) {
                varInput.value = '0%';
                return;
            }
            const variance = ((fcst - act) / act) * 100;
            varInput.value = Math.round(variance) + '%';
        } else {
            if (fcst === 0) {
                if (act === 0) varInput.value = '0%';
                else varInput.value = '-100%'; // Any incidents against 0 forecast is bad
                return;
            }

            // Favorable if Actual < Forecast
            const variance = ((fcst - act) / fcst) * 100;
            varInput.value = Math.round(variance) + '%';
        }
    };

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    dFcst.input.value = '';
    // dFcst.input.readOnly = true; 
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;

    dAct.input.addEventListener('input', () => updateSafetyVariance(dAct.input, dFcst.input, dVar.input, true));
    dFcst.input.addEventListener('input', () => updateSafetyVariance(dAct.input, dFcst.input, dVar.input, true));

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    mFcst.input.value = '';
    mFcst.input.readOnly = true;
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;

    // Use same logic for MTD
    mAct.input.addEventListener('input', () => updateSafetyVariance(mAct.input, mFcst.input, mVar.input, true));
    mFcst.input.addEventListener('input', () => updateSafetyVariance(mAct.input, mFcst.input, mVar.input, true));

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    fullFcst.input.value = '';
    fullFcst.input.readOnly = true;

    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    fullBudg.input.value = '';
    fullBudg.input.readOnly = true;

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");

    // OHS Budget variance is Outlook vs Monthly Forecast (Full Forecast)
    outlook.input.addEventListener('input', () => updateSafetyVariance(outlook.input, fullFcst.input, budgVar.input, true));
    fullFcst.input.addEventListener('input', () => updateSafetyVariance(outlook.input, fullFcst.input, budgVar.input, true));

    // Add to Form Container
    // Row 1: KPI (Hidden) + Date
    const row1 = createRow();
    addToRow(row1, kpi, 'd-none');
    addToRow(row1, date, 'col-md-4');
    formContainer.appendChild(row1);

    // Row 2: Daily
    const row2 = createRow();
    addToRow(row2, dAct, 'col-md-4');
    addToRow(row2, dFcst, 'col-md-4');
    addToRow(row2, dVar, 'col-md-4');
    formContainer.appendChild(row2);

    // Row 3: MTD
    const row3 = createRow();
    addToRow(row3, mAct, 'col-md-4');
    addToRow(row3, mFcst, 'col-md-4');
    addToRow(row3, mVar, 'col-md-4');
    formContainer.appendChild(row3);

    // Row 4: Outlook
    const row4 = createRow();
    addToRow(row4, outlook, 'col-md-3');
    addToRow(row4, fullFcst, 'col-md-3');
    addToRow(row4, fullBudg, 'col-md-3');
    addToRow(row4, budgVar, 'col-md-3');
    row4.style.display = 'none';
    formContainer.appendChild(row4);

    card.appendChild(formContainer);

    // ================== LOGIC INJECTION START ==================
    let priorMtdSum = 0;

    const calculateSafetyOutlook = () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        const d = new Date(dateVal);
        const totalDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const currentDay = d.getDate();

        // "deduct current day from number of days in a month to get remaining days"
        // Example: Jan 1. Total 31. Remaining = 31 - 1 = 30.
        const remainingDays = totalDays - currentDay;

        const mtdVal = parseFloat(mAct.input.value) || 0;
        const fullFcstVal = parseFloat(fullFcst.input.value) || 0;

        // "deduct the value in MTD Actual placeholder from the value in Full Forecast (b) placeholder"
        const diff = fullFcstVal - mtdVal;

        // "divide the diference by the remaining days to get Daily increment"
        let dailyIncrement = 0;
        if (remainingDays > 0) {
            dailyIncrement = diff / remainingDays;
        }

        // "add Daily increment value to MTD Actual placeholder value to get final value"
        const finalVal = mtdVal + dailyIncrement;

        // "run to whole number"
        outlook.input.value = Math.round(finalVal);
        outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const calculateSafetyMTD = () => {
        const cur = parseFloat(dAct.input.value) || 0;
        const total = priorMtdSum + cur;
        mAct.input.value = Math.round(total);
        mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
        // Chain Outlook Calculation
        calculateSafetyOutlook();
    };

    // Trigger Outlook when Full Forecast changes manually
    fullFcst.input.addEventListener('input', calculateSafetyOutlook);
    // Also trigger when MTD Actual changes (handled via calculateSafetyMTD usually, but listener ensures safety)
    mAct.input.addEventListener('input', calculateSafetyOutlook);

    // 1. Daily Forecast is always 0 (Target = Zero Harm)
    // Run this logic on date change to ensure consistency
    date.input.addEventListener('change', async () => {
        dFcst.input.value = '';
        dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        // MTD Logic
        const dateVal = date.input.value;
        if (!dateVal) return;

        try {
            // Fetch records
            const records = await fetchKPIRecords(dept);
            const d = new Date(dateVal);
            const targetY = d.getFullYear();
            const targetM = d.getMonth();

            // Filter
            const history = records.filter(r => {
                if (r.metric_name !== metricName) return false; // KPI Match
                if (r.subtype === 'fixed_input') return false;

                const rd = new Date(r.date);
                return rd.getFullYear() === targetY &&
                    rd.getMonth() === targetM &&
                    r.date < dateVal; // Exclude current and future dates
            });

            // Sum corresponding Daily Actuals
            priorMtdSum = history.reduce((sum, r) => sum + (parseFloat(r.data.daily_actual) || 0), 0);

            // Recalculate
            calculateSafetyMTD();

            // ================= LOOKUP FIXED INPUT FOR MTD FORECAST =================
            const targetMonthStr = `${targetY}-${String(targetM + 1).padStart(2, '0')}`;
            const targetDateStr = `${targetMonthStr}-01`;

            const fixedInput = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName &&
                r.date === targetDateStr
            );

            if (fixedInput && fixedInput.data && (fixedInput.data.annual_target !== undefined || fixedInput.data.full_budget !== undefined || fixedInput.data.full_forecast !== undefined)) {
                const annualTarget = parseFloat(fixedInput.data.annual_target) || parseFloat(fixedInput.data.full_budget) || 0;
                const mtdFcstVal = annualTarget / 12;
                mFcst.input.value = mtdFcstVal % 1 ? mtdFcstVal.toFixed(2) : mtdFcstVal;
                fullFcst.input.value = mtdFcstVal % 1 ? mtdFcstVal.toFixed(2) : mtdFcstVal;
                fullBudg.input.value = annualTarget;
            } else {
                mFcst.input.value = '';
                fullFcst.input.value = '';
                fullBudg.input.value = '';
            }
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
            // ================= END LOOKUP =================

        } catch (e) {
            console.error("Error fetching safety history", e);
            priorMtdSum = 0; // Fallback
            calculateSafetyMTD();
        }
    });

    // Also trigger MTD update when Daily Actual changes
    dAct.input.addEventListener('input', () => {
        // updateSafetyVariance() is already attached in the main section above
        calculateSafetyMTD();
    });
    // ================== LOGIC INJECTION END ==================

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { DOM.showToast("Please select a date", "error"); return; }

        const payload = {
            daily_actual: parseFloat(dAct.input.value) || 0,
            daily_forecast: parseFloat(dFcst.input.value) || 0,
            var1: dVar.input.value,
            mtd_actual: parseFloat(mAct.input.value) || 0,
            mtd_forecast: parseFloat(mFcst.input.value) || 0,
            var2: mVar.input.value,
            outlook: parseFloat(outlook.input.value) || 0,
            full_forecast: parseFloat(fullFcst.input.value) || 0,
            full_budget: parseFloat(fullBudg.input.value) || 0,
            annual_target: parseFloat(fullBudg.input.value) || 0,
            var3: budgVar.input.value
        };

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: payload
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully");
            loadRecentRecords(dept);

            // Clear inputs (except KPI)
            date.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = ''; // Default
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = ''; // Default
            fullBudg.input.value = ''; // Default
            budgVar.input.value = '';

            // Reset internal state
            priorMtdSum = 0;

        } catch (e) {
            console.error(e);
            DOM.showToast("Error saving: " + e.message, "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderOHSEnvironmentalIncidentsForm(dept, metricName, card) {
    console.log("Initializing Environmental Incidents Form (v2 - Fixed MTD Logic)");
    const formContainer = document.createElement('div');
    formContainer.className = 'mb-4';

    const createRow = () => {
        const row = document.createElement('div');
        row.className = 'row gx-3';
        return row;
    };

    const addToRow = (row, group, colClass = 'col-md-4') => {
        group.container.classList.add(...colClass.split(' '));
        row.appendChild(group.container);
    };

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    dFcst.input.value = ''; // Default 0

    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;

    // Custom Variance Logic: (Forecast - Actual) / Forecast for "Lower is Better"
    const updateEnvVariance = (actInput, fcstInput, varInput, useActDenom = false) => {
        let act = parseFloat(actInput.value);
        let fcst = parseFloat(fcstInput.value);

        if (isNaN(act) || isNaN(fcst)) {
            varInput.value = '';
            return;
        }

        act = Math.ceil(act);
        fcst = Math.ceil(fcst);

        if (useActDenom) {
            if (act === 0) {
                varInput.value = '0%';
                return;
            }
            const variance = ((fcst - act) / act) * 100;
            varInput.value = Math.round(variance) + '%';
        } else {
            if (fcst === 0) {
                if (act === 0) varInput.value = '0%';
                else varInput.value = '-100%'; // Any incidents against 0 forecast is bad
                return;
            }

            // Favorable if Actual < Forecast
            const variance = ((fcst - act) / fcst) * 100;
            varInput.value = Math.round(variance) + '%';
        }
    };

    dAct.input.addEventListener('input', () => updateEnvVariance(dAct.input, dFcst.input, dVar.input, true));
    dFcst.input.addEventListener('input', () => updateEnvVariance(dAct.input, dFcst.input, dVar.input, true));
    // attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;

    mAct.input.addEventListener('input', () => updateEnvVariance(mAct.input, mFcst.input, mVar.input, true));
    mFcst.input.addEventListener('input', () => updateEnvVariance(mAct.input, mFcst.input, mVar.input, true));
    // attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    fullFcst.input.value = ''; // Default to 0
    fullFcst.input.readOnly = true;
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    fullBudg.input.value = ''; // Default to 0
    fullBudg.input.readOnly = true;

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;

    // Custom logic for Outlook Variance: compare Outlook vs monthly target (Full Forecast)
    outlook.input.addEventListener('input', () => updateEnvVariance(outlook.input, fullFcst.input, budgVar.input, true));
    fullFcst.input.addEventListener('input', () => updateEnvVariance(outlook.input, fullFcst.input, budgVar.input, true));
    // attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Add to Form Container
    // Row 1: KPI (Hidden) + Date
    const row1 = createRow();
    addToRow(row1, kpi, 'd-none');
    addToRow(row1, date, 'col-md-4');
    formContainer.appendChild(row1);

    // Row 2: Daily
    const row2 = createRow();
    addToRow(row2, dAct, 'col-md-4');
    addToRow(row2, dFcst, 'col-md-4');
    addToRow(row2, dVar, 'col-md-4');
    formContainer.appendChild(row2);

    // Row 3: MTD
    const row3 = createRow();
    addToRow(row3, mAct, 'col-md-4');
    addToRow(row3, mFcst, 'col-md-4');
    addToRow(row3, mVar, 'col-md-4');
    formContainer.appendChild(row3);

    // Row 4: Outlook
    const row4 = createRow();
    addToRow(row4, outlook, 'col-md-3');
    addToRow(row4, fullFcst, 'col-md-3');
    addToRow(row4, fullBudg, 'col-md-3');
    addToRow(row4, budgVar, 'col-md-3');
    formContainer.appendChild(row4);

    card.appendChild(formContainer);

    // MTD Calculation Logic
    const calculateEnvMTD = async () => {
        const dt = date.input.value;
        const currentDailyAct = parseFloat(dAct.input.value) || 0;
        const currentDailyFcst = parseFloat(dFcst.input.value) || 0;
        const kpiName = kpi.input.value;

        if (!dt) {
            mAct.input.value = currentDailyAct;
            mAct.input.dispatchEvent(new Event('input'));

            // If no date, MTD Forecast mirrors Daily Forecast
            mFcst.input.value = currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input'));
            return;
        }

        const dateObj = new Date(dt);
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth();

        try {
            const records = await fetchKPIRecords(dept); // Ensure department is correct match

            // 1. Calculate MTD Actual
            const previousSumActual = records
                .filter(r => r.metric_name === kpiName)
                .filter(r => {
                    const rDate = new Date(r.date);
                    return rDate.getFullYear() === y &&
                        rDate.getMonth() === m &&
                        rDate < dateObj;
                })
                .reduce((sum, r) => {
                    const val = r.data ? (parseFloat(r.data.daily_actual) || 0) : 0;
                    return sum + val;
                }, 0);

            mAct.input.value = previousSumActual + currentDailyAct;
            mAct.input.dispatchEvent(new Event('input'));

            // 2. Calculate MTD Forecast from annual_target / 12
            const targetMonthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
            const targetDateStr = `${targetMonthStr}-01`;

            const fixedInput = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === kpiName &&
                r.date === targetDateStr
            );

            if (fixedInput && fixedInput.data && (fixedInput.data.annual_target !== undefined || fixedInput.data.full_budget !== undefined || fixedInput.data.full_forecast !== undefined)) {
                const annualTarget = parseFloat(fixedInput.data.annual_target) || parseFloat(fixedInput.data.full_budget) || 0;
                const mtdFcstVal = annualTarget / 12;
                mFcst.input.value = mtdFcstVal % 1 ? mtdFcstVal.toFixed(2) : mtdFcstVal;
                fullFcst.input.value = mtdFcstVal % 1 ? mtdFcstVal.toFixed(2) : mtdFcstVal;
                fullBudg.input.value = annualTarget;
            } else {
                mFcst.input.value = '';
                fullFcst.input.value = '';
                fullBudg.input.value = '';
            }
            mFcst.input.dispatchEvent(new Event('input'));
            fullFcst.input.dispatchEvent(new Event('input'));
            fullBudg.input.dispatchEvent(new Event('input'));

        } catch (e) {
            console.error("Error calculating MTD:", e);
            // Fallbacks on error
            mAct.input.value = currentDailyAct;
            mFcst.input.value = currentDailyFcst;
        }
    };

    // Outlook Calculation Logic
    const calculateEnvOutlook = () => {
        const dt = date.input.value;
        if (!dt) return;

        const mtdActual = parseFloat(mAct.input.value) || 0;
        const fullForecast = parseFloat(fullFcst.input.value) || 0;

        const dateObj = new Date(dt);
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth();
        const currentDay = dateObj.getDate();

        // Days in Month
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const remDays = daysInMonth - currentDay;

        if (remDays <= 0) {
            // Logic for end of month or past end of month
            // Assuming Outlook converges to MTD Actual if no days left
            outlook.input.value = Math.round(mtdActual);
        } else {
            const diff = fullForecast - mtdActual;
            const inc = diff / remDays;
            const final = mtdActual + inc;
            outlook.input.value = Math.round(final);
        }

        // Trigger Budget Variance Calculation
        outlook.input.dispatchEvent(new Event('input'));
    };

    date.input.addEventListener('change', calculateEnvMTD);
    dAct.input.addEventListener('input', calculateEnvMTD);
    dFcst.input.addEventListener('input', calculateEnvMTD);

    // Trigger Outlook Calc
    date.input.addEventListener('change', calculateEnvOutlook);
    mAct.input.addEventListener('input', calculateEnvOutlook); // mAct updates indirectly via MTD calc
    fullFcst.input.addEventListener('input', calculateEnvOutlook);
    // KPI is read-only text, no change event needed

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        if (!date.input.value) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const payload = {
            daily_actual: parseFloat(dAct.input.value) || 0,
            daily_forecast: parseFloat(dFcst.input.value) || 0,
            var1: dVar.input.value,
            mtd_actual: parseFloat(mAct.input.value) || 0,
            mtd_forecast: parseFloat(mFcst.input.value) || 0,
            var2: mVar.input.value,
            outlook: parseFloat(outlook.input.value) || 0,
            full_forecast: parseFloat(fullFcst.input.value) || 0,
            full_budget: parseFloat(fullBudg.input.value) || 0,
            annual_target: parseFloat(fullBudg.input.value) || 0,
            var3: budgVar.input.value
        };

        const record = {
            subtype: 'daily_input',
            date: date.input.value,
            department: dept,
            metric_name: kpi.input.value,
            data: payload
        };

        await saveKPIRecord(dept, record);
        DOM.showToast("Environmental Incident Saved!", "success");
        loadRecentRecords(dept);

        // Clear Inputs
        date.input.value = '';
        dAct.input.value = '';
        dFcst.input.value = '';
        dVar.input.value = '';
        mAct.input.value = '';
        mFcst.input.value = '';
        mVar.input.value = '';
        outlook.input.value = '';
        fullFcst.input.value = '';
        fullBudg.input.value = '';
        budgVar.input.value = '';
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderOHSPropertyDamageForm(dept, metricName, card) {
    const formContainer = document.createElement('div');
    formContainer.className = 'mb-4';

    const createRow = () => {
        const row = document.createElement('div');
        row.className = 'row gx-3';
        return row;
    };

    const addToRow = (row, group, colClass = 'col-md-4') => {
        group.container.classList.add(...colClass.split(' '));
        row.appendChild(group.container);
    };

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    dFcst.input.value = ''; // Default 0
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;

    // Custom Variance Logic: (Forecast - Actual) / Forecast for "Lower is Better"
    const updatePropDamVariance = (actInput, fcstInput, varInput, useActDenom = false) => {
        let act = parseFloat(actInput.value);
        let fcst = parseFloat(fcstInput.value);

        if (isNaN(act) || isNaN(fcst)) {
            varInput.value = '';
            return;
        }

        act = Math.ceil(act);
        fcst = Math.ceil(fcst);

        if (useActDenom) {
            if (act === 0) {
                varInput.value = '0%';
                return;
            }
            const variance = ((fcst - act) / act) * 100;
            varInput.value = Math.round(variance) + '%';
        } else {
            if (fcst === 0) {
                if (act === 0) varInput.value = '0%';
                else varInput.value = '-100%'; // Any incidents against 0 forecast is bad
                return;
            }

            // Favorable if Actual < Forecast
            const variance = ((fcst - act) / fcst) * 100;
            varInput.value = Math.round(variance) + '%';
        }
    };

    dAct.input.addEventListener('input', () => updatePropDamVariance(dAct.input, dFcst.input, dVar.input, true));
    dFcst.input.addEventListener('input', () => updatePropDamVariance(dAct.input, dFcst.input, dVar.input, true));
    // attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;

    mAct.input.addEventListener('input', () => updatePropDamVariance(mAct.input, mFcst.input, mVar.input, true));
    mFcst.input.addEventListener('input', () => updatePropDamVariance(mAct.input, mFcst.input, mVar.input, true));
    // attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    fullFcst.input.value = ''; // Default to 0
    fullFcst.input.readOnly = true;
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    fullBudg.input.value = ''; // Default to 0
    fullBudg.input.readOnly = true;

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;

    // Compare Outlook vs monthly target (Full Forecast)
    outlook.input.addEventListener('input', () => updatePropDamVariance(outlook.input, fullFcst.input, budgVar.input, true));
    fullFcst.input.addEventListener('input', () => updatePropDamVariance(outlook.input, fullFcst.input, budgVar.input, true));


    // attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Add to Form Container
    // Row 1: KPI (Hidden) + Date
    const row1 = createRow();
    addToRow(row1, kpi, 'd-none');
    addToRow(row1, date, 'col-md-4');
    formContainer.appendChild(row1);

    // Row 2: Daily
    const row2 = createRow();
    addToRow(row2, dAct, 'col-md-4');
    addToRow(row2, dFcst, 'col-md-4');
    addToRow(row2, dVar, 'col-md-4');
    formContainer.appendChild(row2);

    // Row 3: MTD
    const row3 = createRow();
    addToRow(row3, mAct, 'col-md-4');
    addToRow(row3, mFcst, 'col-md-4');
    addToRow(row3, mVar, 'col-md-4');
    formContainer.appendChild(row3);

    // Row 4: Outlook
    const row4 = createRow();
    addToRow(row4, outlook, 'col-md-3');
    addToRow(row4, fullFcst, 'col-md-3');
    addToRow(row4, fullBudg, 'col-md-3');
    addToRow(row4, budgVar, 'col-md-3');
    formContainer.appendChild(row4);

    card.appendChild(formContainer);

    // MTD Calculation Logic for Property Damage
    const calculatePropDamMTD = async () => {
        const dt = date.input.value;
        const currentDailyAct = parseFloat(dAct.input.value) || 0;
        const kpiName = kpi.input.value;

        if (!dt) {
            mAct.input.value = Math.round(currentDailyAct);
            mAct.input.dispatchEvent(new Event('input'));
            return;
        }

        const dateObj = new Date(dt);
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth();

        try {
            const records = await fetchKPIRecords(dept);

            // Calculate MTD Actual by summing Daily Actuals for same month & metric
            // Logic: Sum previous records + current input
            const previousSumActual = records
                .filter(r => r.metric_name === kpiName)
                .filter(r => {
                    const rDate = new Date(r.date);
                    return rDate.getFullYear() === y &&
                        rDate.getMonth() === m &&
                        rDate < dateObj;
                })
                .reduce((sum, r) => {
                    const val = r.data ? (parseFloat(r.data.daily_actual) || 0) : 0;
                    return sum + val;
                }, 0);

            const totalMtd = previousSumActual + currentDailyAct;
            mAct.input.value = Math.round(totalMtd);
            mAct.input.dispatchEvent(new Event('input'));

            // Calculate MTD Forecast from Fixed Inputs based on annual_target / 12
            const targetMonthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
            const targetDateStr = `${targetMonthStr}-01`;

            const fixedInput = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === kpiName &&
                r.date === targetDateStr
            );

            if (fixedInput && fixedInput.data && (fixedInput.data.annual_target !== undefined || fixedInput.data.full_budget !== undefined || fixedInput.data.full_forecast !== undefined)) {
                const annualTarget = parseFloat(fixedInput.data.annual_target) || parseFloat(fixedInput.data.full_budget) || 0;
                const mtdFcstVal = annualTarget / 12;
                mFcst.input.value = mtdFcstVal % 1 ? mtdFcstVal.toFixed(2) : mtdFcstVal;
                fullFcst.input.value = mtdFcstVal % 1 ? mtdFcstVal.toFixed(2) : mtdFcstVal;
                fullBudg.input.value = annualTarget;
            } else {
                mFcst.input.value = '';
                fullFcst.input.value = '';
                fullBudg.input.value = '';
            }
            mFcst.input.dispatchEvent(new Event('input'));
            fullFcst.input.dispatchEvent(new Event('input'));
            fullBudg.input.dispatchEvent(new Event('input'));

        } catch (e) {
            console.error("Error calculating Property Damage MTD:", e);
            mAct.input.value = Math.round(currentDailyAct);
        }
    };

    date.input.addEventListener('change', calculatePropDamMTD);
    dAct.input.addEventListener('input', calculatePropDamMTD);

    // Outlook Calculation Logic
    const calculatePropDamOutlook = () => {
        const dt = date.input.value;
        if (!dt) return;

        const mtdActual = parseFloat(mAct.input.value) || 0;
        const fullForecast = parseFloat(fullFcst.input.value) || 0;

        const dateObj = new Date(dt);
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth();
        const currentDay = dateObj.getDate();

        // Days in Month
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const remDays = daysInMonth - currentDay;

        if (remDays <= 0) {
            // Logic for end of month or past end of month
            outlook.input.value = Math.round(mtdActual);
        } else {
            const diff = fullForecast - mtdActual;
            const inc = diff / remDays;
            const final = mtdActual + inc;
            outlook.input.value = Math.round(final);
        }

        // Trigger Budget Variance Calculation
        outlook.input.dispatchEvent(new Event('input'));
    };

    // Attach listeners for Outlook calculation
    date.input.addEventListener('change', calculatePropDamOutlook);
    mAct.input.addEventListener('input', calculatePropDamOutlook);
    fullFcst.input.addEventListener('input', calculatePropDamOutlook);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        if (!date.input.value) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const payload = {
            daily_actual: parseFloat(dAct.input.value) || 0,
            daily_forecast: parseFloat(dFcst.input.value) || 0,
            var1: dVar.input.value,
            mtd_actual: parseFloat(mAct.input.value) || 0,
            mtd_forecast: parseFloat(mFcst.input.value) || 0,
            var2: mVar.input.value,
            outlook: parseFloat(outlook.input.value) || 0,
            full_forecast: parseFloat(fullFcst.input.value) || 0,
            full_budget: parseFloat(fullBudg.input.value) || 0,
            annual_target: parseFloat(fullBudg.input.value) || 0,
            var3: budgVar.input.value
        };

        const record = {
            subtype: 'daily_input',
            date: date.input.value,
            department: dept,
            metric_name: kpi.input.value,
            data: payload
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Property Damage Record Saved!", "success");
            loadRecentRecords(dept);

            // Clear / Reset Inputs
            date.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringLightVehiclesForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dQty = DOM.createInputGroup("Qty Available", `input-${dept}-qty-avail`, "number");
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text");
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Calculate MTD Forecast (Mirror Daily Forecast) AND Full Forecast
    const updateForecasts = () => {
        let val = dFcst.input.value;
        if (val && !val.includes('%')) {
            val = val + '%';
        }
        // Update MTD Forecast
        mFcst.input.value = val;
        mFcst.input.dispatchEvent(new Event('input')); // Trigger variance

        // Update Full Forecast
        fullFcst.input.value = val;
        fullFcst.input.dispatchEvent(new Event('input'));
    };
    dFcst.input.addEventListener('input', updateForecasts);

    // Auto-Calculate MTD Actual (Average)
    const updateMTDActual = async () => {
        const dateVal = date.input.value;
        const currentDailyValStr = dAct.input.value;

        if (!dateVal) return;

        // Parse current daily actual (remove % if present)
        let currentDailyVal = 0;
        if (currentDailyValStr) {
            currentDailyVal = parseFloat(currentDailyValStr.replace('%', ''));
        }
        if (isNaN(currentDailyVal)) currentDailyVal = 0;

        const d = new Date(dateVal);
        const day = d.getDate();

        // Logic for 1st of month: Mirror Daily
        if (day === 1) {
            mAct.input.value = Math.round(currentDailyVal) + '%';
            mAct.input.dispatchEvent(new Event('input')); // Trigger variance listener
            return;
        }

        // Logic for subsequent days: Average of (Previous Records + Current)
        try {
            const records = await fetchKPIRecords(dept);

            const selectedMonth = d.getMonth();
            const selectedYear = d.getFullYear();
            const selectedDateTimestamp = d.getTime();

            // Filter for previous days in same month
            const matchedRecords = records.filter(r => {
                if (r.metric_name !== metricName) return false;
                if (!r.data || r.data.daily_actual == null) return false;

                const rDate = new Date(r.date);
                // Check month/year match
                if (rDate.getMonth() !== selectedMonth || rDate.getFullYear() !== selectedYear) return false;

                // Check if strictly before current date
                if (rDate.getTime() >= selectedDateTimestamp) return false;

                return true;
            });

            // Sum previous
            let sum = 0;
            let count = 0;

            matchedRecords.forEach(r => {
                let val = parseFloat(r.data.daily_actual);
                // Handle if stored as "85%" string or 85 number
                if (typeof r.data.daily_actual === 'string') {
                    val = parseFloat(r.data.daily_actual.replace('%', ''));
                }

                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            });

            // Add Current Input
            sum += currentDailyVal;
            count += 1;

            const average = count > 0 ? (sum / count) : 0;
            mAct.input.value = Math.round(average) + '%';
            mAct.input.dispatchEvent(new Event('input')); // Trigger variance

        } catch (e) {
            console.error("Error calculating MTD Actual", e);
        }
    };

    // Attach listeners
    dAct.input.addEventListener('input', updateMTDActual);
    date.input.addEventListener('change', updateMTDActual);

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    // Removed budgVar per request

    // Auto-Populate from Fixed Inputs (Daily Fcst -> Full Fcst, Full Budget c)
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedInputs = records.filter(r => r.subtype === 'fixed_input');

            const selectedDate = new Date(dateVal);
            const selectedMonth = selectedDate.getMonth();
            const selectedYear = selectedDate.getFullYear();

            const target = fixedInputs.find(r => {
                if (r.metric_name !== metricName) return false;
                const rDate = new Date(r.date);
                return rDate.getMonth() === selectedMonth && rDate.getFullYear() === selectedYear;
            });

            if (target && target.data) {
                // 1. Set Daily Forecast (which mirrors to MTD/Full Forecast via listener)
                if (target.data.full_forecast != null) {
                    dFcst.input.value = target.data.full_forecast + '%';
                    dFcst.input.dispatchEvent(new Event('input'));
                }

                // 2. Set Full Budget (c)
                if (target.data.full_budget != null) {
                    fullBudg.input.value = target.data.full_budget;
                    fullBudg.input.dispatchEvent(new Event('input')); // Trigger variance
                }
            }

        } catch (e) {
            console.error("Error fetching fixed inputs for auto-populate", e);
        }
    });

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dQty); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(fullFcst); add(fullBudg); // Removed budgVar

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                qty_available: dQty.input.value,
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dQty.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            // Don't clear date usually, or do? User often enters multiple for same day or sequential. 
            // Others clear date, so I will too.
            date.input.value = '';

        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringTipperTrucksForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dQty = DOM.createInputGroup("Qty Available", `input-${dept}-qty-avail`, "number");
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text");
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedInputs = records.filter(r => r.subtype === 'fixed_input');

            // Find matching fixed input for this metric and month
            const selectedDate = new Date(dateVal);
            const selectedMonth = selectedDate.getMonth();
            const selectedYear = selectedDate.getFullYear();

            const target = fixedInputs.find(r => {
                if (r.metric_name !== metricName) return false;

                // Parse record date
                const rDate = new Date(r.date);
                return rDate.getMonth() === selectedMonth && rDate.getFullYear() === selectedYear;
            });

            if (target && target.data) {
                // Set Full Forecast (b) & Daily Forecast
                if (target.data.full_forecast != null) {
                    const val = target.data.full_forecast + '%';
                    dFcst.input.value = val;
                    // Trigger variance update
                    dFcst.input.dispatchEvent(new Event('input'));

                    fullFcst.input.value = val;
                    fullFcst.input.dispatchEvent(new Event('input'));
                }

                // Set Full Budget (c)
                if (target.data.full_budget != null) {
                    fullBudg.input.value = target.data.full_budget;
                    fullBudg.input.dispatchEvent(new Event('input')); // Trigger variance
                }
            }

        } catch (e) {
            console.error("Error fetching fixed inputs for auto-forecast", e);
        }
    });

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Calculate MTD Forecast (Mirror Daily Forecast)
    const updateMTDForecast = () => {
        let val = dFcst.input.value;
        if (val && !val.includes('%')) {
            val = val + '%';
        }
        mFcst.input.value = val;
        mFcst.input.dispatchEvent(new Event('input')); // Trigger variance
    };
    dFcst.input.addEventListener('input', updateMTDForecast);

    // Auto-Calculate MTD Actual (Average)
    const updateMTDActual = async () => {
        const dateVal = date.input.value;
        const currentDailyValStr = dAct.input.value;

        if (!dateVal) return;

        // Parse current daily actual (remove % if present)
        let currentDailyVal = 0;
        if (currentDailyValStr) {
            currentDailyVal = parseFloat(currentDailyValStr.replace('%', ''));
        }
        if (isNaN(currentDailyVal)) currentDailyVal = 0;

        const d = new Date(dateVal);
        const day = d.getDate();

        // Logic for 1st of month: Mirror Daily
        if (day === 1) {
            mAct.input.value = Math.round(currentDailyVal) + '%';
            mAct.input.dispatchEvent(new Event('input')); // Trigger variance listener
            return;
        }

        // Logic for subsequent days: Average of (Previous Records + Current)
        try {
            const records = await fetchKPIRecords(dept);

            const selectedMonth = d.getMonth();
            const selectedYear = d.getFullYear();
            const selectedDateTimestamp = d.getTime();

            // Filter for previous days in same month
            const matchedRecords = records.filter(r => {
                if (r.metric_name !== metricName) return false;
                if (!r.data || r.data.daily_actual == null) return false;

                const rDate = new Date(r.date);
                // Check month/year match
                if (rDate.getMonth() !== selectedMonth || rDate.getFullYear() !== selectedYear) return false;

                // Check if strictly before current date
                if (rDate.getTime() >= selectedDateTimestamp) return false;

                return true;
            });

            // Sum previous
            let sum = 0;
            let count = 0;

            matchedRecords.forEach(r => {
                let val = parseFloat(r.data.daily_actual);
                // Handle if stored as "85%" string or 85 number
                if (typeof r.data.daily_actual === 'string') {
                    val = parseFloat(r.data.daily_actual.replace('%', ''));
                }

                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            });

            // Add Current Input
            sum += currentDailyVal;
            count += 1;

            const average = count > 0 ? (sum / count) : 0;
            mAct.input.value = Math.round(average) + '%';
            mAct.input.dispatchEvent(new Event('input')); // Trigger variance

        } catch (e) {
            console.error("Error calculating MTD Actual", e);
        }
    };

    // Attach listeners
    dAct.input.addEventListener('input', updateMTDActual);
    date.input.addEventListener('change', updateMTDActual);

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    // Removed budgVar per request

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dQty); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(fullFcst); add(fullBudg); // Removed budgVar

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            data: {
                qty_available: dQty.input.value,
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value
                // var3 removed
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!", "success");
            loadRecentRecords(dept);

            // Clear inputs
            dQty.input.value = '';
            dAct.input.value = '';
            // dFcst usually auto-filled, but can clear
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';

        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringPrimeExcavatorsForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dQty = DOM.createInputGroup("Qty Available", `input-${dept}-qty-avail`, "number");
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text");
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "text");

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dQty); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(fullFcst); add(fullBudg); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers

    card.appendChild(grid);

    // 1. Auto-Fetch Fixed Inputs on Date Change (Debug Enabled)
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        // Visual Feedback for debugging
        console.log("DEBUG: Date Changed to", dateVal);

        try {
            const records = await fetchKPIRecords(dept);
            // Filter by subtype 'fixed_input'. Note: Backend might return all records, so we filter here.
            const fixedInputs = records.filter(r => r.subtype === 'fixed_input');

            // Extract YYYY-MM
            const [y, m, d] = dateVal.split('-');
            const searchMonth = `${y}-${m}`; // "2026-01"

            console.log(`DEBUG: Searching for Fixed Input. Metric: '${metricName}', Month: '${searchMonth}'`);

            // Find matching record
            const target = fixedInputs.find(r => {
                // Robust Metric Name Check (case-insensitive trim)
                if (r.metric_name.trim().toLowerCase() !== metricName.trim().toLowerCase()) return false;

                // Robust Date Check (Starts with YYYY-MM)
                // r.date is typically YYYY-MM-DD string from backend
                return r.date && r.date.startsWith(searchMonth);
            });

            if (target) {
                console.log("DEBUG: Match Found!", target);
                DOM.showToast(`Match Found for ${metricName}! ID: ${target.id}`, 'success'); // Uncomment for distinct visual confirmation

                if (target.data) {
                    // Populate Full Forecast (b)
                    if (target.data.full_forecast != null) {
                        let val = target.data.full_forecast;
                        // Attach % if it's a number, or string without %
                        if (typeof val === 'number') {
                            val = val + '%';
                        } else if (typeof val === 'string' && !val.includes('%')) {
                            val = val + '%';
                        }

                        fullFcst.input.value = val;
                        fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                        // Also populate Daily Forecast
                        dFcst.input.value = val;
                        dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                    } else {
                        console.warn("DEBUG: Match found but 'full_forecast' is missing in data", target.data);
                    }

                    // Populate Full Budget (c)
                    if (target.data.full_budget != null) {
                        let val = target.data.full_budget;
                        if (typeof val === 'number') {
                            // val = val + '%'; // User requested no %
                        } else if (typeof val === 'string' && val.includes('%')) {
                            val = val.replace('%', ''); // Ensure no %
                        }
                        fullBudg.input.value = val;
                        fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            } else {
                console.warn(`DEBUG: No Fixed Input found for ${metricName} in ${searchMonth}`);
                DOM.showToast(`Debug: No Fixed Input found for ${metricName} in ${searchMonth}. Checked ${fixedInputs.length} fixed input records.`, 'error');
            }

        } catch (e) {
            console.error("Error fetching fixed inputs for auto-forecast", e);
            DOM.showToast("Error fetching data: " + e.message, "error");
        }
    });

    // 2. Auto-Calculate MTD Forecast (Mirror Daily Forecast)
    const updateMTDForecast = () => {
        let val = dFcst.input.value;
        if (val && !val.includes('%')) {
            val = val + '%';
        }
        mFcst.input.value = val;
        mFcst.input.dispatchEvent(new Event('input', { bubbles: true })); // Trigger variance
    };
    dFcst.input.addEventListener('input', updateMTDForecast);

    // 3. Auto-Calculate MTD Actual (Average)
    const updateMTDActual = async () => {
        const dateVal = date.input.value;
        const currentDailyValStr = dAct.input.value;

        if (!dateVal) return;

        // Parse current daily actual (remove % if present)
        let currentDailyVal = 0;
        if (currentDailyValStr) {
            currentDailyVal = parseFloat(currentDailyValStr.replace('%', ''));
        }
        if (isNaN(currentDailyVal)) currentDailyVal = 0;

        const [y, m, d] = dateVal.split('-').map(Number);

        // Logic for 1st of month: Mirror Daily
        if (d === 1) {
            mAct.input.value = Math.round(currentDailyVal) + '%';
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }

        // Logic for subsequent days: Average of (Previous Records + Current)
        try {
            const records = await fetchKPIRecords(dept);

            const selectedMonth = m - 1;
            const selectedYear = y;

            // Filter for previous days in same month
            const matchedRecords = records.filter(r => {
                if (r.metric_name !== metricName) return false;
                if (!r.data || r.data.daily_actual == null) return false;

                const [rY, rM, rD] = r.date.split('-').map(Number);
                // Check month/year match
                if ((rM - 1) !== selectedMonth || rY !== selectedYear) return false;

                // Check if strictly before current date
                if (rD >= d) return false;

                return true;
            });

            // Sum previous
            let sum = 0;
            let count = 0;

            matchedRecords.forEach(r => {
                let val = parseFloat(r.data.daily_actual);
                // Handle if stored as "85%" string or 85 number
                if (typeof r.data.daily_actual === 'string') {
                    val = parseFloat(r.data.daily_actual.replace('%', ''));
                }

                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            });

            // Add Current Input
            sum += currentDailyVal;
            count += 1;

            const average = count > 0 ? (sum / count) : 0;
            mAct.input.value = Math.round(average) + '%';
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.error("Error calculating MTD Actual", e);
        }
    };

    // Attach listeners
    dAct.input.addEventListener('input', updateMTDActual);
    date.input.addEventListener('change', updateMTDActual);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                qty_available: dQty.input.value,
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dQty.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            date.input.value = '';

        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringAnxExcavatorsForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dQty = DOM.createInputGroup("Qty Available", `input-${dept}-qty-avail`, "number");
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text");
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Auto-Fetch Fixed Inputs on Date Change for Anx Excavators
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedInputs = records.filter(r => r.subtype === 'fixed_input');

            // Extract YYYY-MM
            const [y, m, d] = dateVal.split('-');
            const searchMonth = `${y}-${m}`;

            // Find matching record
            const target = fixedInputs.find(r => {
                if (r.metric_name.trim().toLowerCase() !== metricName.trim().toLowerCase()) return false;
                return r.date && r.date.startsWith(searchMonth);
            });

            if (target && target.data) {
                // Populate Full Forecast
                if (target.data.full_forecast != null) {
                    let val = target.data.full_forecast;
                    if (typeof val === 'number') {
                        val = val + '%';
                    } else if (typeof val === 'string' && !val.includes('%')) {
                        val = val + '%';
                    }

                    // Populate Daily Forecast
                    dFcst.input.value = val;
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                    // Also populate Full Forecast (b) if it exists
                    if (typeof fullFcst !== 'undefined') {
                        fullFcst.input.value = val;
                        fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }

                // Populate Full Budget
                if (target.data.full_budget != null) {
                    let val = target.data.full_budget;
                    // Keep as number unless instructed otherwise. 
                    // User request: "corresponding value of 55 on Full Budget column" (implies number)

                    if (typeof fullBudg !== 'undefined') {
                        fullBudg.input.value = val;
                        fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    });

    // Auto-Calculate MTD Actual (Average)
    const updateMTDActual = async () => {
        const dateVal = date.input.value;
        const currentDailyValStr = dAct.input.value;

        if (!dateVal) return;

        // Parse current daily actual (remove % if present)
        let currentDailyVal = 0;
        if (currentDailyValStr) {
            currentDailyVal = parseFloat(currentDailyValStr.replace('%', ''));
        }
        if (isNaN(currentDailyVal)) currentDailyVal = 0;

        const [y, m, d] = dateVal.split(' ').length > 1 ? new Date(dateVal).toISOString().split('T')[0].split('-').map(Number) : dateVal.split('-').map(Number);

        // Handle potential date parsing issues if dateVal isn't standard YYYY-MM-DD
        // But input type="date" returns YYYY-MM-DD.

        // Logic for 1st of month: Mirror Daily
        if (d === 1) {
            if (currentDailyValStr) {
                mAct.input.value = Math.round(currentDailyVal) + '%';
                mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
        }

        // Logic for subsequent days: Average of (Previous Records + Current)
        try {
            const records = await fetchKPIRecords(dept);
            const selectedMonth = m - 1; // JS Month 0-11
            const selectedYear = y;

            // Filter for previous days in same month
            const matchedRecords = records.filter(r => {
                if (r.metric_name !== metricName) return false;
                if (!r.data || r.data.daily_actual == null) return false;
                if (r.subtype === 'fixed_input') return false; // Exclude fixed inputs

                const [rY, rM, rD] = r.date.split('-').map(Number);

                // Check month/year match
                if ((rM - 1) !== selectedMonth || rY !== selectedYear) return false;

                // Check if strictly before current date
                if (rD >= d) return false;

                return true;
            });

            // Sum previous
            let sum = 0;
            let count = 0;

            matchedRecords.forEach(r => {
                let val = r.data.daily_actual;
                // Handle various formats
                if (typeof val === 'string') {
                    val = parseFloat(val.replace('%', ''));
                }

                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            });

            // Add Current Input
            // Only add if user has typed something? Usually yes.
            // But if user hasn't typed, average is just previous days?
            // User requirement: "add it to the value in the Daily Actual placeholder... find its average"
            // Implies current day is included.
            sum += currentDailyVal;
            count += 1;

            const average = count > 0 ? (sum / count) : 0;
            mAct.input.value = Math.round(average) + '%';
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.error("Error calculating MTD Actual", e);
        }
    };

    // Attach listeners
    dAct.input.addEventListener('input', updateMTDActual);
    date.input.addEventListener('change', updateMTDActual);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text"); // Changed to text to hold %
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text"); // Changed to text
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Populate MTD Forecast from Daily Forecast
    dFcst.input.addEventListener('input', () => {
        let val = dFcst.input.value;
        if (val) {
            if (!val.includes('%')) {
                val = val + '%';
            }
            mFcst.input.value = val;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            mFcst.input.value = '';
        }
    });

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text"); // Changed to text
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    // Note: No Outlook (a) in this form, so comparing Full Forecast vs Budget usually
    // attachVarianceListener(fullFcst.input, fullBudg.input, budgVar.input); // budgVar removed


    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dQty); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(fullFcst); add(fullBudg); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacer

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                qty_available: dQty.input.value,
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs (Optional - user might want to keep entering next day?)
            // Usually clearing is good.
            dQty.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            // date.input.value = ''; // Keep date or clear? Let's clear to force selection as requested previously

        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringDumpTrucksForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dQty = DOM.createInputGroup("Qty Available", `input-${dept}-qty-avail`, "number");
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text");
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Auto-Fetch Fixed Inputs on Date Change for Dump Trucks
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedInputs = records.filter(r => r.subtype === 'fixed_input');

            // Extract YYYY-MM
            const [y, m, d] = dateVal.split('-');
            const searchMonth = `${y}-${m}`;

            // Find matching record
            const target = fixedInputs.find(r => {
                if (r.metric_name.trim().toLowerCase() !== metricName.trim().toLowerCase()) return false;
                return r.date && r.date.startsWith(searchMonth);
            });

            if (target && target.data) {
                // Populate Full Forecast & Daily Forecast
                if (target.data.full_forecast != null) {
                    let val = target.data.full_forecast;
                    if (typeof val === 'number') {
                        val = val + '%';
                    } else if (typeof val === 'string' && !val.includes('%')) {
                        val = val + '%';
                    }

                    // Populate Daily Forecast
                    dFcst.input.value = val;
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                    // Also populate Full Forecast (b) if it exists
                    if (typeof fullFcst !== 'undefined') {
                        fullFcst.input.value = val;
                        fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }

                // Populate Full Budget (c)
                if (target.data.full_budget != null) {
                    if (typeof fullBudg !== 'undefined') {
                        fullBudg.input.value = target.data.full_budget;
                        fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    });

    // Auto-Calculate MTD Actual (Average)
    const updateMTDActual = async () => {
        const dateVal = date.input.value;
        const currentDailyValStr = dAct.input.value;

        if (!dateVal) return;

        // Parse current daily actual (remove % if present)
        let currentDailyVal = 0;
        if (currentDailyValStr) {
            currentDailyVal = parseFloat(currentDailyValStr.replace('%', ''));
        }
        if (isNaN(currentDailyVal)) currentDailyVal = 0;

        const [y, m, d] = dateVal.split(' ').length > 1 ? new Date(dateVal).toISOString().split('T')[0].split('-').map(Number) : dateVal.split('-').map(Number);

        // Logic for 1st of month: Mirror Daily
        if (d === 1) {
            if (currentDailyValStr) {
                mAct.input.value = Math.round(currentDailyVal) + '%';
                mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
        }

        // Logic for subsequent days: Average of (Previous Records + Current)
        try {
            const records = await fetchKPIRecords(dept);
            const selectedMonth = m - 1; // JS Month 0-11
            const selectedYear = y;

            // Filter for previous days in same month
            const matchedRecords = records.filter(r => {
                if (r.metric_name !== metricName) return false;
                if (!r.data || r.data.daily_actual == null) return false;
                if (r.subtype === 'fixed_input') return false; // Exclude fixed inputs

                const [rY, rM, rD] = r.date.split('-').map(Number);

                // Check month/year match
                if ((rM - 1) !== selectedMonth || rY !== selectedYear) return false;

                // Check if strictly before current date
                if (rD >= d) return false;

                return true;
            });

            // Sum previous
            let sum = 0;
            let count = 0;

            matchedRecords.forEach(r => {
                let val = r.data.daily_actual;
                // Handle various formats
                if (typeof val === 'string') {
                    val = parseFloat(val.replace('%', ''));
                }

                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            });

            // Add Current Input
            sum += currentDailyVal;
            count += 1;

            const average = count > 0 ? (sum / count) : 0;
            mAct.input.value = Math.round(average) + '%';
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.error("Error calculating MTD Actual", e);
        }
    };

    // Attach listeners
    dAct.input.addEventListener('input', updateMTDActual);
    date.input.addEventListener('change', updateMTDActual);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text"); // Changed to text
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text"); // Changed to text
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Populate MTD Forecast from Daily Forecast
    dFcst.input.addEventListener('input', () => {
        let val = dFcst.input.value;
        if (val) {
            if (!val.includes('%')) {
                val = val + '%';
            }
            mFcst.input.value = val;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            mFcst.input.value = '';
        }
    });

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text"); // Changed to text
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    // const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    // budgVar.input.readOnly = true;
    // attachVarianceListener(fullFcst.input, fullBudg.input, budgVar.input);


    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dQty); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(fullFcst); add(fullBudg); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacer

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                qty_available: dQty.input.value,
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value
                // var3: budgVar.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dQty.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            // date.input.value = ''; // Keep date selected or clear?

        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringArtDumpTrucksForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dQty = DOM.createInputGroup("Qty Available", `input-${dept}-qty-avail`, "number");
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text"); // Changed to text
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text"); // Changed to text
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Auto-Fetch Fixed Inputs on Date Change for ART Dump Trucks
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedInputs = records.filter(r => r.subtype === 'fixed_input');

            const [y, m, d] = dateVal.split('-');
            const searchMonth = `${y}-${m}`;

            const target = fixedInputs.find(r => {
                if (r.metric_name.trim().toLowerCase() !== metricName.trim().toLowerCase()) return false;
                return r.date && r.date.startsWith(searchMonth);
            });

            if (target && target.data) {
                if (target.data.full_forecast != null) {
                    let val = target.data.full_forecast;
                    if (typeof val === 'number') {
                        val = val + '%';
                    } else if (typeof val === 'string' && !val.includes('%')) {
                        val = val + '%';
                    }

                    dFcst.input.value = val;
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                    // Also populate Full Forecast (b) if it exists
                    if (typeof fullFcst !== 'undefined') {
                        fullFcst.input.value = val;
                        fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }

                // Populate Full Budget (c) if it exists
                if (target.data.full_budget != null) {
                    if (typeof fullBudg !== 'undefined') {
                        fullBudg.input.value = target.data.full_budget;
                        fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    });

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text"); // Changed to text
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text"); // Changed to text
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Populate MTD Forecast from Daily Forecast for ART Dump Trucks
    dFcst.input.addEventListener('input', () => {
        let val = dFcst.input.value;
        if (val) {
            if (!val.includes('%')) {
                val = val + '%';
            }
            mFcst.input.value = val;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            mFcst.input.value = '';
        }
    });


    // Auto-Calculate MTD Actual (Average)
    const updateMTDActual = async () => {
        const dateVal = date.input.value;
        const currentDailyValStr = dAct.input.value;

        if (!dateVal) return;

        // Parse current daily actual (remove % if present)
        let currentDailyVal = 0;
        if (currentDailyValStr) {
            currentDailyVal = parseFloat(currentDailyValStr.replace('%', ''));
        }
        if (isNaN(currentDailyVal)) currentDailyVal = 0;

        const [y, m, d] = dateVal.split(' ').length > 1 ? new Date(dateVal).toISOString().split('T')[0].split('-').map(Number) : dateVal.split('-').map(Number);

        // Logic for 1st of month: Mirror Daily
        if (d === 1) {
            if (currentDailyValStr) {
                mAct.input.value = Math.round(currentDailyVal) + '%';
                mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
        }

        // Logic for subsequent days: Average of (Previous Records + Current)
        try {
            const records = await fetchKPIRecords(dept);
            const selectedMonth = m - 1; // JS Month 0-11
            const selectedYear = y;

            // Filter for previous days in same month
            const matchedRecords = records.filter(r => {
                if (r.metric_name !== metricName) return false;
                if (!r.data || r.data.daily_actual == null) return false;
                if (r.subtype === 'fixed_input') return false; // Exclude fixed inputs

                const [rY, rM, rD] = r.date.split('-').map(Number);

                // Check month/year match
                if ((rM - 1) !== selectedMonth || rY !== selectedYear) return false;

                // Check if strictly before current date
                if (rD >= d) return false;

                return true;
            });

            // Sum previous
            let sum = 0;
            let count = 0;

            matchedRecords.forEach(r => {
                let val = r.data.daily_actual;
                // Handle various formats
                if (typeof val === 'string') {
                    val = parseFloat(val.replace('%', ''));
                }

                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            });

            // Add Current Input
            sum += currentDailyVal;
            count += 1;

            const average = count > 0 ? (sum / count) : 0;
            mAct.input.value = Math.round(average) + '%';
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.error("Error calculating MTD Actual", e);
        }
    };

    // Attach listeners
    dAct.input.addEventListener('input', updateMTDActual);
    date.input.addEventListener('change', updateMTDActual);

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text"); // Changed to text
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dQty); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(fullFcst); add(fullBudg); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                qty_available: dQty.input.value,
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value
                // var3: removed
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dQty.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            // date.input.value = ''; // Keep date selected or clear?

        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringWheelLoadersForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dQty = DOM.createInputGroup("Qty Available", `input-${dept}-qty-avail`, "number");
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text"); // Changed to text
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text"); // Changed to text
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Auto-Fetch Fixed Inputs on Date Change for Wheel Loaders
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedInputs = records.filter(r => r.subtype === 'fixed_input');

            const [y, m, d] = dateVal.split('-');
            const searchMonth = `${y}-${m}`;

            const target = fixedInputs.find(r => {
                if (r.metric_name.trim().toLowerCase() !== metricName.trim().toLowerCase()) return false;
                return r.date && r.date.startsWith(searchMonth);
            });

            if (target && target.data) {
                if (target.data.full_forecast != null) {
                    let val = target.data.full_forecast;
                    if (typeof val === 'number') {
                        val = val + '%';
                    } else if (typeof val === 'string' && !val.includes('%')) {
                        val = val + '%';
                    }

                    dFcst.input.value = val;
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                    // Also populate Full Forecast (b) if it exists
                    if (typeof fullFcst !== 'undefined') {
                        fullFcst.input.value = val;
                        fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }

                // Populate Full Budget (c) if it exists
                if (target.data.full_budget != null) {
                    if (typeof fullBudg !== 'undefined') {
                        fullBudg.input.value = target.data.full_budget;
                        fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    });

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text"); // Changed to text
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text"); // Changed to text
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Populate MTD Forecast from Daily Forecast for Wheel Loaders
    dFcst.input.addEventListener('input', () => {
        let val = dFcst.input.value;
        if (val) {
            if (!val.includes('%')) {
                val = val + '%';
            }
            mFcst.input.value = val;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            mFcst.input.value = '';
        }
    });


    // Auto-Calculate MTD Actual (Average)
    const updateMTDActual = async () => {
        const dateVal = date.input.value;
        const currentDailyValStr = dAct.input.value;

        if (!dateVal) return;

        // Parse current daily actual (remove % if present)
        let currentDailyVal = 0;
        if (currentDailyValStr) {
            currentDailyVal = parseFloat(currentDailyValStr.replace('%', ''));
        }
        if (isNaN(currentDailyVal)) currentDailyVal = 0;

        const [y, m, d] = dateVal.split(' ').length > 1 ? new Date(dateVal).toISOString().split('T')[0].split('-').map(Number) : dateVal.split('-').map(Number);

        // Logic for 1st of month: Mirror Daily
        if (d === 1) {
            if (currentDailyValStr) {
                mAct.input.value = Math.round(currentDailyVal) + '%';
                mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
        }

        // Logic for subsequent days: Average of (Previous Records + Current)
        try {
            const records = await fetchKPIRecords(dept);
            const selectedMonth = m - 1; // JS Month 0-11
            const selectedYear = y;

            // Filter for previous days in same month
            const matchedRecords = records.filter(r => {
                if (r.metric_name !== metricName) return false;
                if (!r.data || r.data.daily_actual == null) return false;
                if (r.subtype === 'fixed_input') return false; // Exclude fixed inputs

                const [rY, rM, rD] = r.date.split('-').map(Number);

                // Check month/year match
                if ((rM - 1) !== selectedMonth || rY !== selectedYear) return false;

                // Check if strictly before current date
                if (rD >= d) return false;

                return true;
            });

            // Sum previous
            let sum = 0;
            let count = 0;

            matchedRecords.forEach(r => {
                let val = r.data.daily_actual;
                // Handle various formats
                if (typeof val === 'string') {
                    val = parseFloat(val.replace('%', ''));
                }

                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            });

            // Add Current Input
            sum += currentDailyVal;
            count += 1;

            const average = count > 0 ? (sum / count) : 0;
            mAct.input.value = Math.round(average) + '%';
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.error("Error calculating MTD Actual", e);
        }
    };

    // Attach listeners
    dAct.input.addEventListener('input', updateMTDActual);
    date.input.addEventListener('change', updateMTDActual);

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text"); // Changed to text
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dQty); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(fullFcst); add(fullBudg); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                qty_available: dQty.input.value,
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value
                // var3: removed
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dQty.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            // date.input.value = ''; // Keep date selected or clear?

        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringGradersForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dQty = DOM.createInputGroup("Qty Available", `input-${dept}-qty-avail`, "number");
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text"); // Changed to text
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text"); // Changed to text
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Auto-Fetch Fixed Inputs on Date Change for Graders
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedInputs = records.filter(r => r.subtype === 'fixed_input');

            const [y, m, d] = dateVal.split('-');
            const searchMonth = `${y}-${m}`;

            const target = fixedInputs.find(r => {
                if (r.metric_name.trim().toLowerCase() !== metricName.trim().toLowerCase()) return false;
                return r.date && r.date.startsWith(searchMonth);
            });

            if (target && target.data) {
                if (target.data.full_forecast != null) {
                    let val = target.data.full_forecast;
                    if (typeof val === 'number') {
                        val = val + '%';
                    } else if (typeof val === 'string' && !val.includes('%')) {
                        val = val + '%';
                    }

                    dFcst.input.value = val;
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                    // Also populate Full Forecast (b) if it exists
                    if (typeof fullFcst !== 'undefined') {
                        fullFcst.input.value = val;
                        fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }

                // Populate Full Budget (c) if it exists
                if (target.data.full_budget != null) {
                    if (typeof fullBudg !== 'undefined') {
                        fullBudg.input.value = target.data.full_budget;
                        fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    });

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text"); // Changed to text
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text"); // Changed to text
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Populate MTD Forecast from Daily Forecast for Graders
    dFcst.input.addEventListener('input', () => {
        let val = dFcst.input.value;
        if (val) {
            if (!val.includes('%')) {
                val = val + '%';
            }
            mFcst.input.value = val;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            mFcst.input.value = '';
        }
    });


    // Auto-Calculate MTD Actual (Average)
    const updateMTDActual = async () => {
        const dateVal = date.input.value;
        const currentDailyValStr = dAct.input.value;

        if (!dateVal) return;

        // Parse current daily actual (remove % if present)
        let currentDailyVal = 0;
        if (currentDailyValStr) {
            currentDailyVal = parseFloat(currentDailyValStr.replace('%', ''));
        }
        if (isNaN(currentDailyVal)) currentDailyVal = 0;

        const [y, m, d] = dateVal.split(' ').length > 1 ? new Date(dateVal).toISOString().split('T')[0].split('-').map(Number) : dateVal.split('-').map(Number);

        // Logic for 1st of month: Mirror Daily
        if (d === 1) {
            if (currentDailyValStr) {
                mAct.input.value = Math.round(currentDailyVal) + '%';
                mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
        }

        // Logic for subsequent days: Average of (Previous Records + Current)
        try {
            const records = await fetchKPIRecords(dept);
            const selectedMonth = m - 1; // JS Month 0-11
            const selectedYear = y;

            // Filter for previous days in same month
            const matchedRecords = records.filter(r => {
                if (r.metric_name !== metricName) return false;
                if (!r.data || r.data.daily_actual == null) return false;
                if (r.subtype === 'fixed_input') return false; // Exclude fixed inputs

                const [rY, rM, rD] = r.date.split('-').map(Number);

                // Check month/year match
                if ((rM - 1) !== selectedMonth || rY !== selectedYear) return false;

                // Check if strictly before current date
                if (rD >= d) return false;

                return true;
            });

            // Sum previous
            let sum = 0;
            let count = 0;

            matchedRecords.forEach(r => {
                let val = r.data.daily_actual;
                // Handle various formats
                if (typeof val === 'string') {
                    val = parseFloat(val.replace('%', ''));
                }

                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            });

            // Add Current Input
            sum += currentDailyVal;
            count += 1;

            const average = count > 0 ? (sum / count) : 0;
            mAct.input.value = Math.round(average) + '%';
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.error("Error calculating MTD Actual", e);
        }
    };

    // Attach listeners
    dAct.input.addEventListener('input', updateMTDActual);
    date.input.addEventListener('change', updateMTDActual);

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text"); // Changed to text
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dQty); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(fullFcst); add(fullBudg); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                qty_available: dQty.input.value,
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value
                // var3: removed
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dQty.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            // date.input.value = ''; // Keep date selected or clear?

        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringDozersForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = '';

    // Row 2
    const dQty = DOM.createInputGroup("Qty Available", `input-${dept}-qty-avail`, "number");
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text"); // Changed to text
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text"); // Changed to text
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Auto-Fetch Fixed Inputs on Date Change for Dozers
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        try {
            const records = await fetchKPIRecords(dept);
            const fixedInputs = records.filter(r => r.subtype === 'fixed_input');

            const [y, m, d] = dateVal.split('-');
            const searchMonth = `${y}-${m}`;

            const target = fixedInputs.find(r => {
                if (r.metric_name.trim().toLowerCase() !== metricName.trim().toLowerCase()) return false;
                return r.date && r.date.startsWith(searchMonth);
            });

            if (target && target.data) {
                if (target.data.full_forecast != null) {
                    let val = target.data.full_forecast;
                    if (typeof val === 'number') {
                        val = val + '%';
                    } else if (typeof val === 'string' && !val.includes('%')) {
                        val = val + '%';
                    }

                    dFcst.input.value = val;
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                    // Also populate Full Forecast (b) if it exists
                    if (typeof fullFcst !== 'undefined') {
                        fullFcst.input.value = val;
                        fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    });

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text"); // Changed to text
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text"); // Changed to text
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Populate MTD Forecast from Daily Forecast for Dozers
    dFcst.input.addEventListener('input', () => {
        let val = dFcst.input.value;
        if (val) {
            if (!val.includes('%')) {
                val = val + '%';
            }
            mFcst.input.value = val;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            mFcst.input.value = '';
        }
    });

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text"); // Changed to text
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    // Note: No Outlook (a) in this form, so comparing Full Forecast vs Budget usually
    attachVarianceListener(fullFcst.input, fullBudg.input, budgVar.input);


    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); grid.appendChild(document.createElement('div')); // Spacers
    add(dQty); add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(fullFcst); add(fullBudg); add(budgVar); grid.appendChild(document.createElement('div')); // Spacer

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showToast("Please select a date.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                qty_available: dQty.input.value,
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value,
                var3: budgVar.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dQty.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringCrusherForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.valueAsDate = new Date();

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    // Note: No Outlook (a) in this form, so comparing Full Forecast vs Budget usually
    attachVarianceListener(fullFcst.input, fullBudg.input, budgVar.input);


    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(fullFcst); add(fullBudg); add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        const dActVal = dAct.input.value;
        const dFcstVal = dFcst.input.value;
        const mActVal = mAct.input.value;
        const mFcstVal = mFcst.input.value;
        const fullFcstVal = fullFcst.input.value;
        const fullBudgVal = fullBudg.input.value;

        if (!dateVal || !dActVal || !dFcstVal || !mActVal || !mFcstVal || !fullFcstVal || !fullBudgVal) {
            DOM.showToast("Please fill in all fields (Date, Daily Actual, Daily Forecast, MTD Actual, MTD Forecast, Full Forecast, Full Budget) before saving.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                daily_actual: dActVal,
                daily_forecast: dFcstVal,
                var1: dVar.input.value,
                mtd_actual: mActVal,
                mtd_forecast: mFcstVal,
                var2: mVar.input.value,
                full_forecast: fullFcstVal,
                full_budget: fullBudgVal,
                var3: budgVar.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringMillForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.className = 'kpi-form-grid-3';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.valueAsDate = new Date();

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "number");
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    // Note: No Outlook (a) in this form, so comparing Full Forecast vs Budget usually
    attachVarianceListener(fullFcst.input, fullBudg.input, budgVar.input);


    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(fullFcst); add(fullBudg); add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        const dActVal = dAct.input.value;
        const dFcstVal = dFcst.input.value;
        const mActVal = mAct.input.value;
        const mFcstVal = mFcst.input.value;
        const fullFcstVal = fullFcst.input.value;
        const fullBudgVal = fullBudg.input.value;

        if (!dateVal || !dActVal || !dFcstVal || !mActVal || !mFcstVal || !fullFcstVal || !fullBudgVal) {
            DOM.showToast("Please fill in all fields (Date, Daily Actual, Daily Forecast, MTD Actual, MTD Forecast, Full Forecast, Full Budget) before saving.", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                daily_actual: dActVal,
                daily_forecast: dFcstVal,
                var1: dVar.input.value,
                mtd_actual: mActVal,
                mtd_forecast: mFcstVal,
                var2: mVar.input.value,
                full_forecast: fullFcstVal,
                full_budget: fullBudgVal,
                var3: budgVar.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dAct.input.value = '';
            dFcst.input.value = '';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            fullFcst.input.value = '';
            fullBudg.input.value = '';
            budgVar.input.value = '';
        } catch (error) {
            console.error(error);
            DOM.showToast("Failed to save record.", "error");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderStandardKPIForm(dept, metricName, card) {
    // Form Fields
    const dateGroup = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    dateGroup.input.valueAsDate = new Date();

    const dailyActual = DOM.createInputGroup("Daily Actual", `input-${dept}-actual`, "number");
    const dailyForecast = DOM.createInputGroup("Daily Forecast", `input-${dept}-forecast`, "number");
    const varianceGroup = DOM.createInputGroup("Variance (%)", `input-${dept}-var`, "text");
    varianceGroup.input.readOnly = true;

    // Attach calculation logic
    attachVarianceListener(dailyActual.input, dailyForecast.input, varianceGroup.input);

    // Actions
    const btnContainer = document.createElement('div');
    btnContainer.style.marginTop = '15px';

    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = dateGroup.input.value;
        const actualVal = parseFloat(dailyActual.input.value);
        const forecastVal = parseFloat(dailyForecast.input.value);

        if (!dateVal) {
            DOM.showToast("Please select a date", "error");
            return;
        }

        const record = {
            subtype: 'daily_input',
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                daily_actual: actualVal,
                daily_forecast: forecastVal,
                var1: varianceGroup.input.value
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showToast("Record saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            dateGroup.input.value = '';
            dailyActual.input.value = '';
            dailyForecast.input.value = '';
            varianceGroup.input.value = '';

        } catch (e) {
            console.error(e);
            DOM.showToast("Failed to save", "error");
        }
    });

    btnContainer.appendChild(saveBtn);

    card.appendChild(dateGroup.container);
    card.appendChild(dailyActual.container);
    card.appendChild(dailyForecast.container);
    card.appendChild(varianceGroup.container);
    card.appendChild(btnContainer);
}

// --- Global Helpers for Edit/Delete ---

window.deleteRecord = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
        await deleteKPIRecord(id);
        DOM.showToast("Record deleted successfully");
        // Reload table
        const dept = STATE.currentDept;
        if (dept) loadRecentRecords(dept);
    } catch (e) {
        console.error(e);
        DOM.showToast("Failed to delete record: " + e.message, "error");
    }
};

window.editRecord = (id) => {
    const dept = STATE.currentDept;
    if (!STATE.currentRecords) return;
    const record = STATE.currentRecords.find(r => r.id === id);
    if (!record) return;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (record.subtype === 'fixed_input') {
        const isGeology = dept === 'Geology';

        // 1. KPI
        const kpiSelect = document.getElementById(`input-${dept}-fixed-kpi`);
        if (kpiSelect) {
            kpiSelect.value = record.metric_name;
            kpiSelect.dispatchEvent(new Event('change', { bubbles: true })); // Trigger updateDays
        }

        // 2. Month (Convert YYYY-MM-DD to YYYY-MM)
        const monthInput = document.getElementById(`input-${dept}-target-month`);
        if (monthInput) {
            monthInput.value = record?.date?.substring(0, 7);
            monthInput.dispatchEvent(new Event('change', { bubbles: true })); // Trigger updateDays
        }

        // 3. Days (Only override if value exists, otherwise let updateDays handle it)
        const daysInput = document.getElementById(`input-${dept}-num-days`);
        if (daysInput) {
            daysInput.value = record?.data?.num_days;
        }

        // 4. Forecast
        const fcstInput = document.getElementById(`input-${dept}-full-forecast`);
        if (fcstInput) fcstInput.value = record?.data?.full_forecast;

        // 5. Budget
        const budgInput = document.getElementById(`input-${dept}-full-budget`);
        if (budgInput) budgInput.value = record?.data?.full_budget;

        // 6. Per Rig (Geology)
        if (isGeology) {
            const rigInput = document.getElementById(`input-${dept}-fcst-per-rig`);
            if (rigInput) rigInput.value = record?.data?.forecast_per_rig;
        }

        DOM.showToast("Record loaded for editing");
    } else {
        // Standard Record Edit
        // Set metric
        STATE.currentMetric = record.metric_name;

        // Populate inputs
        const dateInput = document.getElementById(`input-${dept}-date`);
        if (dateInput) dateInput.value = record.date;

        const commentInput = document.getElementById('input-daily-comment');
        if (commentInput) {
            commentInput.value = record.data && record.data.comment ? record.data.comment : '';
        }

        // Data Mapping: Key -> Possible IDs
        const mappings = {
            daily_actual: [`input-${dept}-daily-act`, `input-${dept}-daily-act-pct`, `input-${dept}-actual`],
            daily_act_tonnes: [`input-${dept}-daily-act-tonnes`, `input-${dept}-daily-act-t`],
            daily_act_grade: [`input-${dept}-daily-act-gt`],
            daily_forecast: [`input-${dept}-daily-fcst`, `input-${dept}-daily-fcst-pct`, `input-${dept}-forecast`],
            var1: [`input-${dept}-daily-var`, `input-${dept}-var`],
            mtd_actual: [`input-${dept}-mtd-act`],
            mtd_forecast: [`input-${dept}-mtd-fcst`],
            var2: [`input-${dept}-mtd-var`],
            outlook: [`input-${dept}-outlook`],
            full_forecast: [`input-${dept}-full-fcst`, `input-${dept}-full-forecast`],
            full_budget: [`input-${dept}-full-budg`, `input-${dept}-full-budget`],
            var3: [`input-${dept}-budg-var`, `input-${dept}-full-var`],
            day2: [`input-${dept}-day2`],
            qty_available: [`input-${dept}-qty-avail`],
            num_rigs: [`input-${dept}-rigs`],
            wet_tonnes: [`input-${dept}-wet-tonnes`],
            grade: [`input-${dept}-grade`],
            grade_7: [`input-${dept}-grade-7`]
        };

        if (record.data) {
            for (const [key, possibleIds] of Object.entries(mappings)) {
                let val = record.data[key];
                if (val !== undefined && val !== null) {
                    for (const id of possibleIds) {
                        const input = document.getElementById(id);
                        if (input) {
                            input.value = val;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            // Break after finding one match, assuming only one exists per key
                            break;
                        }
                    }
                }
            }
        }

        DOM.showToast("Record loaded for editing");
    }
};

async function loadRecentRecords(dept) {
    try {
        const allRecords = await fetchKPIRecords(dept);
        STATE.currentRecords = allRecords; // Save for Edit/Delete

        let records = allRecords;
        const startDateStr = document.getElementById('record-start-date')?.value;
        const endDateStr = document.getElementById('record-end-date')?.value;
        
        if (startDateStr || endDateStr) {
            records = records.filter(r => {
                if (!r.date || !r.date.includes('-')) return false;
                
                // Compare strings directly YYYY-MM-DD
                if (startDateStr && r.date < startDateStr) return false;
                if (endDateStr && r.date > endDateStr) return false;
                
                return true;
            });
        }

        const tbody = document.querySelector('#records-table tbody');
        const thead = document.querySelector('#records-table thead tr');
        if (!tbody || !thead) return;
        tbody.innerHTML = '';

        // Remove existing OHS tip banner first (if any)
        const oldTip = document.getElementById('ohs-tip');
        if (oldTip) oldTip.remove();

        // Render OHS tip if applicable
        const hasRecords = records.some(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');
        if (dept === 'OHS' && STATE.currentMetric !== 'Fixed Inputs' && hasRecords) {
            let annualBudget = 24;
            if (STATE.currentMetric === 'Environmental Incidents') {
                annualBudget = 0;
            }
            // Parse active month from start date or fallback to current month
            const targetMonthStr = startDateStr ? startDateStr.substring(0, 7) : new Date().toISOString().substring(0, 7);
            const fixedRec = allRecords.find(r => 
                r.subtype === 'fixed_input' && 
                r.metric_name === STATE.currentMetric && 
                r.date.startsWith(targetMonthStr)
            ) || allRecords.find(r => 
                r.subtype === 'fixed_input' && 
                r.metric_name === STATE.currentMetric
            );

            if (fixedRec && fixedRec.data) {
                if (fixedRec.data.full_budget !== undefined && fixedRec.data.full_budget !== null && fixedRec.data.full_budget !== '') {
                    annualBudget = parseFloat(fixedRec.data.full_budget);
                }
            }

            const roundedForecast = Math.round(annualBudget / 12);
            const cardBody = document.querySelector('#records-table-container .card-body');
            if (cardBody) {
                const tipEl = document.createElement('div');
                tipEl.id = 'ohs-tip';
                tipEl.className = 'alert alert-info d-flex align-items-center m-3';
                tipEl.setAttribute('role', 'alert');
                tipEl.style.borderRadius = '0.5rem';
                tipEl.innerHTML = `
                    <i class="bi bi-info-circle-fill me-2 fs-5"></i>
                    <div>
                        Annual|Full Budget = <strong>${annualBudget}</strong>, MTD|Full Forecast = Annual|Full Budget / 12 = (${annualBudget}/12) = <strong>${roundedForecast}</strong>
                    </div>
                `;
                cardBody.insertBefore(tipEl, cardBody.firstChild);
            }
        }


        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding: 12px; text-align: center;">No records found</td></tr>';
            return;
        }

        let filteredRecords = [];

        // Handling for Fixed Inputs view
        if (STATE.currentMetric === 'Fixed Inputs') {
            // Filter for records with subtype 'fixed_input'
            filteredRecords = records.filter(r => r.subtype === 'fixed_input');

            const hideRigColumn = dept === 'Mining' || dept === 'Crushing' || dept === 'Milling_CIL' || dept === 'OHS' || dept === 'Engineering';

            // Adjust table headers for Fixed Inputs
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left;">Action</th>
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Target Month</th>
                <th style="padding: 12px; text-align: left;">Days</th>
                <th style="padding: 12px; text-align: left;">Full Forecast</th>
                <th style="padding: 12px; text-align: left;">Full Budget</th>
                ${!hideRigColumn ? '<th style="padding: 12px; text-align: left;">Forecast Per Rig</th>' : ''}
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="padding: 12px; text-align: center;">No Fixed Input records found</td></tr>';
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                // Format Date: YYYY-MM-DD -> Month Year
                let dateDisplay = r.date;
                try {
                    const [y, m, d] = r.date.split('-');
                    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                    dateDisplay = dateObj.toLocaleDateString('default', { month: 'long', year: 'numeric' });
                } catch (e) { console.warn("Date parse error", e); }

                // Format Numbers with Commas and round
                const formatNum = (v) => formatDailyTableVal(v);

                // Show "-" for Forecast Per Rig for Exploration Drilling and Toll
                const shouldShowForecastPerRig = r.metric_name !== 'Exploration Drilling' && r.metric_name !== 'Toll';
                const forecastPerRigValue = shouldShowForecastPerRig ? formatNum(r.data.forecast_per_rig) : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                    <td style="padding: 12px;">${r.metric_name}</td>
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${r.data.num_days || '-'}</td>
                    <td style="padding: 12px;">${formatNum(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.full_budget)}</td>
                    ${!hideRigColumn ? `<td style="padding: 12px;">${forecastPerRigValue}</td>` : ''}
                `;
                tbody.appendChild(tr);
            });
            return; // Exit here for Fixed Inputs
        }

        // Handling for Exploration Drilling and Grade Control Drilling (Extended View)
        if (STATE.currentMetric === 'Exploration Drilling' || STATE.currentMetric === 'Grade Control Drilling') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');
            const isExploration = STATE.currentMetric === 'Exploration Drilling';

            // Table headers matching form placeholders
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                ${!isExploration ? '<th style="padding: 12px; text-align: left;">Rigs</th>' : ''}
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                const colspanVal = isExploration ? 15 : 16;
                tbody.innerHTML = `<tr><td colspan="${colspanVal}" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                // DD-MM-YYYY
                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    ${!isExploration ? `<td style="padding: 12px;">${formatDailyTableVal(r.data.num_rigs)}</td>` : ''}
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Toll
        if (STATE.currentMetric === 'Toll') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // KPI, Date, D.Act (Wet), Dry Tonnes, D.Fcst, Var, MTD.Act, MTD.Fcst, Var, Outlook, F.Fcst, F.Budg, Var
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act (Wet)</th>
                <th style="padding: 12px; text-align: left;">Dry.T</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="16" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.wet_tonnes)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Ore Mined
        if (STATE.currentMetric === 'Ore Mined') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | F.Budg | Var% | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="12" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';
                if (r.last_modification && r.last_modification.username) {
                    tr.title = `Updated by ${r.last_modification.username}`;
                    tr.setAttribute('data-bs-toggle', 'tooltip');
                }

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Ore Crushed
        if (STATE.currentMetric === 'Ore Crushed') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | F.Budg | Var% | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="12" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Grade - Ore Mined
        if (STATE.currentMetric === 'Grade - Ore Mined') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | Daily Act (Ton) | Daily Act (g/t) | Daily Fcst | Var % | MTD Act | MTD Fcst | Var % | Outlook | Full Fcst | Full Budg | Var % | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Act(g/t)</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="16" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_act_grade)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Grade Rehandle
        if (STATE.currentMetric === 'Grade Rehandle') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | Daily Act (t) | Daily Act (g/t) | Daily Fcst (g/t) | Var % | Status | MTD Act | MTD Fcst | Var % | Status | Outlook | Full Forecast | Full Budget | Var % | Status | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act(t)</th>
                <th style="padding: 12px; text-align: left;">D.Act(g/t)</th>
                <th style="padding: 12px; text-align: left;">D.Fcst(g/t)</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="16" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_act_grade)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">-</td>
                    <td style="padding: 12px;">-</td>
                    <td style="padding: 12px;">-</td>
                    <td style="padding: 12px;">-</td>
                    <td style="padding: 12px; text-align: center;">-</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Grade - Ore Crushed
        if (STATE.currentMetric === 'Grade - Ore Crushed') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | Daily Act (Ton) | Daily Act (g/t) | Daily Fcst | Var % | MTD Act | MTD Fcst | Var % | Outlook | Full Fcst | Full Budg | Var % | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act(t)</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="16" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                // Note: Saved as daily_act_tonnes (Tonnage) and daily_actual (Grade)
                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_act_tonnes)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Total Material Moved
        if (STATE.currentMetric === 'Total Material Moved') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(bcm)</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast(bcm)</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="15" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                // Note: Using specific keys saved in renderMiningMaterialForm (daily_var, mtd_var, budget_var)
                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_var)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.daily_var)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_var)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.mtd_var)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.budget_var)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.budget_var)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Blast Hole Drilling
        if (STATE.currentMetric === 'Blast Hole Drilling') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="15" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Recovery (Milling CIL)
        if (STATE.currentMetric === 'Recovery') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | F.Budg | Var% | Day-2 | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="16" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}%</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}%</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}%</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.day2)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Plant Feed Grade (Milling CIL)
        if (STATE.currentMetric === 'Plant Feed Grade') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act(t) | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | F.Budg | Var% | Day-2 | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act(t)</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="17" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_act_tonnes)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.day2)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Tonnes Treated (Milling CIL)
        if (STATE.currentMetric === 'Tonnes Treated') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | F.Budg | Var% | Day-2 | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="16" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                const formatNum = (v) => formatDailyTableVal(v);

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatNum(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.day2)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Gold Recovery
        if (STATE.currentMetric === 'Gold Recovery') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | F.Budg | Var% | Day-2 | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="16" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.day2)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Gold Contained
        if (STATE.currentMetric === 'Gold Contained') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | F.Budg | Var% | Day-2 | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="16" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.day2)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Anx Excavators OR Dump Trucks OR ART Dump Trucks OR Wheel Loaders OR Graders (Identical columns)
        if (STATE.currentMetric === 'Anx Excavators' || STATE.currentMetric === 'Dump Trucks' || STATE.currentMetric === 'ART Dump Trucks' || STATE.currentMetric === 'Wheel Loaders' || STATE.currentMetric === 'Graders') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | Qty Avail | D.Act(%) | D.Fcst(%) | Var% | MTD.Act | MTD.Fcst | Var% | F.Fcst | F.Budg | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">Qty Avail</th>
                <th style="padding: 12px; text-align: left;">D.Act(%)</th>
                <th style="padding: 12px; text-align: left;">D.Fcst(%)</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="13" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.qty_available)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Safety Incidents and Near Miss
        if (STATE.currentMetric === 'Safety Incidents' || STATE.currentMetric === 'Near Miss') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | Var% | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="14" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Environmental Incidents
        if (STATE.currentMetric === 'Environmental Incidents') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | Var% | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="14" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }



        // Handling for Property Damage
        if (STATE.currentMetric === 'Property Damage') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act | D.Fcst | Var% | MTD.Act | MTD.Fcst | Var% | Outlook | F.Fcst | Var% | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">D.Act</th>
                <th style="padding: 12px; text-align: left;">D.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="14" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var3)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Light Vehicles and Tipper Trucks
        if (STATE.currentMetric === 'Light Vehicles' || STATE.currentMetric === 'Tipper Trucks' || STATE.currentMetric === 'Pumps' || STATE.currentMetric === 'Drill Rigs') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | Qty Avail | D.Act(%) | D.Fcst(%) | Var% | MTD.Act | MTD.Fcst | Var% | F.Fcst | F.Budg | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">Qty Avail</th>
                <th style="padding: 12px; text-align: left;">D.Act(%)</th>
                <th style="padding: 12px; text-align: left;">D.Fcst(%)</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="13" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.qty_available)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Prime Excavators
        if (STATE.currentMetric === 'Prime Excavators') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | Qty Avail | D.Act(%) | D.Fcst(%) | Var% | MTD.Act | MTD.Fcst | Var% | F.Fcst | F.Budg | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">Qty Avail</th>
                <th style="padding: 12px; text-align: left;">D.Act(%)</th>
                <th style="padding: 12px; text-align: left;">D.Fcst(%)</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="13" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
                return;
            }

            filteredRecords.forEach(r => {
                const tr = document.createElement('tr');
                tr.style.borderTop = '1px solid #e5e7eb';

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.qty_available)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.var2)}</td>
                    <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatDailyTableVal(r.data.full_budget)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Standard Handling
        // Restore standard headers if they were changed
        if (thead.cells[2].textContent !== 'Daily Actual') {
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Metric</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Var %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;
        }

        // Standard records only - exclude Fixed Inputs to prevent duplication in Daily Input views
        filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

        if (filteredRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding: 12px; text-align: center;">No records found for ' + STATE.currentMetric + '</td></tr>';
            return;
        }

        filteredRecords.forEach(r => {
            const tr = document.createElement('tr');
            tr.style.borderTop = '1px solid #e5e7eb';
            tr.innerHTML = `
                <td style="padding: 12px;">${r.date}</td>
                <td style="padding: 12px;">${r.metric_name}</td>
                <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_actual)}</td>
                <td style="padding: 12px;">${formatDailyTableVal(r.data.daily_forecast)}</td>
                <td style="padding: 12px;">${formatDailyTableVal(r.data.var1)}</td>
                <td style="padding: 12px; text-align: center;">${window.getStatusEmoji(r.data.var1)}</td>
                <td style="padding: 12px;">
                    <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                    <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error loading records", e);
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDailyTableVal(v) {
    if (v === undefined || v === null || v === '' || v === '-') return '-';
    if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed.endsWith('%')) {
            const numStr = trimmed.slice(0, -1).trim();
            const parsed = parseFloat(numStr);
            if (!isNaN(parsed)) {
                return Math.round(parsed) + '%';
            }
            return v;
        }
    }
    const parsed = parseFloat(v);
    if (!isNaN(parsed)) {
        if (parsed % 1 !== 0 && parsed < 10) {
            return parseFloat(parsed.toFixed(2)).toLocaleString();
        }
        return Math.round(parsed).toLocaleString();
    }
    return v;
}


function getRoleBadgeClass(role) {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'role-badge-admin';
    if (r === 'gm') return 'role-badge-gm';
    if (r === 'hod') return 'role-badge-hod';
    return 'role-badge-staff';
}

function getInitials(user) {
    if (user.full_name) {
        return user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return (user.username || '?')[0].toUpperCase();
}

function switchToMainLayout() {
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    app.classList.remove('auth-mode');
    content.classList.remove('auth-layout');
    content.className = 'main-content fade-in';
    sidebar.classList.add('show');
}

// ---------------------------------------------------------------------------
// User Management Page (Admin only)
// ---------------------------------------------------------------------------

window.renderUserManagementPage = async function () {
    if (!STATE.currentUser || (STATE.currentUser.role || '').toLowerCase() !== 'admin') {
        DOM.showToast('Access Denied: Admin only', 'error');
        return;
    }

    STATE.currentView = 'users';
    switchToMainLayout();
    renderSidebar();
    syncRouteHashFromState();

    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h2 class="mb-1"><i class="bi bi-people-fill me-2 text-primary"></i>User Management</h2>
                <p class="text-muted mb-0 small">Manage user accounts, roles, and access</p>
            </div>
            <button class="btn btn-primary" id="btn-add-user" onclick="showAddUserModal()">
                <i class="bi bi-person-plus-fill me-2"></i>Add User
            </button>
        </div>

        <!-- Search Bar -->
        <div class="user-search-bar mb-4">
            <i class="bi bi-search text-muted"></i>
            <input type="text" id="user-search-input" class="user-search-input" placeholder="Search by name, username, email, department…" oninput="filterUserTable()">
            <select id="user-role-filter" class="form-select form-select-sm px-5" style="width:auto;" onchange="filterUserTable()">
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="GM">GM</option>
                <option value="HOD">HOD</option>
                <option value="Staff">Staff</option>
            </select>
            <select id="user-status-filter" class="form-select form-select-sm px-5" style="width:auto;" onchange="filterUserTable()">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
            </select>
        </div>

        <!-- Users Table -->
        <div class="card">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0" id="users-table">
                        <thead>
                            <tr>
                                <th style="width:40px;"></th>
                                <th>Name / Username</th>
                                <th>Email</th>
                                <th>Metric Access</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-tbody">
                            <tr><td colspan="7" class="text-center py-4">
                                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                                <span class="ms-2 text-muted">Loading users…</span>
                            </td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Inject modals
    injectUserModals();
    await loadUsersTable();
};

window.ALL_USERS_DATA = [];

async function loadUsersTable() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    try {
        const users = await fetchUsers();
        window.ALL_USERS_DATA = users;
        renderUserRows(users);
    } catch (e) {
        const tbody = document.getElementById('users-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>${e.message}</td></tr>`;
    }
}

function renderUserRows(users) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No users found</td></tr>';
        return;
    }

    const currentUserId = STATE.currentUser ? STATE.currentUser.id : null;

    tbody.innerHTML = users.map(user => {
        const isDisabled = user.disabled;
        const isSelf = user.id === currentUserId;
        const initials = getInitials(user);
        const roleBadge = getRoleBadgeClass(user.role);

        return `
            <tr id="user-row-${user.id}" style="${isDisabled ? 'opacity:0.6;' : ''}">
                <td>
                    <div class="user-avatar-sm">${initials}</div>
                </td>
                <td>
                    <div class="fw-semibold">${user.full_name || '—'}</div>
                    <div class="text-muted small">@${user.username}${isSelf ? ' <span class="badge bg-secondary">You</span>' : ''}</div>
                </td>
                <td class="text-muted small">${user.email || '—'}</td>
                <td class="text-muted small">${(user.departments || []).join(', ') || '—'}</td>
                <td><span class="role-badge ${roleBadge}">${user.role || 'user'}</span></td>
                <td>
                    <span class="status-badge ${isDisabled ? 'status-badge-disabled' : 'status-badge-active'}">
                        <i class="bi bi-${isDisabled ? 'x-circle' : 'check-circle'}"></i>
                        ${isDisabled ? 'Disabled' : 'Active'}
                    </span>
                </td>
                <td class="text-end">
                    <div class="d-flex gap-1 justify-content-end">
                        <button class="action-icon-btn action-icon-btn-edit" onclick="showEditUserModal(${user.id})" title="Edit User">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-icon-btn action-icon-btn-reset" onclick="showResetPasswordModal(${user.id}, '${user.username}')" title="Reset Password">
                            <i class="bi bi-key"></i>
                        </button>
                        ${!isSelf ? `
                        <button class="action-icon-btn action-icon-btn-toggle ${isDisabled ? 'is-disabled' : ''}"
                            onclick="confirmToggleStatus(${user.id}, '${user.username}', ${isDisabled})"
                            title="${isDisabled ? 'Enable User' : 'Disable User'}">
                            <i class="bi bi-${isDisabled ? 'person-check' : 'person-dash'}"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.filterUserTable = function () {
    const search = (document.getElementById('user-search-input')?.value || '').toLowerCase();
    const roleFilter = (document.getElementById('user-role-filter')?.value || '').toLowerCase();
    const statusFilter = (document.getElementById('user-status-filter')?.value || '').toLowerCase();

    const filtered = (window.ALL_USERS_DATA || []).filter(u => {
            (u.username || '').toLowerCase().includes(search) ||
            (u.full_name || '').toLowerCase().includes(search) ||
            (u.email || '').toLowerCase().includes(search) ||
            (u.departments || []).some(d => d.toLowerCase().includes(search));

        const matchRole = !roleFilter || (u.role || '').toLowerCase() === roleFilter;
        const matchStatus = !statusFilter ||
            (statusFilter === 'active' && !u.disabled) ||
            (statusFilter === 'disabled' && u.disabled);

        return matchSearch && matchRole && matchStatus;
    });

    renderUserRows(filtered);
};

// ---- Modals ----

function injectUserModals() {
    // Remove existing if present
    ['modal-add-user', 'modal-edit-user', 'modal-reset-pw', 'modal-toggle-status'].forEach(id => {
        const old = document.getElementById(id);
        if (old) old.remove();
    });

    const ROLES = ['Admin', 'GM', 'HOD', 'Staff'];
    const deptOptions = ['Management', ...DEPARTMENTS].map(d => `<option value="${d}">${d.replace('_', ' ')}</option>`).join('');
    const roleOptions = ROLES.map(r => `<option value="${r}">${r}</option>`).join('');

    document.body.insertAdjacentHTML('beforeend', `
    <!-- Add User Modal -->
    <div class="modal fade" id="modal-add-user" tabindex="-1" aria-labelledby="modal-add-user-label" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius:16px;overflow:hidden;">
          <div class="modal-header modal-header-custom">
            <h5 class="modal-title" id="modal-add-user-label"><i class="bi bi-person-plus-fill me-2"></i>Add New User</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label fw-semibold small">Username <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="add-username" placeholder="e.g. jdoe">
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold small">Full Name</label>
                <input type="text" class="form-control" id="add-fullname" placeholder="e.g. John Doe">
              </div>
              <div class="col-md-12">
                <label class="form-label fw-semibold small">Corporate Email <span class="text-danger">*</span></label>
                <input type="email" class="form-control" id="add-email" placeholder="user@adamusgh.com">
                <div class="form-text" style="font-size: 0.75rem;">A confirmation email will be sent to this address.</div>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small">Phone</label>
                <input type="text" class="form-control" id="add-phone" placeholder="+233 …">
              </div>
              <div class="col-12" id="add-dept-container">
                <!-- Checkboxes will be injected here -->
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small">Role</label>
                <select class="form-select" id="add-role">${roleOptions}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small">Password <span class="text-danger">*</span></label>
                <input type="password" class="form-control" id="add-password" placeholder="Min. 6 characters">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small">Confirm Password <span class="text-danger">*</span></label>
                <input type="password" class="form-control" id="add-confirm" placeholder="Repeat password">
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0 px-4 pb-4">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="submitAddUser()">
                <i class="bi bi-check-circle me-1"></i>Create User
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div class="modal fade" id="modal-edit-user" tabindex="-1" aria-labelledby="modal-edit-user-label" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius:16px;overflow:hidden;">
          <div class="modal-header modal-header-custom">
            <h5 class="modal-title" id="modal-edit-user-label"><i class="bi bi-pencil-square me-2"></i>Edit User</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <input type="hidden" id="edit-user-id">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label fw-semibold small">Full Name</label>
                <input type="text" class="form-control" id="edit-fullname">
              </div>
              <div class="col-md-12">
                <label class="form-label fw-semibold small">Corporate Email <span class="text-danger">*</span></label>
                <input type="email" class="form-control" id="edit-email" placeholder="user@adamusgh.com">
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small">Phone</label>
                <input type="text" class="form-control" id="edit-phone">
              </div>
              <div class="col-12" id="edit-dept-container">
                <!-- Checkboxes will be injected here -->
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold small">Role</label>
                <select class="form-select" id="edit-role">${roleOptions}</select>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0 px-4 pb-4">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="submitEditUser()">
                <i class="bi bi-save me-1"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div class="modal fade" id="modal-reset-pw" tabindex="-1" aria-labelledby="modal-reset-pw-label" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content" style="border-radius:16px;overflow:hidden;">
          <div class="modal-header modal-header-custom">
            <h5 class="modal-title" id="modal-reset-pw-label"><i class="bi bi-key-fill me-2"></i>Reset Password</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted small mb-3">Set a new password for <strong id="reset-pw-username"></strong>.</p>
            <input type="hidden" id="reset-pw-user-id">
            <div class="mb-3">
              <label class="form-label fw-semibold small">New Password <span class="text-danger">*</span></label>
              <input type="password" class="form-control" id="reset-new-pw" placeholder="Min. 6 characters">
            </div>
            <div>
              <label class="form-label fw-semibold small">Confirm New Password <span class="text-danger">*</span></label>
              <input type="password" class="form-control" id="reset-confirm-pw" placeholder="Repeat password">
            </div>
          </div>
          <div class="modal-footer border-0 pt-0 px-4 pb-4">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-warning text-white" onclick="submitResetPassword()">
                <i class="bi bi-key me-1"></i>Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Status Confirmation Modal -->
    <div class="modal fade" id="modal-toggle-status" tabindex="-1" aria-labelledby="modal-toggle-status-label" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content" style="border-radius:16px;overflow:hidden;">
          <div class="modal-header modal-header-custom">
            <h5 class="modal-title" id="modal-toggle-status-label"><i class="bi bi-person-dash me-2"></i>Confirm Action</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <input type="hidden" id="toggle-user-id">
            <p id="toggle-confirm-msg" class="mb-0"></p>
          </div>
          <div class="modal-footer border-0 pt-0 px-4 pb-4">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" id="btn-confirm-toggle" class="btn btn-danger" onclick="submitToggleStatus()">Confirm</button>
          </div>
        </div>
      </div>
    </div>
    `);
}

window.ADD_DEPT_CHECKS = null;
window.EDIT_DEPT_CHECKS = null;

window.showAddUserModal = function () {
    ['add-username', 'add-fullname', 'add-email', 'add-phone', 'add-password', 'add-confirm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    // Set default role to Staff
    const roleEl = document.getElementById('add-role');
    if (roleEl) roleEl.value = 'Staff';
    
    // Inject Checkboxes
    const container = document.getElementById('add-dept-container');
    if (container) {
        container.innerHTML = '';
        window.ADD_DEPT_CHECKS = DOM.createCheckboxGroup('Metric Access', 'add-access-checks', METRIC_ACCESS_OPTIONS);
        container.appendChild(window.ADD_DEPT_CHECKS.container);
    }

    const modal = new bootstrap.Modal(document.getElementById('modal-add-user'));
    
    // Add real-time validation listener
    const emailInput = document.getElementById('add-email');
    if (emailInput) {
        emailInput.classList.remove('is-invalid', 'is-valid');
        emailInput.oninput = () => {
            if (!emailInput.value) {
                emailInput.classList.remove('is-invalid', 'is-valid');
                return;
            }
            if (validateAdamusEmail(emailInput.value)) {
                emailInput.classList.remove('is-invalid');
                emailInput.classList.add('is-valid');
            } else {
                emailInput.classList.remove('is-valid');
                emailInput.classList.add('is-invalid');
            }
        };
    }

    modal.show();
};

window.submitAddUser = async function () {
    const username = document.getElementById('add-username')?.value.trim();
    const fullName = document.getElementById('add-fullname')?.value.trim();
    const email = document.getElementById('add-email')?.value.trim();
    const phone = document.getElementById('add-phone')?.value.trim();
    const depts = window.ADD_DEPT_CHECKS ? window.ADD_DEPT_CHECKS.getValues() : [];
    const role = document.getElementById('add-role')?.value;
    const password = document.getElementById('add-password')?.value;
    const confirm = document.getElementById('add-confirm')?.value;

    if (!username || !password || !email) { DOM.showToast('Username, Email, and Password are required', 'error'); return; }
    if (!validateAdamusEmail(email)) { DOM.showToast('Only @adamusgh.com emails are allowed', 'error'); return; }
    if (password !== confirm) { DOM.showToast('Passwords do not match', 'error'); return; }
    if (password.length < 6) { DOM.showToast('Password must be at least 6 characters', 'error'); return; }

    try {
        await createUser({ username, full_name: fullName || null, email: email || null, phone_number: phone || null, departments: depts, role, password });
        bootstrap.Modal.getInstance(document.getElementById('modal-add-user'))?.hide();
        DOM.showToast('User created! Confirmation email sent.', 'success');
        await loadUsersTable();
    } catch (e) {
        DOM.showToast(e.message, 'error');
    }
};

window.showEditUserModal = function (userId) {
    const user = (window.ALL_USERS_DATA || []).find(u => u.id === userId);
    if (!user) { DOM.showToast('User not found', 'error'); return; }

    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-fullname').value = user.full_name || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-phone').value = user.phone_number || '';
    document.getElementById('edit-role').value = user.role || 'user';

    // Inject Checkboxes
    const container = document.getElementById('edit-dept-container');
    if (container) {
        container.innerHTML = '';
        window.EDIT_DEPT_CHECKS = DOM.createCheckboxGroup('Metric Access', 'edit-access-checks', METRIC_ACCESS_OPTIONS);
        container.appendChild(window.EDIT_DEPT_CHECKS.container);
        window.EDIT_DEPT_CHECKS.setValues(user.departments || []);
    }

    document.getElementById('modal-edit-user-label').innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit — @${user.username}`;

    const modal = new bootstrap.Modal(document.getElementById('modal-edit-user'));
    
    // Add real-time validation listener
    const emailInput = document.getElementById('edit-email');
    if (emailInput) {
        emailInput.classList.remove('is-invalid');
        if (validateAdamusEmail(emailInput.value)) emailInput.classList.add('is-valid');
        
        emailInput.oninput = () => {
            if (!emailInput.value) {
                emailInput.classList.remove('is-invalid', 'is-valid');
                return;
            }
            if (validateAdamusEmail(emailInput.value)) {
                emailInput.classList.remove('is-invalid');
                emailInput.classList.add('is-valid');
            } else {
                emailInput.classList.remove('is-valid');
                emailInput.classList.add('is-invalid');
            }
        };
    }

    modal.show();
};

window.submitEditUser = async function () {
    const userId = parseInt(document.getElementById('edit-user-id')?.value);
    const fullName = document.getElementById('edit-fullname')?.value.trim();
    const email = document.getElementById('edit-email')?.value.trim();
    const phone = document.getElementById('edit-phone')?.value.trim();
    const depts = window.EDIT_DEPT_CHECKS ? window.EDIT_DEPT_CHECKS.getValues() : [];
    const role = document.getElementById('edit-role')?.value;

    if (!userId) return;

    try {
        await updateUser(userId, {
            full_name: fullName || null,
            email: email || null,
            phone_number: phone || null,
            departments: depts,
            role: role
        });
        bootstrap.Modal.getInstance(document.getElementById('modal-edit-user'))?.hide();
        DOM.showToast('User updated successfully!', 'success');
        await loadUsersTable();
    } catch (e) {
        DOM.showToast(e.message, 'error');
    }
};

window.showResetPasswordModal = function (userId, username) {
    document.getElementById('reset-pw-user-id').value = userId;
    document.getElementById('reset-pw-username').textContent = `@${username}`;
    document.getElementById('reset-new-pw').value = '';
    document.getElementById('reset-confirm-pw').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modal-reset-pw'));
    modal.show();
};

window.submitResetPassword = async function () {
    const userId = parseInt(document.getElementById('reset-pw-user-id')?.value);
    const newPw = document.getElementById('reset-new-pw')?.value;
    const confirmPw = document.getElementById('reset-confirm-pw')?.value;

    if (!newPw || newPw.length < 6) { DOM.showToast('Password must be at least 6 characters', 'error'); return; }
    if (newPw !== confirmPw) { DOM.showToast('Passwords do not match', 'error'); return; }

    try {
        await resetUserPassword(userId, newPw);
        bootstrap.Modal.getInstance(document.getElementById('modal-reset-pw'))?.hide();
        DOM.showToast('Password reset successfully!', 'success');
    } catch (e) {
        DOM.showToast(e.message, 'error');
    }
};

window.confirmToggleStatus = function (userId, username, isCurrentlyDisabled) {
    document.getElementById('toggle-user-id').value = userId;
    const msg = document.getElementById('toggle-confirm-msg');
    const btn = document.getElementById('btn-confirm-toggle');

    if (isCurrentlyDisabled) {
        msg.innerHTML = `Are you sure you want to <strong class="text-success">enable</strong> the account for <strong>@${username}</strong>?`;
        btn.className = 'btn btn-success';
        btn.innerHTML = '<i class="bi bi-person-check me-1"></i>Enable';
    } else {
        msg.innerHTML = `Are you sure you want to <strong class="text-danger">disable</strong> the account for <strong>@${username}</strong>? They will not be able to log in.`;
        btn.className = 'btn btn-danger';
        btn.innerHTML = '<i class="bi bi-person-dash me-1"></i>Disable';
    }

    const modal = new bootstrap.Modal(document.getElementById('modal-toggle-status'));
    modal.show();
};

window.submitToggleStatus = async function () {
    const userId = parseInt(document.getElementById('toggle-user-id')?.value);
    if (!userId) return;

    try {
        await toggleUserStatus(userId);
        bootstrap.Modal.getInstance(document.getElementById('modal-toggle-status'))?.hide();
        DOM.showToast('User status updated', 'success');
        await loadUsersTable();
    } catch (e) {
        DOM.showToast(e.message, 'error');
    }
};

// ---------------------------------------------------------------------------
// My Profile Page
// ---------------------------------------------------------------------------

window.renderMyProfilePage = async function () {
    STATE.currentView = 'profile';
    switchToMainLayout();
    renderSidebar();
    syncRouteHashFromState();

    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="d-flex align-items-center mb-4">
            <h2 class="mb-0"><i class="bi bi-person-circle me-2 text-primary"></i>My Profile</h2>
        </div>
        <div class="row g-4" id="profile-content">
            <div class="col-12 text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
        </div>
    `;

    try {
        const me = await fetchMe();
        renderProfileContent(me);
    } catch (e) {
        document.getElementById('profile-content').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>${e.message}</div>
            </div>`;
    }
};

function renderProfileContent(user) {
    const initials = getInitials(user);
    const roleBadge = getRoleBadgeClass(user.role);
    const container = document.getElementById('profile-content');

    container.innerHTML = `
        <!-- Profile Hero Card -->
        <div class="col-12 col-lg-4">
            <div class="profile-card mb-4">
                <div class="d-flex align-items-center gap-3 mb-4" style="position:relative;z-index:1;">
                    <div class="profile-avatar-lg">${initials}</div>
                    <div>
                        <div class="fw-bold fs-5">${user.full_name || user.username}</div>
                        <div class="text-muted" style="color:#adb5bd!important;">@${user.username}</div>
                        <div class="mt-1"><span class="role-badge ${roleBadge}">${user.role || 'user'}</span></div>
                    </div>
                </div>

                <div style="position:relative;z-index:1;">
                    ${user.email ? `<div class="d-flex align-items-center gap-2 mb-2" style="color:#adb5bd;">
                        <i class="bi bi-envelope-fill"></i><span class="small">${user.email}</span>
                    </div>` : ''}
                    ${user.phone_number ? `<div class="d-flex align-items-center gap-2 mb-2" style="color:#adb5bd;">
                        <i class="bi bi-telephone-fill"></i><span class="small">${user.phone_number}</span>
                    </div>` : ''}
                    ${user.departments && user.departments.length > 0 ? `<div class="d-flex align-items-center gap-2 mb-2" style="color:#adb5bd;">
                        <i class="bi bi-building"></i><span class="small">${user.departments.join(', ')}</span>
                    </div>` : ''}
                    <div class="d-flex align-items-center gap-2" style="color:#adb5bd;">
                        <i class="bi bi-shield-check-fill"></i>
                        <span class="small">Account is <strong style="color:${user.disabled ? '#ef4444' : '#10b981'}">${user.disabled ? 'Disabled' : 'Active'}</strong></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Change Password Card -->
        <div class="col-12 col-lg-8">
            <div class="card">
                <div class="card-header d-flex align-items-center gap-2">
                    <i class="bi bi-shield-lock-fill text-primary"></i>
                    <h5 class="mb-0">Change Password</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3" style="max-width:480px;">
                        <div class="col-12">
                            <label class="form-label fw-semibold small">Current Password <span class="text-danger">*</span></label>
                            <input type="password" class="form-control" id="profile-current-pw" placeholder="Enter current password">
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold small">New Password <span class="text-danger">*</span></label>
                            <input type="password" class="form-control" id="profile-new-pw" placeholder="Min. 6 characters">
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold small">Confirm New Password <span class="text-danger">*</span></label>
                            <input type="password" class="form-control" id="profile-confirm-pw" placeholder="Repeat new password">
                        </div>
                        <div class="col-12">
                            <button class="btn btn-primary" onclick="submitChangeMyPassword()">
                                <i class="bi bi-shield-lock me-2"></i>Update Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Account Details Card -->
            <div class="card mt-4">
                <div class="card-header d-flex align-items-center gap-2">
                    <i class="bi bi-info-circle-fill text-primary"></i>
                    <h5 class="mb-0">Account Details</h5>
                </div>
                <div class="card-body">
                    <div class="profile-info-row">
                        <div class="profile-info-icon"><i class="bi bi-person"></i></div>
                        <div>
                            <div class="small text-muted">Full Name</div>
                            <div class="fw-semibold">${user.full_name || '—'}</div>
                        </div>
                    </div>
                    <div class="profile-info-row">
                        <div class="profile-info-icon"><i class="bi bi-at"></i></div>
                        <div>
                            <div class="small text-muted">Username</div>
                            <div class="fw-semibold">${user.username}</div>
                        </div>
                    </div>
                    <div class="profile-info-row">
                        <div class="profile-info-icon"><i class="bi bi-envelope"></i></div>
                        <div>
                            <div class="small text-muted">Email</div>
                            <div class="fw-semibold">${user.email || '—'}</div>
                        </div>
                    </div>
                    <div class="profile-info-row">
                        <div class="profile-info-icon"><i class="bi bi-telephone"></i></div>
                        <div>
                            <div class="small text-muted">Phone</div>
                            <div class="fw-semibold">${user.phone_number || '—'}</div>
                        </div>
                    </div>
                    <div class="profile-info-row">
                        <div class="profile-info-icon"><i class="bi bi-building"></i></div>
                        <div>
                            <div class="small text-muted">Department</div>
                            <div class="fw-semibold">${user.department || '—'}</div>
                        </div>
                    </div>
                    <div class="profile-info-row">
                        <div class="profile-info-icon"><i class="bi bi-shield"></i></div>
                        <div>
                            <div class="small text-muted">Role</div>
                            <div class="fw-semibold"><span class="role-badge ${roleBadge}">${user.role || 'user'}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.submitChangeMyPassword = async function () {
    const currentPw = document.getElementById('profile-current-pw')?.value;
    const newPw = document.getElementById('profile-new-pw')?.value;
    const confirmPw = document.getElementById('profile-confirm-pw')?.value;

    if (!currentPw || !newPw) { DOM.showToast('All password fields are required', 'error'); return; }
    if (newPw.length < 6) { DOM.showToast('New password must be at least 6 characters', 'error'); return; }
    if (newPw !== confirmPw) { DOM.showToast('New passwords do not match', 'error'); return; }

    try {
        await changeMyPassword(currentPw, newPw);
        DOM.showToast('Password changed successfully!', 'success');
        document.getElementById('profile-current-pw').value = '';
        document.getElementById('profile-new-pw').value = '';
        document.getElementById('profile-confirm-pw').value = '';
    } catch (e) {
        DOM.showToast(e.message, 'error');
    }
};

// Update loadDepartmentView to reset currentView
const _originalLoadDeptView = window.loadDepartmentView;
window.loadDepartmentView = async function(dept) {
    STATE.currentView = 'dept';
    await _originalLoadDeptView(dept);
    syncRouteHashFromState();
};

// ---------------------------------------------------------------------------
// Summary Dashboard Page
// ---------------------------------------------------------------------------

const SUMMARY_METRIC_ORDER = {
    "OHS": ["Safety Incidents", "Environmental Incidents", "Property Damage", "Near Miss"],
    "Milling_CIL": ["Gold Contained", "Gold Recovery", "Recovery", "Plant Feed Grade", "Tonnes Treated"],
    "Crushing": ["Ore Crushed", "Grade - Ore Crushed"],
    "Mining": ["Ore Mined", "Grade - Ore Mined", "Grade Rehandle", "Total Material Moved", "Blast Hole Drilling"],
    "Geology": ["Grade Control Drilling", "Toll", "Exploration Drilling"],
    "Engineering": ["Tipper Trucks", "Prime Excavators", "Anx Excavators", "Dump Trucks", "ART Dump Trucks", "Wheel Loaders", "Graders", "Dozers", "Crusher", "Mill", "Light Vehicles", "Pumps", "Drill Rigs"]
};

const DEPT_DISPLAY = {
    "OHS": "OHS", "Milling_CIL": "Milling/CIL", "Crushing": "Crushing",
    "Mining": "Mining", "Geology": "Geology", "Engineering": "Engineering"
};

const DEPT_SECONDARY_LABEL = {
    "OHS": "", "Milling_CIL": "Day-2", "Crushing": "",
    "Mining": "", "Geology": "", "Engineering": "Qty Available"
};

function summarySparkline(vals, isOHS) {
    const valid = (vals || []).map(v => (v !== null && v !== undefined) ? v : null);
    const nums = valid.filter(v => v !== null);
    if (nums.length < 2) return '';
    const w = 80, h = 22, pad = 2;
    const mn = Math.min(...nums), mx = Math.max(...nums);
    const range = mx - mn || 1;
    const pts = [];
    for (let i = 0; i < valid.length; i++) {
        if (valid[i] !== null) {
            const x = pad + (i / (valid.length - 1)) * (w - 2 * pad);
            const y = pad + (1 - (valid[i] - mn) / range) * (h - 2 * pad);
            pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
    }
    const first = nums[0], last = nums[nums.length - 1];
    let col = '#d2ab67';
    if (last > first) col = isOHS ? '#ef4444' : '#22c55e';
    else if (last < first) col = isOHS ? '#22c55e' : '#ef4444';
    return `<svg width="${w}" height="${h}"><polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function svarClass(varStr) {
    if (!varStr || varStr === '-' || varStr === '') return 'svar-na';
    const n = parseFloat(String(varStr).replace(/[%,\s]/g, ''));
    if (isNaN(n)) return 'svar-na';
    if (n > 0) return 'svar-pos';
    if (n < 0) return 'svar-neg';
    return 'svar-zero';
}

function sstatusHtml(varStr) {
    if (!varStr || varStr === '-' || varStr === '') return '';
    const n = parseFloat(String(varStr).replace(/[%,\s]/g, ''));
    if (isNaN(n)) return '';
    return n >= 0 ? '🙂' : '😟';
}

function fmtVal(v) {
    if (v === null || v === undefined || v === '') return '';
    const s = String(v);
    const n = parseFloat(s.replace(/,/g, ''));
    if (isNaN(n)) return s;
    if (s.includes('%')) return s;
    
    // Format float values to hide decimals for integers while keeping them for grades
    if (!Number.isInteger(n)) {
        if (n < 10) {
            return parseFloat(n.toFixed(2)).toLocaleString();
        }
        return Math.round(n).toLocaleString();
    }
    
    if (Number.isInteger(n) && Math.abs(n) >= 1000) return n.toLocaleString();
    return s;
}

function getSecondaryVal(dept, data) {
    if (dept === 'Milling_CIL') return fmtVal(data.day_2 ?? '');
    if (dept === 'Engineering') return fmtVal(data.qty_available ?? '');
    return '';
}

window.renderSummaryDashboardPage = async function () {
    STATE.currentView = 'summary';
    switchToMainLayout();
    renderSidebar();

    const today = new Date().toISOString().slice(0, 10);
    const selectedDate = STATE.summaryDate || today;
    
    // Default to the correct date in the state if not set
    if (!STATE.summaryDate) {
        STATE.summaryDate = selectedDate;
    }
    
    syncRouteHashFromState();

    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="summary-header" id="summary-export-header">
            <div class="summary-date-box" data-html2canvas-ignore>
                <label>Selected Date:</label>
                <input type="date" id="summary-date-input" value="${selectedDate}">
            </div>
            <div class="summary-header-title">Adamus Resources Limited KPI – <span id="summary-header-year">${selectedDate.substring(0, 4)}</span></div>
            <div class="d-flex justify-content-end align-items-center" data-html2canvas-ignore>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" id="dropdownExportButton" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-download me-1"></i> Export As...
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="dropdownExportButton">
                        <li><a class="dropdown-item" href="#" id="btn-export-pdf"><i class="bi bi-file-earmark-pdf me-2 text-danger"></i>PDF Document</a></li>
                        <li><a class="dropdown-item" href="#" id="btn-export-png"><i class="bi bi-image me-2 text-primary"></i>PNG Image</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="summary-table-wrap" id="summary-export-content">
            <div id="summary-table-container" class="text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
                <span class="ms-2 text-muted">Loading summary…</span>
            </div>
        </div>
    `;

    document.getElementById('summary-date-input').addEventListener('change', function () {
        document.getElementById('summary-header-year').textContent = this.value.substring(0, 4);
        STATE.summaryDate = this.value;
        syncRouteHashFromState();
        loadSummaryData(this.value);
    });

    const handleExport = function(format) {
        return function(e) {
            e.preventDefault();
            if (typeof html2pdf === 'undefined') {
                DOM.showToast("Export library is still loading. Please try again.", "warning");
                return;
            }

            const activeDate = document.getElementById('summary-date-input').value;
            const toggleBtn = document.getElementById('dropdownExportButton');
            const originalHtml = toggleBtn.innerHTML;
            toggleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Exporting...';
            toggleBtn.disabled = true;

            // Create a temporary container for capturing
            const container = document.createElement('div');
            container.className = 'export-temp-container';
            container.style.padding = '40px';
            container.style.backgroundColor = '#ffffff';
            container.style.color = '#000000';
            container.style.width = 'max-content'; // Dynamic width to fit full table
            container.style.display = 'inline-block'; // Allow expansion beyond viewport

            // Clone header and content
            const headerHtml = document.getElementById('summary-export-header').cloneNode(true);
            const contentHtml = document.getElementById('summary-export-content').cloneNode(true);

            // Clean up IDs in the clones to avoid DOM conflicts
            [headerHtml, contentHtml].forEach(root => {
                root.removeAttribute('id');
                root.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
            });

            // Remove ignored elements from the clone
            headerHtml.querySelectorAll('[data-html2canvas-ignore]').forEach(el => el.remove());
            contentHtml.querySelectorAll('[data-html2canvas-ignore]').forEach(el => el.remove());

            // Adjust the header style for the export (remove dark background)
            headerHtml.style.background = 'none';
            headerHtml.style.backgroundColor = 'transparent';
            headerHtml.style.boxShadow = 'none';
            headerHtml.style.paddingTop = '10px';
            headerHtml.style.paddingBottom = '30px';

            // Center the title in the snapshot and include full date
            const titleEl = headerHtml.querySelector('.summary-header-title');
            if (titleEl) {
                // Formatting activeDate (YYYY-MM-DD) into a more readable format for the document title
                const d = new Date(activeDate);
                const options = { day: 'numeric', month: 'short', year: 'numeric' };
                const formattedDate = d.toLocaleDateString(undefined, options);
                
                titleEl.textContent = `Adamus Resources Limited KPI – ${formattedDate}`;
                titleEl.style.textAlign = 'center';
                titleEl.style.width = '100%';
                titleEl.style.fontSize = '28px';
                titleEl.style.fontWeight = 'bold';
                titleEl.style.color = '#1a1a2e'; // Use a dark color for better contrast on white background
            }

            // Create and position the Adamus Logo at the top left of the header
            const logoImg = document.createElement('img');
            logoImg.src = 'images/adamus_logo.png';
            Object.assign(logoImg.style, {
                position: 'absolute',
                left: '20px',
                top: '0',
                height: '65px',
                width: 'auto'
            });
            headerHtml.style.position = 'relative'; // Anchor for the logo absolute positioning
            headerHtml.prepend(logoImg);

            container.appendChild(headerHtml);
            container.appendChild(contentHtml);

            // Hide the container from user view
            Object.assign(container.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                zIndex: '-1000',
                pointerEvents: 'none'
            });
            document.body.appendChild(container);

            // Logic to perform export (wrapped to wait for images)
            const performExport = () => {
                const pxWidth = container.scrollWidth;
                const pxHeight = container.scrollHeight;

                const opt = {
                    margin:       0,
                    filename:     `Adamus_KPI_Summary_${activeDate}.${format}`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  {
                        scale: 2,
                        useCORS: true,
                        letterRendering: true,
                        backgroundColor: '#ffffff',
                        width: pxWidth,
                        height: pxHeight,
                        logging: false,
                        scrollX: 0,
                        scrollY: 0
                    },
                    jsPDF: {
                        unit: 'px',
                        format: [pxWidth, pxHeight],
                        orientation: (pxWidth > pxHeight) ? 'landscape' : 'portrait',
                        hotfixes: ['px_scaling']
                    }
                };

                const cleanup = () => {
                    if (container.parentNode) document.body.removeChild(container);
                    toggleBtn.innerHTML = originalHtml;
                    toggleBtn.disabled = false;
                };

                if (format === 'pdf') {
                    html2pdf().set(opt).from(container).save().then(() => {
                        cleanup();
                        DOM.showToast("PDF Exported successfully!");
                    }).catch(err => {
                        cleanup();
                        console.error("PDF Export Error:", err);
                        DOM.showToast("Failed to export PDF", "error");
                    });
                } else if (format === 'png') {
                    html2pdf().set(opt).from(container).outputImg('img').then((imgEl) => {
                        const link = document.createElement('a');
                        link.href = imgEl.src;
                        link.download = opt.filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        cleanup();
                        DOM.showToast("PNG Exported successfully!");
                    }).catch(err => {
                        cleanup();
                        console.error("PNG Export Error:", err);
                        DOM.showToast("Failed to export PNG", "error");
                    });
                }
            };

            // Ensure logo is loaded before capturing
            if (logoImg.complete) {
                performExport();
            } else {
                logoImg.onload = performExport;
                logoImg.onerror = () => {
                    console.error("Logo failed to load for export, continuing without it.");
                    performExport();
                };
            }
        };
    };

    document.getElementById('btn-export-pdf').addEventListener('click', handleExport('pdf'));
    document.getElementById('btn-export-png').addEventListener('click', handleExport('png'));

    await loadSummaryData(selectedDate);
};

async function loadSummaryData(dateStr) {
    const container = document.getElementById('summary-table-container');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div><span class="ms-2 text-muted">Loading…</span></div>';

    try {
        const resp = await fetchSummaryDashboard(dateStr);
        const depts = resp.departments || {};
        renderSummaryTable(depts);
    } catch (e) {
        container.innerHTML = `<div class="text-center py-4 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>${e.message}</div>`;
    }
}

function renderSummaryTable(departments) {
    const container = document.getElementById('summary-table-container');
    if (!container) return;

    const DEPT_ORDER = ["OHS", "Milling_CIL", "Crushing", "Mining", "Geology", "Engineering"];
    let html = '<table class="summary-table"><tbody>';

    for (const dept of DEPT_ORDER) {
        const rawMetrics = departments[dept] || [];
        const deptKey = dept.toLowerCase();
        const deptLabel = DEPT_DISPLAY[dept] || dept;
        const secLabel = DEPT_SECONDARY_LABEL[dept] || '';
        const isOHS = dept === 'OHS';

        // Sort by defined order
        const order = SUMMARY_METRIC_ORDER[dept] || [];
        const sorted = [];
        for (const name of order) {
            const found = rawMetrics.find(m => m.metric_name === name);
            if (found) sorted.push(found);
        }
        // Add any remaining
        for (const m of rawMetrics) {
            if (!sorted.find(s => s.metric_name === m.metric_name)) sorted.push(m);
        }

        // Department section header row
        html += `<tr class="summary-dept-hdr dept-hdr-${deptKey}">
            <td>Area</td><td>KPI</td><td>Daily Actual</td><td>${secLabel}</td>
            <td>Daily Forecast</td><td>Variance</td><td>Status</td>
            <td>MTD Actual</td><td>MTD Forecast</td><td>Variance</td><td>Status</td>
            <td>Outlook (a)</td><td>Forecast (b)</td><td>Budget (c)</td><td>Variance (a-b)</td><td>Status</td>
            <td>Last 7 Days Trend</td>
        </tr>`;

        // Data rows
        sorted.forEach((m, idx) => {
            const d = m.data || {};
            const v1 = d.var1 ?? '';
            const v2 = d.var2 ?? '';
            const v3 = d.var3 ?? '';

            html += '<tr>';

            // Area cell (rowspan for first row)
            if (idx === 0) {
                html += `<td class="summary-area-cell area-${deptKey}" rowspan="${sorted.length}">${deptLabel}</td>`;
            }

            html += `<td style="font-weight:500;">${m.metric_name}</td>`;
            html += `<td class="num-cell">${fmtVal(d.daily_actual)}</td>`;
            html += `<td class="num-cell">${getSecondaryVal(dept, d)}</td>`;
            html += `<td class="num-cell">${fmtVal(d.daily_forecast)}</td>`;
            html += `<td class="${svarClass(v1)}">${fmtVal(v1)}</td>`;
            html += `<td style="text-align:center;">${sstatusHtml(v1)}</td>`;
            html += `<td class="num-cell">${fmtVal(d.mtd_actual)}</td>`;
            html += `<td class="num-cell">${fmtVal(d.mtd_forecast)}</td>`;
            html += `<td class="${svarClass(v2)}">${fmtVal(v2)}</td>`;
            html += `<td style="text-align:center;">${sstatusHtml(v2)}</td>`;
            html += `<td class="num-cell">${fmtVal(d.outlook ?? '')}</td>`;
            html += `<td class="num-cell">${fmtVal(d.full_forecast ?? '')}</td>`;
            html += `<td class="num-cell">${fmtVal(d.full_budget ?? '')}</td>`;
            html += `<td class="${svarClass(v3)}">${fmtVal(v3)}</td>`;
            html += `<td style="text-align:center;">${sstatusHtml(v3)}</td>`;
            html += `<td class="trend-cell">${summarySparkline(m.trend, isOHS)}</td>`;

            html += '</tr>';
        });

        // Empty state row if no data
        if (sorted.length === 0) {
            html += `<tr><td class="summary-area-cell area-${deptKey}">${deptLabel}</td><td colspan="16" class="text-muted" style="text-align:center;">No data for this date</td></tr>`;
        }
    }

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Get the import configuration (headers/keys) for a metric, respecting department-specific column visibility.
 */
function getImportConfig(dept, metric) {
    let config = IMPORT_CONFIGS[metric] || {
        headers: ['Date (YYYY-MM-DD)', 'Metric', 'Daily Actual', 'Daily Forecast'],
        keys: ['date', 'metric_name', 'daily_actual', 'daily_forecast']
    };

    // Special handling for Fixed Inputs to hide 'Forecast Per Rig' for non-Geology departments
    if (metric === 'Fixed Inputs') {
        const hideRigColumn = dept === 'Mining' || dept === 'Crushing' || dept === 'Milling_CIL' || dept === 'OHS' || dept === 'Engineering';
        if (hideRigColumn) {
            config = {
                headers: config.headers.filter(h => h !== 'Forecast Per Rig'),
                keys: config.keys.filter(k => k !== 'forecast_per_rig')
            };
        }
    }
    return config;
}

/**
 * Download a CSV template for the current metric.
 */
window.downloadImportTemplate = function(dept, metric) {
    const config = getImportConfig(dept, metric);

    const csvContent = "data:text/csv;charset=utf-8," + config.headers.join(",") + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${dept}_${metric}_template.csv`.toLowerCase().replace(/\s+/g, '_'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Identify fields that should be computed automatically during import,
 * ignoring any values provided in the CSV for these fields.
 */
const COMPUTED_FIELDS = ['var1', 'var2', 'var3', 'daily_var', 'mtd_var', 'budget_var', 'mtd_actual', 'mtd_forecast', 'outlook'];

/**
 * Computes fields for a record based on its data and the previous record's data.
 */
async function computeImportRecord(dept, metric, record, prevRecord, fixedInputs) {
    const d = record.data;
    const pd = prevRecord ? prevRecord.data : null;

    // 1. Ignore existing computed values from CSV
    COMPUTED_FIELDS.forEach(field => delete d[field]);

    // Auto-fill daily forecast for Grade Control Drilling if unspecified
    if (metric === 'Grade Control Drilling') {
        if (d.daily_forecast === undefined || d.daily_forecast === null || d.daily_forecast === '' || d.daily_forecast === 0) {
            const rigs = parseFloat(d.num_rigs) || 0;
            const monthStr = record.date.substring(0, 7);
            const monthFixed = fixedInputs.find(f => f.date.startsWith(monthStr));
            const forecastPerRig = monthFixed ? (parseFloat(monthFixed.data.forecast_per_rig) || 0) : 0;
            d.daily_forecast = rigs * forecastPerRig;
        }
    }

    // Auto-fill daily forecast for Toll if unspecified
    if (metric === 'Toll') {
        if (d.daily_forecast === undefined || d.daily_forecast === null || d.daily_forecast === '' || d.daily_forecast === 0) {
            const monthStr = record.date.substring(0, 7);
            const monthFixed = fixedInputs.find(f => f.date.startsWith(monthStr));
            const fullForecast = monthFixed ? (parseFloat(monthFixed.data.full_forecast) || 0) : 0;
            
            const dateObj = new Date(record.date);
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1; // 1-based
            const daysInMonth = new Date(year, month, 0).getDate();
            
            d.daily_forecast = fullForecast / daysInMonth;
        }
    }

    // 2. Variances logic
    const calcVar = (act, fcst) => {
        if (!fcst || isNaN(act) || isNaN(fcst)) return "0%";
        const v = ((act - fcst) / fcst) * 100;
        return Math.round(v) + "%";
    };

    // a. Daily Variance
    if (metric === 'Grade Rehandle') {
        if (d.daily_act_grade !== undefined && d.daily_forecast !== undefined) {
            d.var1 = calcVar(d.daily_act_grade, d.daily_forecast);
            d.daily_var = d.var1;
        }
    } else {
        if (d.daily_actual !== undefined && d.daily_forecast !== undefined) {
            d.var1 = calcVar(d.daily_actual, d.daily_forecast);
            d.daily_var = d.var1;
        }
    }

    // b. MTD calculations
    if (metric === "Toll") {
        if (d.daily_actual !== undefined) {
            d.wet_tonnes = parseFloat((parseFloat(d.daily_actual) * 0.85).toFixed(0));
        }
        if (d.wet_tonnes !== undefined) {
            const prevMtd = pd ? (parseFloat(pd.mtd_actual) || 0) : 0;
            d.mtd_actual = prevMtd + parseFloat(d.wet_tonnes);
        }
    } else if (metric === "Grade Rehandle") {
        let cumTonnes = 0;
        let cumSumProd = 0;
        
        if (pd && pd._cum_tonnes !== undefined && pd._cum_sumproduct !== undefined) {
            cumTonnes = pd._cum_tonnes;
            cumSumProd = pd._cum_sumproduct;
        } else if (pd) {
            // pd is from history, let's fetch all records for the month up to pd.date
            const dateObj = new Date(record.date);
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            
            try {
                const history = await fetchKPIRecords(dept, startDate, pd.date);
                const relevant = history.filter(r => r.metric_name === metric && r.subtype !== 'fixed_input');
                relevant.forEach(r => {
                    const tonnes = parseFloat(r.data.daily_actual) || 0;
                    const grade = parseFloat(r.data.daily_act_grade) || 0;
                    cumTonnes += tonnes;
                    cumSumProd += (tonnes * grade);
                });
            } catch (err) {
                console.error("Failed to fetch history for MTD Grade Rehandle calculation:", err);
            }
        }
        
        const curTonnes = parseFloat(d.daily_actual) || 0;
        const curGrade = parseFloat(d.daily_act_grade) || 0;
        
        d._cum_tonnes = cumTonnes + curTonnes;
        d._cum_sumproduct = cumSumProd + (curTonnes * curGrade);
        
        if (d._cum_tonnes !== 0) {
            d.mtd_actual = parseFloat((d._cum_sumproduct / d._cum_tonnes).toFixed(2));
        } else {
            d.mtd_actual = 0;
        }
        
        d.mtd_forecast = parseFloat((parseFloat(d.daily_forecast) || 0).toFixed(2));
    } else {
        if (d.daily_actual !== undefined) {
            const prevMtd = pd ? (parseFloat(pd.mtd_actual) || 0) : 0;
            d.mtd_actual = prevMtd + parseFloat(d.daily_actual);
        }
    }

    if (metric !== "Grade Rehandle") {
        if (d.daily_forecast !== undefined) {
            const prevMtdFcst = pd ? (parseFloat(pd.mtd_forecast) || 0) : 0;
            d.mtd_forecast = prevMtdFcst + parseFloat(d.daily_forecast);
        }
    }

    if (d.mtd_actual !== undefined && d.mtd_forecast !== undefined) {
        d.var2 = calcVar(d.mtd_actual, d.mtd_forecast);
        d.mtd_var = d.var2;
    }

    // 3. Outlook logic (depends on day of month)
    if (record.date && record.subtype !== 'fixed_input') {
        const dateObj = new Date(record.date);
        const day = dateObj.getDate();
        const monthStr = record.date.substring(0, 7); // YYYY-MM
        
        // Find fixed input for this month
        const monthFixed = fixedInputs.find(f => f.date.startsWith(monthStr));
        const fullFcst = monthFixed ? (parseFloat(monthFixed.data.full_forecast) || 0) : (parseFloat(d.full_forecast) || 0);
        const fullBudg = monthFixed ? (parseFloat(monthFixed.data.full_budget) || 0) : (parseFloat(d.full_budget) || 0);

        if (metric === 'Grade Rehandle') {
            d.full_forecast = "-";
            d.full_budget = "-";
            d.outlook = "-";
            d.var3 = "-";
            d.budget_var = "-";
        } else {
            // Copy fixed values to record if missing or unspecified
            if (dept === 'Geology') {
                if (d.full_forecast === undefined || d.full_forecast === null || d.full_forecast === '' || d.full_forecast === 0) {
                    d.full_forecast = fullFcst;
                }
                if (d.full_budget === undefined || d.full_budget === null || d.full_budget === '' || d.full_budget === 0) {
                    d.full_budget = fullBudg;
                }
            } else {
                if (d.full_forecast === undefined) d.full_forecast = fullFcst;
                if (d.full_budget === undefined) d.full_budget = fullBudg;
            }

            const dailyAct = parseFloat(d.daily_actual) || 0;
            const dailyFcst = parseFloat(d.daily_forecast) || 0;

            if (day === 1) {
                d.outlook = (dailyAct - dailyFcst) + fullFcst;
            } else {
                const prevOutlook = pd ? (parseFloat(pd.outlook) || 0) : 0;
                d.outlook = (dailyAct - dailyFcst) + prevOutlook;
            }

            // Outlook Variance
            if (d.outlook !== undefined && fullBudg) {
                d.var3 = calcVar(d.outlook, fullBudg);
                d.budget_var = d.var3;
            }
        }
    }

    return record;
}

/**
 * Handle clicking the Import button: open file dialog and process.
 */
window.handleImportClick = function(dept, metric) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            try {
                const rows = parseCSV(text);
                if (rows.length === 0) {
                    DOM.showToast("The CSV file is empty.", "warning");
                    return;
                }

                const config = getImportConfig(dept, metric);

                // 1. Initial Mapping
                let importPayload = rows.map(row => {
                    const record = {
                        department: dept,
                        metric_name: metric,
                        subtype: metric === 'Fixed Inputs' ? 'fixed_input' : 'daily_input',
                        data: {}
                    };

                    config.headers.forEach((header, idx) => {
                        const key = config.keys[idx];
                        let value = row[header];

                        if (key === 'date') {
                            if (metric === 'Fixed Inputs' && value && value.length === 7) {
                                record.date = value + "-01";
                            } else {
                                record.date = value;
                            }
                        } else if (key === 'metric_name') {
                            record.metric_name = value;
                        } else {
                            const cleanedVal = value ? value.replace(/[%,\s]/g, '') : '';
                            if (cleanedVal !== '' && !isNaN(cleanedVal)) {
                                record.data[key] = parseFloat(cleanedVal);
                            } else {
                                record.data[key] = value || 0;
                            }
                        }
                    });
                    return record;
                });

                // 2. Sort by Date
                importPayload.sort((a, b) => a.date.localeCompare(b.date));

                // 3. Preparation: Fetch Fixed Inputs and History
                DOM.showToast("Preparing calculations...", "info");
                
                // Fetch Fixed Inputs for the months involved
                const months = [...new Set(importPayload.map(r => r.date.substring(0, 7)))];
                const fixedInputs = [];
                for (const m of months) {
                    const records = await fetchKPIRecords(dept, `${m}-01`, `${m}-01`);
                    const fi = records.find(r => r.metric_name === (metric === 'Fixed Inputs' ? 'Fixed Inputs' : metric) && r.subtype === 'fixed_input');
                    if (fi) fixedInputs.push(fi);
                }

                // 4. Sequential Calculation
                const finalPayload = [];
                for (let i = 0; i < importPayload.length; i++) {
                    const record = importPayload[i];
                    
                    // Find previous record (either from current batch or from server)
                    let prevRecord = i > 0 ? finalPayload[i - 1] : null;
                    if (!prevRecord && record.subtype !== 'fixed_input') {
                        const d = new Date(record.date);
                        d.setDate(d.getDate() - 1);
                        const prevDateStr = d.toISOString().split('T')[0];
                        const history = await fetchKPIRecords(dept, prevDateStr, prevDateStr);
                        prevRecord = history.find(r => r.metric_name === metric && r.subtype !== 'fixed_input');
                    }

                    const computed = await computeImportRecord(dept, metric, record, prevRecord, fixedInputs);
                    finalPayload.push(computed);
                }

                // 5. Send to bulk API
                DOM.showToast(`Importing ${finalPayload.length} records...`);
                const result = await importKPIRecords(dept, finalPayload);
                
                if (result.status === 'success') {
                    DOM.showToast(`Successfully imported ${result.imported_count} records.`, "success");
                    if (result.errors && result.errors.length > 0) {
                        console.warn("Import errors:", result.errors);
                        DOM.showToast(`Some rows had errors. Check console.`, "warning");
                    }
                    loadRecentRecords(dept);
                } else {
                    DOM.showToast("Import failed: " + result.message, "error");
                }

            } catch (err) {
                console.error("Import Error", err);
                DOM.showToast("Failed to process import: " + err.message, "error");
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

/**
 * Robust CSV parser that handles quotes and values containing commas correctly.
 */
function parseCSV(text) {
    const result = [];
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentLine.push(currentField.trim());
                currentField = '';
            } else if (char === '\r' || char === '\n') {
                currentLine.push(currentField.trim());
                currentField = '';
                if (currentLine.length > 0 && (currentLine.length > 1 || currentLine[0] !== '')) {
                    lines.push(currentLine);
                }
                currentLine = [];
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
            } else {
                currentField += char;
            }
        }
    }
    if (currentField || inQuotes) {
        currentLine.push(currentField.trim());
    }
    if (currentLine.length > 0 && (currentLine.length > 1 || currentLine[0] !== '')) {
        lines.push(currentLine);
    }

    if (lines.length === 0) return [];

    // Strip wrapping quotes and spaces from headers
    const headers = lines[0].map(h => h.replace(/^["']|["']$/g, '').trim());

    for (let i = 1; i < lines.length; i++) {
        const rowData = lines[i];
        const obj = {};
        headers.forEach((header, idx) => {
            let val = rowData[idx] !== undefined ? rowData[idx] : '';
            val = val.replace(/^["']|["']$/g, '').trim();
            obj[header] = val;
        });
        result.push(obj);
    }
    return result;
}

// Wrap loadRecentRecords to ensure comments are always appended to daily records tables
// and action buttons are moved to the first index
(function() {
    const original = loadRecentRecords;
    loadRecentRecords = async function(dept) {
        await original(dept);
        try {
            const thead = document.querySelector('#records-table thead tr');
            const tbody = document.querySelector('#records-table tbody');
            if (thead && tbody && STATE.currentMetric !== 'Fixed Inputs') {
                const headers = Array.from(thead.querySelectorAll('th')).map(th => th.textContent.trim());
                if (!headers.includes('Comment')) {
                    const th = document.createElement('th');
                    th.style.padding = '12px';
                    th.style.textAlign = 'left';
                    th.textContent = 'Comment';
                    thead.appendChild(th);

                    const rows = tbody.querySelectorAll('tr');
                    if (rows.length === 1 && (rows[0].textContent.includes('No records found') || rows[0].textContent.includes('No Fixed Input records found'))) {
                        const td = rows[0].querySelector('td');
                        if (td) {
                            const currentColspan = parseInt(td.getAttribute('colspan') || '1');
                            td.setAttribute('colspan', String(currentColspan + 1));
                        }
                    } else {
                        rows.forEach(tr => {
                            const editBtn = tr.querySelector('button[onclick^="editRecord"]');
                            let commentText = '';
                            if (editBtn) {
                                const match = editBtn.getAttribute('onclick').match(/editRecord\((\d+)\)/);
                                if (match) {
                                    const recId = parseInt(match[1]);
                                    const rec = STATE.currentRecords.find(r => r.id === recId);
                                    if (rec && rec.data && rec.data.comment) {
                                        commentText = rec.data.comment;
                                    }
                                }
                            }
                            const td = document.createElement('td');
                            td.style.padding = '12px';
                            td.textContent = commentText;
                            tr.appendChild(td);
                        });
                    }
                }
            }

            // Move Action column to index 0 for all tables
            if (thead && tbody) {
                const ths = Array.from(thead.querySelectorAll('th'));
                const actionThIdx = ths.findIndex(th => th.textContent.trim() === 'Action' || th.textContent.trim() === 'Actions');
                if (actionThIdx > 0) {
                    const actionTh = ths[actionThIdx];
                    thead.insertBefore(actionTh, thead.firstElementChild);

                    const rows = tbody.querySelectorAll('tr');
                    rows.forEach(tr => {
                        if (tr.children.length > actionThIdx) {
                            const tds = Array.from(tr.children);
                            const actionTd = tds[actionThIdx];
                            if (actionTd) {
                                tr.insertBefore(actionTd, tr.firstElementChild);
                            }
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Error post-processing table layout", e);
        }
    };
    window.loadRecentRecords = loadRecentRecords;
})();
