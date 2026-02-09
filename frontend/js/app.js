// app.js
// Main application logic

// State
const STATE = {
    currentUser: null,
    currentDept: "OHS",
    currentMetric: "Fixed Inputs"
};

const DEPARTMENTS = ["OHS", "Geology", "Mining", "Crushing", "Milling_CIL", "Engineering"];

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
        "Property Damage"
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
        "Mill"
    ]
};


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
    if (storedUser) {
        try {
            STATE.currentUser = JSON.parse(storedUser);
            initApp();
        } catch (e) {
            renderLoginScreen();
        }
    } else {
        renderLoginScreen();
    }
});

function initApp() {
    // Failsafe: if no user logic, redirect to login
    if (!STATE.currentUser) {
        // Double check localstorage
        const storedUser = localStorage.getItem('kpi_current_user');
        if (storedUser) {
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

    renderSidebar();
    loadDepartmentView(STATE.currentDept);
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
    container.className = 'auth-container text-center fade-in';

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
        alert('Please contact your administrator to reset password.');
    };

    const registerLink = document.createElement('div');
    registerLink.className = 'mt-4 text-muted';
    registerLink.innerHTML = `New user? <a href="#" class="text-primary fw-semibold">Create Account</a>`;
    registerLink.querySelector('a').onclick = (e) => {
        e.preventDefault();
        renderRegisterScreen();
    };

    // Append all
    btnContainer.appendChild(loginBtn);
    btnContainer.appendChild(cancelBtn);
    container.appendChild(btnContainer);
    container.appendChild(forgotLink);
    container.appendChild(registerLink);

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
    container.className = 'auth-container text-center fade-in border border-2 border-primary';

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
    const password = DOM.createInputGroup('Password', 'reg-password', 'password');
    const confirm = DOM.createInputGroup('Confirm Password', 'reg-confirm', 'password');

    container.appendChild(username.container);
    container.appendChild(password.container);
    container.appendChild(confirm.container);

    const createBtn = DOM.createButton('Create Admin Account', async () => {
        const u = username.input.value;
        const p = password.input.value;
        const c = confirm.input.value;

        if (!u || !p) { DOM.showToast('Please fill all fields', 'error'); return; }
        if (p !== c) { DOM.showToast('Passwords do not match', 'error'); return; }

        try {
            await registerUser({
                username: u,
                password: p,
                department: 'Management',
                role: 'Admin'
            });
            DOM.showToast('Admin account created! Please login.');
            renderLoginScreen();
        } catch (e) {
            DOM.showToast(e.message, 'error');
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
    container.className = 'auth-container text-center fade-in';

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

    // Department Select using DOM helper
    const deptGroup = DOM.createSelect('Department', 'reg-dept', DEPARTMENTS, 'Select Department');

    // Role Select
    const ROLES = ['GM', 'HOD', 'Admin', 'Staff'];
    const roleGroup = DOM.createSelect('Role', 'reg-role', ROLES, 'Select Role');

    container.appendChild(username.container);
    container.appendChild(password.container);
    container.appendChild(confirm.container);
    container.appendChild(deptGroup.container);
    container.appendChild(roleGroup.container);

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
                department: d,
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
        // Token handling should be improved in a real app (e.g. storage), but for now this matches existing flow
        // Note: api.js handleResponse/fetch wrappers might need the token for authenticated requests later.
        // The current api.js doesn't seem to attach tokens to requests yet. 
        // We will assume the session/cookie or simple token auth is handled there or not yet implemented fully.
        // looking at api.js, it doesn't attach headers.
        // However, the requested task is about admin setup. I should fix the login at least.

        initApp();
    } catch (e) {
        DOM.showToast(e.message, 'error');
    }
}

function logout() {
    STATE.currentUser = null;
    localStorage.removeItem('kpi_current_user');
    renderLoginScreen();
}

function renderSidebar() {
    const nav = document.getElementById('sidebar');
    const userDisplay = STATE.currentUser ? STATE.currentUser.username : 'User';
    const userRole = STATE.currentUser ? STATE.currentUser.role : '';

    nav.innerHTML = `
        <h2 class="d-flex align-items-center gap-2">
            <img src="images/adamus_logo_transparent_white_text.png" alt="Adamus Logo" style="height: 40px;">
            Adamus KPI
        </h2>
        
        <nav class="nav flex-column flex-grow-1">
            ${DEPARTMENTS.map(dept => `
                <a href="#" onclick="loadDepartmentView('${dept}'); return false;" 
                   class="nav-link ${STATE.currentDept === dept ? 'active' : ''}">
                   <i class="bi bi-folder2"></i>
                   ${dept.replace('_', ' ')}
                </a>
            `).join('')}
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
            <h2 class="mb-0"><i class="bi bi-speedometer2 me-2 text-primary"></i>${dept.replace('_', ' ')} Dashboard</h2>
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
                <div class="card-header d-flex align-items-center justify-content-between">
                    <h5 class="mb-0"><i class="bi bi-table me-2"></i>Recent Records: <span id="table-metric-title" class="text-primary">${STATE.currentMetric}</span></h5>
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

window.loadMetricView = function (metric) {
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
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: left;">Number of Rigs</th>
            `;
        } else if (metric === "Toll") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Wet Tonnes</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: left;">Grade</th>
                <th style="padding: 12px; text-align: left;">Grade (Day - 7)</th>
            `;
        } else if (metric === "Ore Mined") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
            `;
        } else if (metric === "Grade - Ore Mined") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(g/t)</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
            `;
        } else if (metric === "Total Material Moved") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(bcm)</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast(bcm)</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
            `;
        } else if (metric === "Blast Hole Drilling") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
            `;
        } else if (metric === "Grade - Ore Crushed") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(t)</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
            `;
        } else if (metric === "Ore Crushed") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
            `;
        } else if (metric === "Plant Feed Grade" && STATE.currentDept === "Milling_CIL") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(t)</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
            `;
        } else if ((metric === "Light Vehicles" || metric === "Tipper Trucks" || metric === "Prime Excavators" || metric === "Anx Excavators" || metric === "Dump Trucks" || metric === "ART Dump Trucks" || metric === "Wheel Loaders" || metric === "Graders" || metric === "Dozers") && STATE.currentDept === "Engineering") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Qty Available</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(%)</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast(%)</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
            `;
        } else if ((metric === "Crusher" || metric === "Mill") && STATE.currentDept === "Engineering") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual(%)</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast(%)</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
            `;
        } else if (metric === "Safety Incidents" || metric === "Environmental Incidents" || metric === "Property Damage") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
            `;
        } else if ((metric === "Gold Contained" || metric === "Gold Recovery" || metric === "Recovery" || metric === "Tonnes Treated") && STATE.currentDept === "Milling_CIL") {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Daily Var %</th>
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
            `;
        } else {
            tableHead.innerHTML = `
                <th style="padding: 12px; text-align: left;">Date</th>
                <th style="padding: 12px; text-align: left;">Metric</th>
                <th style="padding: 12px; text-align: left;">Daily Actual</th>
                <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                <th style="padding: 12px; text-align: left;">Var %</th>
            `;
        }
    }

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
    } else if (dept === "OHS" && metricName === "Safety Incidents") {
        renderOHSSafetyIncidentsForm(dept, metricName, card);
    } else if (dept === "OHS" && metricName === "Environmental Incidents") {
        renderOHSEnvironmentalIncidentsForm(dept, metricName, card);
    } else if (dept === "OHS" && metricName === "Property Damage") {
        renderOHSPropertyDamageForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Light Vehicles") {
        renderEngineeringLightVehiclesForm(dept, metricName, card);
    } else if (dept === "Engineering" && metricName === "Tipper Trucks") {
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

    container.appendChild(card);
}

function renderFixedInputForm(dept, card) {
    // Use a table layout to align headers and inputs perfectly
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '20px';

    const isGeology = dept === 'Geology';
    const colWidth = isGeology ? '16.66%' : '20%';

    const thead = document.createElement('thead');
    let headerHTML = `
        <tr style="background-color: #f9fafb;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">KPI</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">Target Month</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">Number of Days</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">Full Forecast</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">Full Budget</th>
    `;

    if (isGeology) {
        headerHTML += `<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; width: ${colWidth};">Forecast Per Rig</th>`;
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
    tr.appendChild(createCell(inputMonth));

    // 3. Num Days
    const inputDays = document.createElement('input');
    inputDays.type = 'number';
    inputDays.id = `input-${dept}-num-days`;
    tr.appendChild(createCell(inputDays));

    // 4. Forecast
    const inputForecast = document.createElement('input');
    inputForecast.type = 'text';
    inputForecast.id = `input-${dept}-full-forecast`;
    tr.appendChild(createCell(inputForecast));

    // 5. Budget
    const inputBudget = document.createElement('input');
    inputBudget.type = 'text';
    inputBudget.id = `input-${dept}-full-budget`;
    tr.appendChild(createCell(inputBudget));

    // 6. Forecast Per Rig (Geology Only)
    if (isGeology) {
        const inputFcstRig = document.createElement('input');
        inputFcstRig.type = 'text';
        inputFcstRig.id = `input-${dept}-fcst-per-rig`;
        tr.appendChild(createCell(inputFcstRig));
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
            alert("Please select KPI and Target Month");
            return;
        }

        const dataPayload = {
            num_days: parseInt(daysVal) || 0,
            full_forecast: parseFloat(fcstVal.replace(/,/g, '')) || 0,
            full_budget: parseFloat(budgVal.replace(/,/g, '')) || 0
        };

        if (isGeology) {
            // Access dynamically since variable might be out of scope if block-scoped
            const rigElem = document.getElementById(`input-${dept}-fcst-per-rig`);
            if (rigElem) {
                dataPayload.forecast_per_rig = parseFloat(rigElem.value.replace(/,/g, '')) || 0;
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
            DOM.showToast("Fixed Inputs saved successfully!");
            loadRecentRecords(dept);

            // Clear inputs
            inputDays.value = '';
            inputForecast.value = '';
            inputBudget.value = '';
            if (isGeology) {
                const rigElem = document.getElementById(`input-${dept}-fcst-per-rig`);
                if (rigElem) rigElem.value = '';
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    let currentForecastPerRig = 0; // Store retrieved Fixed Input value

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date(); // Keep empty by default

    const rigs = DOM.createInputGroup("Number of Rigs", `input-${dept}-rigs`, "number");

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");

    // Custom Datalist for Exploration Drilling
    if (metricName === "Exploration Drilling") {
        const datalistId = `list-${dept}-daily-fcst-options`;
        const datalist = document.createElement('datalist');
        datalist.id = datalistId;
        [80, 150, 230, 300].forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            datalist.appendChild(opt);
        });
        dFcst.input.setAttribute('list', datalistId);
        dFcst.container.appendChild(datalist);
    }

    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

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
                    r.date !== dateVal && // Exclude current date to avoid double counting
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

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

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
            }
        } catch (e) {
            console.error("Error fetching fixed inputs", e);
        }
    };
    date.input.addEventListener('change', fetchFixedInputs);

    // Auto-Calc for Grade Control Drilling (Rigs * ForecastPerRig = Daily Actual)
    const calculateGradeControlDaily = () => {
        if (metricName !== 'Grade Control Drilling') return;

        const rigsVal = parseFloat(rigs.input.value) || 0;

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
    add(kpi); add(date); add(rigs); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar); grid.appendChild(document.createElement('div')); // Spacer
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(outlook); add(fullFcst); add(fullBudg); add(budgVar);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { alert("Please select a date"); return; }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    // date.input.valueAsDate = new Date();

    const wetTonnes = DOM.createInputGroup("Wet Tonnes", `input-${dept}-wet-tonnes`, "number");

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");

    // Auto-calculate Daily Actual from Wet Tonnes (Daily Actual = Wet Tonnes * 0.85)
    wetTonnes.input.addEventListener('input', () => {
        const val = parseFloat(wetTonnes.input.value) || 0;
        dAct.input.value = (val * 0.85).toFixed(0);
        dAct.input.dispatchEvent(new Event('input'));
    });

    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");

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
                r.date !== dateVal &&
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
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;
    attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

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

    // Row 5
    const grade = DOM.createInputGroup("Grade", `input-${dept}-grade`, "number");
    const grade7 = DOM.createInputGroup("Grade (Day - 7)", `input-${dept}-grade-7`, "number");

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
    add(kpi); add(date); add(wetTonnes); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar); grid.appendChild(document.createElement('div')); // Spacer
    add(mAct); add(mFcst); add(mVar); grid.appendChild(document.createElement('div')); // Spacer
    add(outlook); add(fullFcst); add(fullBudg); add(budgVar);
    add(grade); add(grade7);

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { alert("Please select a date"); return; }

        const record = {
            date: dateVal,
            department: dept,
            metric_name: metricName,
            data: {
                wet_tonnes: parseFloat(wetTonnes.input.value) || 0,
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
            wetTonnes.input.value = '';
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                r.date !== dateVal &&
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
        if (!dateVal) { alert("Please select a date"); return; }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                r.date !== dateVal &&
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
        if (!dateVal) { alert("Please select a date"); return; }

        const record = {
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
            alert("Failed to save record");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderMiningMaterialForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                r.date !== dateVal &&
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
            alert("Please select a date");
            return;
        }

        const val = (input) => input.value.replace(/,/g, '');
        const num = (input) => parseFloat(val(input)) || 0;
        const str = (input) => val(input);

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                r.date !== dateVal &&
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
            alert("Please select a date");
            return;
        }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                r.date !== dateVal &&
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
            alert("Please select a date");
            return;
        }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                    r.date !== dateVal;
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                    r.date !== dateVal;
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
            alert("Please select a date");
            return;
        }

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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                    r.date !== dateVal;
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
            alert("Please select a date");
            return;
        }

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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
        if (!dateVal) { alert("Please select a date"); return; }

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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                r.date !== dateVal
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
        if (!dateVal) { alert("Please select a date"); return; }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                r.date !== dateVal
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
        if (!dateVal) { alert("Please select a date"); return; }

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
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

    // Helper to add to grid
    const add = (group) => grid.appendChild(group.container);

    // Row 1
    const kpi = DOM.createInputGroup("KPI", `input-${dept}-kpi`, "text");
    kpi.input.value = metricName;
    kpi.input.readOnly = true;

    const date = DOM.createInputGroup("Date", `input-${dept}-date`, "date");
    date.input.value = ''; // Ensure empty by default

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "number");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "number");
    dFcst.input.value = 0;
    // dFcst.input.readOnly = true; 
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;

    // Custom logic: If Actual > 0 -> -100%, if Actual == 0 -> 0%
    const updateSafetyVariance = () => {
        const val = parseFloat(dAct.input.value);
        if (isNaN(val)) {
            dVar.input.value = '';
        } else if (val === 0) {
            dVar.input.value = '0%';
        } else if (val > 0) {
            dVar.input.value = '-100%';
        }
    };
    dAct.input.addEventListener('input', updateSafetyVariance);
    // attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    fullFcst.input.value = 0; // Default 0
    // Editable by default

    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    fullBudg.input.value = 0; // Default 0
    // Editable by default

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    // User requested editable and specific logic: 0 -> 0%, >0 -> -100%

    const updateSafetyOutlookVar = () => {
        const val = parseFloat(outlook.input.value);
        if (isNaN(val)) {
            budgVar.input.value = '';
        } else if (val === 0) {
            budgVar.input.value = '0%';
        } else if (val > 0) {
            budgVar.input.value = '-100%';
        }
    };
    outlook.input.addEventListener('input', updateSafetyOutlookVar);
    // attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar);

    card.appendChild(grid);

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
        dFcst.input.value = 0;
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
                    r.date !== dateVal; // Exclude current date
            });

            // Sum corresponding Daily Actuals
            priorMtdSum = history.reduce((sum, r) => sum + (parseFloat(r.data.daily_actual) || 0), 0);

            // Recalculate
            calculateSafetyMTD();

            // ================= LOOKUP FIXED INPUT FOR MTD FORECAST =================
            // Target format: "YYYY-MM"
            const targetMonthStr = `${targetY}-${String(targetM + 1).padStart(2, '0')}`;
            const targetDateStr = `${targetMonthStr}-01`;

            // Fixed Inputs (stored as subtype='fixed_input')
            // They are saved with date = YYYY-MM-01 and metric_name = KPI
            const fixedInput = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === metricName && // Check Main KPI Name
                r.date === targetDateStr        // Check Date (which represents Target Month)
            );

            if (fixedInput && fixedInput.data.full_forecast) {
                // "get the corresponding value in Full Forecast column"
                // Assuming assign to MTD Forecast as per request
                mFcst.input.value = fixedInput.data.full_forecast;
                mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // ================= END LOOKUP =================

        } catch (e) {
            console.error("Error fetching safety history", e);
            priorMtdSum = 0; // Fallback
            calculateSafetyMTD();
        }
    });

    // Also trigger MTD update when Daily Actual changes
    dAct.input.addEventListener('input', () => {
        updateSafetyVariance(); // from previous step
        calculateSafetyMTD();
    });
    // ================== LOGIC INJECTION END ==================

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) { alert("Please select a date"); return; }

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
            var3: budgVar.input.value
        };

        const record = {
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
            dFcst.input.value = 0; // Default
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = 0; // Default
            fullBudg.input.value = 0; // Default
            budgVar.input.value = '';

            // Reset internal state
            priorMtdSum = 0;

        } catch (e) {
            console.error(e);
            alert("Error saving: " + e.message);
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderOHSEnvironmentalIncidentsForm(dept, metricName, card) {
    console.log("Initializing Environmental Incidents Form (v2 - Fixed MTD Logic)");
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
    dFcst.input.value = 0; // Default 0

    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;

    // Custom logic: If Actual > 0 -> -100%, if Actual == 0 -> 0%
    const updateEnvVariance = (actInput, varInput) => {
        const val = parseFloat(actInput.value);
        if (isNaN(val)) {
            varInput.value = '';
        } else if (val === 0) {
            varInput.value = '0%';
        } else if (val > 0) {
            varInput.value = '-100%';
        }
    };

    dAct.input.addEventListener('input', () => updateEnvVariance(dAct.input, dVar.input));
    // attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;

    mAct.input.addEventListener('input', () => updateEnvVariance(mAct.input, mVar.input));
    // attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    fullFcst.input.value = 0; // Default to 0
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    fullBudg.input.value = 0; // Default to 0

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;

    // Custom logic for Outlook Variance (Env Incidents): 0 -> 0%, >0 -> -100%
    outlook.input.addEventListener('input', () => updateEnvVariance(outlook.input, budgVar.input));
    // attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar);

    card.appendChild(grid);

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

            // 2. Calculate MTD Forecast
            const previousSumFcst = records
                .filter(r => r.metric_name === kpiName)
                .filter(r => {
                    const rDate = new Date(r.date);
                    return rDate.getFullYear() === y &&
                        rDate.getMonth() === m &&
                        rDate < dateObj;
                })
                .reduce((sum, r) => {
                    const val = r.data ? (parseFloat(r.data.daily_forecast) || 0) : 0;
                    return sum + val;
                }, 0);

            mFcst.input.value = previousSumFcst + currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input'));

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
            alert("Please select a date.");
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
            var3: budgVar.input.value
        };

        const record = {
            date: date.input.value,
            department: dept,
            metric_name: kpi.input.value,
            data: payload
        };

        await saveKPIRecord(dept, record);
        alert("Environmental Incident Saved!");
        loadRecentRecords(dept);

        // Clear Inputs
        date.input.value = '';
        dAct.input.value = '';
        dFcst.input.value = '0';
        dVar.input.value = '';
        mAct.input.value = '';
        mFcst.input.value = '';
        mVar.input.value = '';
        outlook.input.value = '';
        fullFcst.input.value = '0';
        fullBudg.input.value = '0';
        budgVar.input.value = '';
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderOHSPropertyDamageForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
    dFcst.input.value = 0; // Default 0
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;

    // Custom logic: If Actual > 0 -> -100%, if Actual == 0 -> 0%
    const updatePropDamVariance = (actInput, varInput) => {
        const val = parseFloat(actInput.value);
        if (isNaN(val)) {
            varInput.value = '';
        } else if (val === 0) {
            varInput.value = '0%';
        } else if (val > 0) {
            varInput.value = '-100%';
        }
    };

    dAct.input.addEventListener('input', () => updatePropDamVariance(dAct.input, dVar.input));
    // attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;

    // Logic: ((MTD Forecast - MTD Actual) / MTD Actual) * 100
    const updatePropDamMTDVariance = () => {
        const actual = parseFloat(mAct.input.value);
        const forecast = parseFloat(mFcst.input.value);

        if (isNaN(actual) || isNaN(forecast) || actual === 0) {
            mVar.input.value = ''; // Avoid div by zero or empty
            return;
        }

        const variance = ((forecast - actual) / actual) * 100;
        mVar.input.value = Math.round(variance) + '%';
    };

    mAct.input.addEventListener('input', updatePropDamMTDVariance);
    mFcst.input.addEventListener('input', updatePropDamMTDVariance);
    // attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Row 4
    const outlook = DOM.createInputGroup("Outlook (a)", `input-${dept}-outlook`, "number");
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "number");
    fullFcst.input.value = 1; // Default to 1
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "number");
    fullBudg.input.value = 1; // Default to 1

    // Row 5
    const budgVar = DOM.createInputGroup("Var %", `input-${dept}-budg-var`, "text");
    budgVar.input.readOnly = true;

    // Custom Logic: ((Full Forecast (b) - Outlook (a)) / Outlook (a)) * 100
    const updatePropDamOutlookVariance = () => {
        const out = parseFloat(outlook.input.value);
        const fcst = parseFloat(fullFcst.input.value);

        if (isNaN(out) || isNaN(fcst) || out === 0) {
            budgVar.input.value = '';
            return;
        }

        const variance = ((fcst - out) / out) * 100;
        budgVar.input.value = Math.round(variance) + '%';
    };

    outlook.input.addEventListener('input', updatePropDamOutlookVariance);
    fullFcst.input.addEventListener('input', updatePropDamOutlookVariance);
    // attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(outlook); add(fullFcst); add(fullBudg);
    add(budgVar);

    card.appendChild(grid);

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

            // Calculate MTD Forecast from Fixed Inputs
            const fixedInput = records.find(r =>
                r.subtype === 'fixed_input' &&
                r.metric_name === kpiName &&
                new Date(r.date).getFullYear() === y &&
                new Date(r.date).getMonth() === m
            );

            if (fixedInput && fixedInput.data && fixedInput.data.full_forecast !== undefined) {
                mFcst.input.value = fixedInput.data.full_forecast;
                mFcst.input.dispatchEvent(new Event('input'));
            } else {
                mFcst.input.value = 0;
                mFcst.input.dispatchEvent(new Event('input'));
            }

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
            alert("Please select a date.");
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
            var3: budgVar.input.value
        };

        const record = {
            date: date.input.value,
            department: dept,
            metric_name: kpi.input.value,
            data: payload
        };

        try {
            await saveKPIRecord(dept, record);
            alert("Property Damage Record Saved!");
            loadRecentRecords(dept);

            // Clear / Reset Inputs
            date.input.value = '';
            dAct.input.value = '';
            dFcst.input.value = '0';
            dVar.input.value = '';
            mAct.input.value = '';
            mFcst.input.value = '';
            mVar.input.value = '';
            outlook.input.value = '';
            fullFcst.input.value = '1';
            fullBudg.input.value = '1';
            budgVar.input.value = '';
        } catch (error) {
            console.error(error);
            alert("Failed to save record.");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringLightVehiclesForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
            alert("Please select a date");
            return;
        }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
            alert("Please select a date.");
            return;
        }

        const record = {
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
            alert("Record saved successfully!");
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
            alert("Failed to save record.");
        }
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringPrimeExcavatorsForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
                alert(`Match Found for ${metricName}! ID: ${target.id}`); // Uncomment for distinct visual confirmation

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
                alert(`Debug: No Fixed Input found for ${metricName} in ${searchMonth}. Checked ${fixedInputs.length} fixed input records.`);
            }

        } catch (e) {
            console.error("Error fetching fixed inputs for auto-forecast", e);
            alert("Error fetching data: " + e.message);
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
            alert("Please select a date.");
            return;
        }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
            alert("Please select a date.");
            return;
        }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
            alert("Please select a date.");
            return;
        }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
            alert("Please select a date.");
            return;
        }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
            alert("Please select a date.");
            return;
        }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
            alert("Please select a date.");
            return;
        }

        const record = {
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
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
    const saveBtn = DOM.createButton("Save Record", () => {
        alert("Saving functionality for Dozers form to be implemented.");
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringCrusherForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
    const saveBtn = DOM.createButton("Save Record", () => {
        alert("Saving functionality for Crusher form to be implemented.");
    });
    btnContainer.appendChild(saveBtn);
    card.appendChild(btnContainer);
}

function renderEngineeringMillForm(dept, metricName, card) {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '15px';
    grid.style.marginBottom = '20px';

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
    const saveBtn = DOM.createButton("Save Record", () => {
        alert("Saving functionality for Mill form to be implemented.");
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
            alert("Please select a date");
            return;
        }

        const record = {
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

    if (STATE.currentMetric === 'Fixed Inputs') {
        const isGeology = dept === 'Geology';

        // 1. KPI
        const kpiSelect = document.getElementById(`input-${dept}-fixed-kpi`);
        if (kpiSelect) kpiSelect.value = record.metric_name;

        // 2. Month (Convert YYYY-MM-DD to YYYY-MM)
        const monthInput = document.getElementById(`input-${dept}-target-month`);
        if (monthInput && record.date) monthInput.value = record.date.substring(0, 7);

        // 3. Days
        const daysInput = document.getElementById(`input-${dept}-num-days`);
        if (daysInput && record.data) daysInput.value = record.data.num_days || '';

        // 4. Forecast
        const fcstInput = document.getElementById(`input-${dept}-full-forecast`);
        if (fcstInput && record.data) fcstInput.value = record.data.full_forecast || '';

        // 5. Budget
        const budgInput = document.getElementById(`input-${dept}-full-budget`);
        if (budgInput && record.data) budgInput.value = record.data.full_budget || '';

        // 6. Per Rig (Geology)
        if (isGeology) {
            const rigInput = document.getElementById(`input-${dept}-fcst-per-rig`);
            if (rigInput && record.data) rigInput.value = record.data.forecast_per_rig || '';
        }

        DOM.showToast("Record loaded for editing");
    } else {
        // Standard Record Edit
        // Set metric
        STATE.currentMetric = record.metric_name;
        // Re-render main area to ensure correct form is showing? 
        // Actually rendering happens on click of sidebar. 
        // We might need to simulate sidebar click or just find inputs if they exist.
        // For now, assuming user is on the correct metric page if they see the record.
        // Wait, "Recent Records" shows records for CURRENT metric only (filtered).
        // So the correct form SHOULD be present.

        const dateInput = document.getElementById(`input-${dept}-date`);
        if (dateInput) dateInput.value = record.date;

        const actualInput = document.getElementById(`input-${dept}-daily-act-pct`) || document.getElementById(`input-${dept}-daily-act`) || document.getElementById(`input-${dept}-actual`);
        if (actualInput && record.data) {
            actualInput.value = record.data.daily_actual || record.data.daily_act_pct || '';
            // If it's the exploration drilling form, we update other fields too
            if (metricName === 'Exploration Drilling' || metricName === 'Grade Control Drilling' || metricName === 'Blast Hole Drilling' || metricName === 'Total Material Moved') {
                const rigsInput = document.getElementById(`input-${dept}-rigs`);
                if (rigsInput) rigsInput.value = record.data.num_rigs || '';

                const mActInput = document.getElementById(`input-${dept}-mtd-act`);
                if (mActInput) mActInput.value = record.data.mtd_actual || '';

                const mFcstInput = document.getElementById(`input-${dept}-mtd-fcst`);
                if (mFcstInput) mFcstInput.value = record.data.mtd_forecast || '';

                const outlookInput = document.getElementById(`input-${dept}-outlook`);
                if (outlookInput) outlookInput.value = record.data.outlook || '';

                // Full Forecast/Budget might be auto-fetched, but we should set what was saved
                const fullFcstInput = document.getElementById(`input-${dept}-full-fcst`);
                if (fullFcstInput) fullFcstInput.value = record.data.full_forecast || '';

                const fullBudgInput = document.getElementById(`input-${dept}-full-budg`);
                if (fullBudgInput) fullBudgInput.value = record.data.full_budget || '';
            }
        }

        const fcstInput = document.getElementById(`input-${dept}-daily-fcst-pct`) || document.getElementById(`input-${dept}-daily-fcst`) || document.getElementById(`input-${dept}-forecast`);
        if (fcstInput && record.data) fcstInput.value = record.data.daily_forecast || record.data.daily_fcst_pct || '';

        // Trigger calculations if possible
        if (actualInput) actualInput.dispatchEvent(new Event('input'));

        DOM.showToast("Record loaded for editing");
    }
};

async function loadRecentRecords(dept) {
    try {
        const records = await fetchKPIRecords(dept);
        STATE.currentRecords = records; // Save for Edit/Delete

        const tbody = document.querySelector('#records-table tbody');
        const thead = document.querySelector('#records-table thead tr');
        if (!tbody || !thead) return;
        tbody.innerHTML = '';

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
                <th style="padding: 12px; text-align: left;">KPI</th>
                <th style="padding: 12px; text-align: left;">Target Month</th>
                <th style="padding: 12px; text-align: left;">Days</th>
                <th style="padding: 12px; text-align: left;">Full Forecast</th>
                <th style="padding: 12px; text-align: left;">Full Budget</th>
                ${!hideRigColumn ? '<th style="padding: 12px; text-align: left;">Forecast Per Rig</th>' : ''}
                <th style="padding: 12px; text-align: left;">Action</th>
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

                // Format Numbers with Commas
                const formatNum = (v) => (v !== undefined && v !== null && v !== '') ? Number(v).toLocaleString() : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${r.metric_name}</td>
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${r.data.num_days || '-'}</td>
                    <td style="padding: 12px;">${formatNum(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.full_budget)}</td>
                    ${!hideRigColumn ? `<td style="padding: 12px;">${formatNum(r.data.forecast_per_rig)}</td>` : ''}
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return; // Exit here for Fixed Inputs
        }

        // Handling for Exploration Drilling and Grade Control Drilling (Extended View)
        if (STATE.currentMetric === 'Exploration Drilling' || STATE.currentMetric === 'Grade Control Drilling') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Table headers matching form placeholders
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">Rigs</th>
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
                tbody.innerHTML = `<tr><td colspan="13" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
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
                    <td style="padding: 12px;">${r.data.num_rigs || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
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

            // KPI, Date, Wet Tonnes, D.Act, D.Fcst, Var, MTD.Act, MTD.Fcst, Var, Outlook, F.Fcst, F.Budg, Var, Grade, Grade-7
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">W.Ton</th>
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
                <th style="padding: 12px; text-align: left;">Grade</th>
                <th style="padding: 12px; text-align: left;">G(D-7)</th>
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
                    <td style="padding: 12px;">${r.data.wet_tonnes || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
                    <td style="padding: 12px;">${r.data.grade || '-'}</td>
                    <td style="padding: 12px;">${r.data.grade_7 || '-'}</td>
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

                let dateDisplay = r.date;
                if (r.date && r.date.includes('-')) {
                    const [y, m, d] = r.date.split('-');
                    dateDisplay = `${d}-${m}-${y}`;
                }

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
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
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
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
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_act_grade || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
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

                // Note: Saved as daily_act_tonnes (Tonnage) and daily_actual (Grade)
                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${r.data.daily_act_tonnes || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
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
                <th style="padding: 12px; text-align: left;">MTD Actual</th>
                <th style="padding: 12px; text-align: left;">MTD Forecast</th>
                <th style="padding: 12px; text-align: left;">MTD Var %</th>
                <th style="padding: 12px; text-align: left;">Outlook (a)</th>
                <th style="padding: 12px; text-align: left;">Full Forecast (b)</th>
                <th style="padding: 12px; text-align: left;">Full Budget (c)</th>
                <th style="padding: 12px; text-align: left;">Budget Var %</th>
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

                // Note: Using specific keys saved in renderMiningMaterialForm (daily_var, mtd_var, budget_var)
                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_var || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_var || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.budget_var || '-'}</td>
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
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
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
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
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

                // For Recovery, ensure we show values (possibly text with %)
                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${val(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${val(r.data.outlook)}%</td>
                    <td style="padding: 12px;">${val(r.data.full_forecast)}%</td>
                    <td style="padding: 12px;">${val(r.data.full_budget)}%</td>
                    <td style="padding: 12px;">${val(r.data.var3)}</td>
                    <td style="padding: 12px;">${val(r.data.day2)}</td>
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
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
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

                // Helper
                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${val(r.data.daily_act_tonnes)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${val(r.data.outlook)}</td>
                    <td style="padding: 12px;">${val(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${val(r.data.var3)}</td>
                    <td style="padding: 12px;">${val(r.data.day2)}</td>
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
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
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

                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';
                const formatNum = (v) => (v !== undefined && v !== null && v !== '' && !isNaN(v)) ? Number(v).toLocaleString() : val(v);

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${formatNum(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.outlook)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${formatNum(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${val(r.data.var3)}</td>
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
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
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
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
                    <td style="padding: 12px;">${r.data.day2 || '-'}</td>
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
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Outlook</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">Day-2</th>
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
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_actual || '-'}</td>
                    <td style="padding: 12px;">${r.data.mtd_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${r.data.outlook || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_forecast || '-'}</td>
                    <td style="padding: 12px;">${r.data.full_budget || '-'}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
                    <td style="padding: 12px;">${r.data.day2 || '-'}</td>
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
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="11" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
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

                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${val(r.data.qty_available)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${val(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.full_budget)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Safety Incidents
        if (STATE.currentMetric === 'Safety Incidents') {
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

                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${val(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${val(r.data.outlook)}</td>
                    <td style="padding: 12px;">${val(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${val(r.data.var3)}</td>
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

                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${val(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${val(r.data.outlook)}</td>
                    <td style="padding: 12px;">${val(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${val(r.data.var3)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Anx Excavators (Identical columns to Prime for now)
        if (STATE.currentMetric === 'Anx Excavators') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | Qty Avail | D.Act(%) | D.Fcst(%) | Var% | MTD.Act | MTD.Fcst | Var% | F.Fcst | F.Budg | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">Qty Avail</th>
                <th style="padding: 12px; text-align: left;">D.Act(%)</th>
                <th style="padding: 12px; text-align: left;">D.Fcst(%)</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="11" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
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

                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${val(r.data.qty_available)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${val(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.full_budget)}</td>
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

                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${val(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${val(r.data.outlook)}</td>
                    <td style="padding: 12px;">${val(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${val(r.data.var3)}</td>
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
        if (STATE.currentMetric === 'Light Vehicles' || STATE.currentMetric === 'Tipper Trucks') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | Qty Avail | D.Act(%) | D.Fcst(%) | Var% | MTD.Act | MTD.Fcst | Var% | F.Fcst | F.Budg | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
                <th style="padding: 12px; text-align: left;">Qty Avail</th>
                <th style="padding: 12px; text-align: left;">D.Act(%)</th>
                <th style="padding: 12px; text-align: left;">D.Fcst(%)</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="11" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
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

                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${val(r.data.qty_available)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${val(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.full_budget)}</td>
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
                <th style="padding: 12px; text-align: left;">MTD.Act</th>
                <th style="padding: 12px; text-align: left;">MTD.Fcst</th>
                <th style="padding: 12px; text-align: left;">Var%</th>
                <th style="padding: 12px; text-align: left;">F.Fcst</th>
                <th style="padding: 12px; text-align: left;">F.Budg</th>
                <th style="padding: 12px; text-align: left;">Action</th>
            `;

            if (filteredRecords.length === 0) {
                tbody.innerHTML = `<tr><td colspan="11" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
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

                const val = (v) => (v !== undefined && v !== null && v !== '') ? v : '-';

                tr.innerHTML = `
                    <td style="padding: 12px;">${dateDisplay}</td>
                    <td style="padding: 12px;">${val(r.data.qty_available)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${val(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${val(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.full_budget)}</td>
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
                <th style="padding: 12px; text-align: left;">Action</th>
            `;
        }

        // Standard records only - exclude Fixed Inputs to prevent duplication in Daily Input views
        filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

        if (filteredRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 12px; text-align: center;">No records found for ' + STATE.currentMetric + '</td></tr>';
            return;
        }

        filteredRecords.forEach(r => {
            const tr = document.createElement('tr');
            tr.style.borderTop = '1px solid #e5e7eb';
            tr.innerHTML = `
                <td style="padding: 12px;">${r.date}</td>
                <td style="padding: 12px;">${r.metric_name}</td>
                <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                <td style="padding: 12px;">${r.data.daily_forecast || '-'}</td>
                <td style="padding: 12px;">${r.data.var1 || '-'}</td>
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
