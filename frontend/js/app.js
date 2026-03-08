// app.js
// Main application logic

// State
const STATE = {
    currentUser: null,
    systemUser: null,
    currentDept: "Milling_CIL",
    currentMetric: "Gold Contained"
};

const DEPARTMENTS = ["Geology", "Mining", "Crushing", "Milling_CIL", "OHS", "Engineering", "GM_Report"];

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
        "Drill Rigs",
        "Crusher",
        "Mill"
    ],
    "GM_Report": []
};

document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch of system user
    fetchSystemUser().then(u => {
        if (u && u.username) {
            STATE.systemUser = u.username;
            // If app is already running, we might want to refresh?
            // But usually initApp happens fast.
            // If we are already logged in, re-render sidebar/header?
            if (STATE.currentUser) {
                renderSidebar();
            }
        }
    });

    const storedUser = localStorage.getItem('kpi_current_user');
    if (storedUser) {
        try {
            STATE.currentUser = JSON.parse(storedUser);
            initApp();
        } catch (e) {
            renderHomePage();
        }
    } else {
        renderHomePage();
    }
});

function renderHomePage() {
    renderLoginScreen();
}

function verifyAdminAccess(onSuccess) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    const container = document.createElement('div');
    container.style.maxWidth = '400px';
    container.style.margin = '80px auto';
    container.style.padding = '30px';
    container.style.background = 'white';
    container.style.borderRadius = '12px';
    container.style.boxShadow = 'var(--shadow-lg)';
    container.style.textAlign = 'center';
    container.style.border = '1px solid var(--border)';

    const title = document.createElement('h2');
    title.textContent = 'Admin Verification';
    title.style.marginBottom = '10px';
    title.style.color = '#dc2626'; // Red
    container.appendChild(title);

    const sub = document.createElement('p');
    sub.textContent = "Please enter Admin credentials to proceed.";
    sub.style.marginBottom = '20px';
    sub.style.fontSize = '14px';
    sub.style.color = '#6b7280';
    container.appendChild(sub);

    const username = DOM.createInputGroup('Admin Username', 'ver-username');
    const password = DOM.createInputGroup('Admin Password', 'ver-password', 'password');

    container.appendChild(username.container);
    container.appendChild(password.container);

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';
    btnContainer.style.marginTop = '20px';
    btnContainer.style.flexDirection = 'column';

    const verifyBtn = DOM.createButton('Verify', () => {
        const u = username.input.value;
        const p = password.input.value;

        const users = JSON.parse(localStorage.getItem('kpi_users') || '[]');

        // Failsafe for admin/admin
        if (u === 'admin' && p === 'admin') {
            // Check if admin user exists in list
            let adminUser = users.find(x => x.username === 'admin');
            if (!adminUser) {
                // Determine if we should create it
                adminUser = { username: 'admin', password: 'admin', role: 'Admin' };
                users.push(adminUser);
                localStorage.setItem('kpi_users', JSON.stringify(users));
            } else if (adminUser.role !== 'Admin') {
                // Fix role if incorrect
                adminUser.role = 'Admin';
                localStorage.setItem('kpi_users', JSON.stringify(users));
            }
            onSuccess();
            return;
        }

        const user = users.find(x => x.username === u && x.password === p);
        if (user && user.role === 'Admin') {
            onSuccess();
        } else {
            alert('Access Denied: Invalid credentials or not an Admin.');
        }
    });
    verifyBtn.style.width = '100%';
    verifyBtn.style.backgroundColor = '#dc2626'; // Red for security context

    const cancelBtn = DOM.createButton('Cancel', () => {
        renderHomePage();
    }, 'ghost');
    cancelBtn.style.width = '100%';

    btnContainer.appendChild(verifyBtn);
    btnContainer.appendChild(cancelBtn);
    container.appendChild(btnContainer);
    content.appendChild(container);
}

function renderUsersDirectory() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    if (sidebar) sidebar.style.display = 'none';

    content.innerHTML = '';

    const container = document.createElement('div');
    container.style.maxWidth = '800px';
    container.style.margin = '40px auto';
    container.style.padding = '30px';
    container.style.background = 'white';
    container.style.borderRadius = '12px';
    container.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '20px';

    const h2 = document.createElement('h2');
    h2.textContent = "Users Directory";

    const headerRight = document.createElement('div');
    headerRight.style.display = 'flex';
    headerRight.style.gap = '10px';

    const createUserBtn = document.createElement('button');
    createUserBtn.textContent = "Create User";
    createUserBtn.style.padding = '8px 16px';
    createUserBtn.style.backgroundColor = '#10b981'; // Green
    createUserBtn.style.color = 'white';
    createUserBtn.style.border = 'none';
    createUserBtn.style.borderRadius = '5px';
    createUserBtn.style.cursor = 'pointer';
    createUserBtn.onclick = () => renderRegisterScreen(); // Direct link since we are already verified to be here
    headerRight.appendChild(createUserBtn);

    const backBtn = document.createElement('button');
    backBtn.textContent = "Back to Home";
    backBtn.style.padding = '8px 16px';
    backBtn.style.cursor = 'pointer';
    backBtn.onclick = () => renderHomePage();
    headerRight.appendChild(backBtn);

    header.appendChild(h2);
    header.appendChild(headerRight);

    container.appendChild(header);

    // Users List
    const users = JSON.parse(localStorage.getItem('kpi_users') || '[]');

    if (users.length === 0) {
        const p = document.createElement('p');
        p.textContent = "No users found.";
        container.appendChild(p);
    } else {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background-color: #f3f4f6; text-align: left;">
                <th style="padding: 12px; border-bottom: 2px solid #ddd;">Username</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd;">Password</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd;">Department</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd;">Role</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd;">Action</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        users.forEach((user, index) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';

            tr.innerHTML = `
                <td style="padding: 12px;">${user.username}</td>
                <td style="padding: 12px;">${user.password || '****'}</td>
                <td style="padding: 12px;">${user.department || '-'}</td>
                <td style="padding: 12px;">${user.role || '-'}</td>
                <td style="padding: 12px;"></td> 
            `;

            // Actions
            const actionsTd = tr.querySelector('td:last-child');

            // Edit Button (Icon)
            const editBtn = document.createElement('button');
            editBtn.innerHTML = "&#9998;"; // Pencil Icon
            editBtn.title = "Edit User";
            editBtn.style.color = '#2563eb'; // Blue
            editBtn.style.border = 'none';
            editBtn.style.background = 'none';
            editBtn.style.cursor = 'pointer';
            editBtn.style.fontSize = '18px';
            editBtn.style.marginRight = '10px';
            editBtn.onclick = () => renderEditUserScreen(user, index);
            actionsTd.appendChild(editBtn);

            // Delete Button (Icon)
            const delBtn = document.createElement('button');
            delBtn.innerHTML = "&#128465;"; // Trash Can Icon
            delBtn.title = "Remove User";
            delBtn.style.color = 'red';
            delBtn.style.border = 'none';
            delBtn.style.background = 'none';
            delBtn.style.cursor = 'pointer';
            delBtn.style.fontSize = '18px';
            delBtn.onclick = () => {
                DOM.showConfirmModal('Delete User', `Are you sure you want to remove user '${user.username}'?`, () => {
                    users.splice(index, 1);
                    localStorage.setItem('kpi_users', JSON.stringify(users));
                    renderUsersDirectory(); // Refresh
                });
            };
            actionsTd.appendChild(delBtn);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    }

    content.appendChild(container);
}

function renderEditUserScreen(user, index) {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    if (sidebar) sidebar.style.display = 'none';

    content.innerHTML = '';

    const container = document.createElement('div');
    container.style.maxWidth = '400px';
    container.style.margin = '40px auto';
    container.style.padding = '30px';
    container.style.background = 'white';
    container.style.borderRadius = '12px';
    container.style.boxShadow = 'var(--shadow-lg)';
    container.style.textAlign = 'center';
    container.style.border = '1px solid var(--border)';

    const title = document.createElement('h2');
    title.textContent = 'Edit User';
    title.style.marginBottom = '20px';
    container.appendChild(title);

    const username = DOM.createInputGroup('Username', 'edit-username');
    username.input.value = user.username;
    // Ideally, username should be read-only or carefully managed to avoid duplication if changed
    username.input.disabled = true; // Let's keep it immutable for simplicity for now, or allow change with dupe check

    const password = DOM.createInputGroup('Password', 'edit-password', 'text'); // Visible for editing
    password.input.value = user.password;

    // Department Select (Reuse logic or simplify)
    const deptDiv = document.createElement('div');
    deptDiv.style.marginBottom = '10px';
    deptDiv.style.textAlign = 'left';

    const deptLabel = document.createElement('label');
    deptLabel.className = 'small';
    deptLabel.textContent = 'Department';
    deptLabel.style.display = 'block';
    deptLabel.style.marginBottom = '4px';
    deptLabel.style.fontSize = '12px';
    deptLabel.style.color = '#6b7280';

    const deptSelect = document.createElement('select');
    deptSelect.id = 'edit-dept';
    deptSelect.style.width = '100%';
    deptSelect.style.padding = '8px';
    deptSelect.style.border = '1px solid #d1d5db';
    deptSelect.style.borderRadius = '6px';
    deptSelect.style.boxSizing = 'border-box';
    deptSelect.style.backgroundColor = 'white';

    // Add options
    const defOpt = document.createElement('option');
    defOpt.value = '';
    defOpt.textContent = 'Select Department';
    deptSelect.appendChild(defOpt);

    DEPARTMENTS.forEach(d => {
        const op = document.createElement('option');
        op.value = d;
        op.textContent = d.replace('_', ' ');
        if (d === user.department) op.selected = true;
        deptSelect.appendChild(op);
    });

    deptLabel.appendChild(deptSelect);
    deptDiv.appendChild(deptLabel);

    // Role Select
    const roleDiv = document.createElement('div');
    roleDiv.style.marginBottom = '10px';
    roleDiv.style.textAlign = 'left';

    const roleLabel = document.createElement('label');
    roleLabel.className = 'small';
    roleLabel.textContent = 'Role';
    roleLabel.style.display = 'block';
    roleLabel.style.marginBottom = '4px';
    roleLabel.style.fontSize = '12px';
    roleLabel.style.color = '#6b7280';

    const roleSelect = document.createElement('select');
    roleSelect.id = 'edit-role';
    roleSelect.style.width = '100%';
    roleSelect.style.padding = '8px';
    roleSelect.style.border = '1px solid #d1d5db';
    roleSelect.style.borderRadius = '6px';
    roleSelect.style.boxSizing = 'border-box';
    roleSelect.style.backgroundColor = 'white';

    const ROLES = ['GM', 'HOD', 'Admin', 'Staff'];
    const defRole = document.createElement('option');
    defRole.value = '';
    defRole.textContent = 'Select Role';
    roleSelect.appendChild(defRole);

    ROLES.forEach(r => {
        const op = document.createElement('option');
        op.value = r;
        op.textContent = r;
        if (r === user.role) op.selected = true;
        roleSelect.appendChild(op);
    });

    roleLabel.appendChild(roleSelect);
    roleDiv.appendChild(roleLabel);

    container.appendChild(username.container);
    container.appendChild(password.container);
    container.appendChild(deptDiv);
    container.appendChild(roleDiv);

    const saveBtn = DOM.createButton('Save Changes', () => {
        const p = password.input.value;
        const d = deptSelect.value;
        const r = roleSelect.value;

        if (!p || !d || !r) { alert('Please fill all fields'); return; }

        const users = JSON.parse(localStorage.getItem('kpi_users') || '[]');
        // check if user still exists at index? Or just find by username
        // Since username is immutable here, find by username
        const targetIndex = users.findIndex(u => u.username === user.username);

        if (targetIndex !== -1) {
            users[targetIndex].password = p;
            users[targetIndex].department = d;
            users[targetIndex].role = r;
            localStorage.setItem('kpi_users', JSON.stringify(users));
            alert('User updated successfully!');
            renderUsersDirectory();
        } else {
            alert('Error: User not found.');
            renderUsersDirectory();
        }
    });
    saveBtn.style.width = '100%';
    saveBtn.style.marginTop = '20px';
    saveBtn.style.backgroundColor = '#10b981'; // Green

    const cancelBtn = DOM.createButton('Cancel', () => {
        renderUsersDirectory();
    }, 'ghost');
    cancelBtn.style.width = '100%';
    cancelBtn.style.marginTop = '10px';

    container.appendChild(saveBtn);
    container.appendChild(cancelBtn);
    content.appendChild(container);
}

function initApp() {
    // Failsafe: if no user logic, redirect to login
    if (!STATE.currentUser) {
        // Double check localstorage
        const storedUser = localStorage.getItem('kpi_current_user');
        if (storedUser) {
            STATE.currentUser = JSON.parse(storedUser);
        } else {
            renderHomePage();
            return;
        }
    }

    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.display = 'block';

    renderSidebar();
    loadDepartmentView(STATE.currentDept);
}

function renderLoginScreen() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    if (sidebar) sidebar.style.display = 'none';

    content.innerHTML = '';

    const container = document.createElement('div');
    container.style.maxWidth = '400px';
    container.style.margin = '80px auto';
    container.style.padding = '30px';
    container.style.background = 'white';
    container.style.borderRadius = '12px';
    container.style.boxShadow = 'var(--shadow-lg)';
    container.style.textAlign = 'center';
    container.style.border = '1px solid var(--border)';

    const title = document.createElement('h2');
    title.textContent = 'Adamus KPI Login';
    title.style.marginBottom = '20px';
    title.style.color = '#2563eb';
    container.appendChild(title);

    const username = DOM.createInputGroup('Username', 'login-username');
    const password = DOM.createInputGroup('Password', 'login-password', 'password');

    container.appendChild(username.container);
    container.appendChild(password.container);

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';
    btnContainer.style.marginTop = '20px';
    btnContainer.style.flexDirection = 'column';

    const loginBtn = DOM.createButton('Login', () => {
        performLogin(username.input.value, password.input.value);
    });
    loginBtn.style.width = '100%';

    const cancelBtn = DOM.createButton('Cancel', () => {
        username.input.value = '';
        password.input.value = '';
    }, 'ghost');
    cancelBtn.style.width = '100%';

    const forgotLink = document.createElement('a');
    forgotLink.textContent = 'Forgot Password?';
    forgotLink.style.display = 'block';
    forgotLink.style.marginTop = '15px';
    forgotLink.style.color = '#2563eb';
    forgotLink.style.cursor = 'pointer';
    forgotLink.style.fontSize = '13px';
    forgotLink.onclick = () => {
        const targetUsername = username.input.value;
        if (!targetUsername) {
            alert('Please enter the username you wish to reset the password for, then click "Forgot Password?".');
            return;
        }

        verifyAdminAccess(() => {
            const users = JSON.parse(localStorage.getItem('kpi_users') || '[]');
            const index = users.findIndex(x => x.username === targetUsername);

            if (index !== -1) {
                // Admin verified, proceed to reset
                // Since we are in the admin context (verifyAdminAccess clears screen), 
                // we might want to show a simple prompt or a small form.
                // For simplicity, let's just use prompt, but note that verifyAdminAccess clears the screen.
                // We should probably re-render login or home after.

                setTimeout(() => { // Timeout to allow UI effective update if needed
                    const newPass = prompt(`Admin verification successful.\nEner new password for user '${targetUsername}':`);
                    if (newPass) {
                        users[index].password = newPass;
                        localStorage.setItem('kpi_users', JSON.stringify(users));
                        alert(`Password for user '${targetUsername}' has been reset successfully.`);
                        renderLoginScreen();
                    } else {
                        renderLoginScreen();
                    }
                }, 100);
            } else {
                alert('User not found.');
                renderLoginScreen();
            }
        });
    };

    const createLink = document.createElement('a');
    createLink.textContent = "New User? Create Account";
    createLink.style.display = 'block';
    createLink.style.marginTop = '15px';
    createLink.style.color = '#2563eb';
    createLink.style.textDecoration = 'none';
    createLink.style.fontSize = '13px';
    createLink.style.cursor = 'pointer';
    createLink.onclick = function () {
        verifyAdminAccess(() => renderRegisterScreen());
    };

    const dirLink = document.createElement('a');
    dirLink.textContent = "Users Directory";
    dirLink.style.display = 'block';
    dirLink.style.marginTop = '15px';
    dirLink.style.color = '#2563eb';
    dirLink.style.textDecoration = 'none';
    dirLink.style.fontSize = '13px';
    dirLink.style.cursor = 'pointer';
    dirLink.onclick = function () {
        verifyAdminAccess(() => renderUsersDirectory());
    };

    // Append all
    btnContainer.appendChild(loginBtn);
    btnContainer.appendChild(cancelBtn);
    container.appendChild(btnContainer);
    container.appendChild(forgotLink);
    container.appendChild(createLink);
    container.appendChild(dirLink);

    content.appendChild(container);
}

function renderRegisterScreen() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    if (sidebar) sidebar.style.display = 'none';

    content.innerHTML = '';

    const container = document.createElement('div');
    container.style.maxWidth = '400px';
    container.style.margin = '40px auto'; // Reduced margin to fit more fields
    container.style.padding = '30px';
    container.style.background = 'white';
    container.style.borderRadius = '12px';
    container.style.boxShadow = 'var(--shadow-lg)';
    container.style.textAlign = 'center';
    container.style.border = '1px solid var(--border)';

    const title = document.createElement('h2');
    title.textContent = 'Create Account';
    title.style.marginBottom = '20px';
    container.appendChild(title);

    const username = DOM.createInputGroup('Username', 'reg-username');
    const password = DOM.createInputGroup('Password', 'reg-password', 'password');
    const confirm = DOM.createInputGroup('Confirm Password', 'reg-confirm', 'password');

    // Department Select
    const deptDiv = document.createElement('div');
    deptDiv.style.marginBottom = '10px';
    deptDiv.style.textAlign = 'left';

    const deptLabel = document.createElement('label');
    deptLabel.className = 'small';
    deptLabel.textContent = 'Department';
    deptLabel.style.display = 'block';
    deptLabel.style.marginBottom = '4px';
    deptLabel.style.fontSize = '12px';
    deptLabel.style.color = '#6b7280';

    const deptSelect = document.createElement('select');
    deptSelect.id = 'reg-dept';
    deptSelect.style.width = '100%';
    deptSelect.style.padding = '8px';
    deptSelect.style.border = '1px solid #d1d5db';
    deptSelect.style.borderRadius = '6px';
    deptSelect.style.boxSizing = 'border-box';
    deptSelect.style.backgroundColor = 'white';

    const defOpt = document.createElement('option');
    defOpt.value = '';
    defOpt.textContent = 'Select Department';
    deptSelect.appendChild(defOpt);

    DEPARTMENTS.forEach(d => {
        const op = document.createElement('option');
        op.value = d;
        op.textContent = d.replace('_', ' ');
        deptSelect.appendChild(op);
    });

    deptLabel.appendChild(deptSelect);
    deptDiv.appendChild(deptLabel);

    // Role Select
    const roleDiv = document.createElement('div');
    roleDiv.style.marginBottom = '10px';
    roleDiv.style.textAlign = 'left';

    const roleLabel = document.createElement('label');
    roleLabel.className = 'small';
    roleLabel.textContent = 'Role';
    roleLabel.style.display = 'block';
    roleLabel.style.marginBottom = '4px';
    roleLabel.style.fontSize = '12px';
    roleLabel.style.color = '#6b7280';

    const roleSelect = document.createElement('select');
    roleSelect.id = 'reg-role';
    roleSelect.style.width = '100%';
    roleSelect.style.padding = '8px';
    roleSelect.style.border = '1px solid #d1d5db';
    roleSelect.style.borderRadius = '6px';
    roleSelect.style.boxSizing = 'border-box';
    roleSelect.style.backgroundColor = 'white';

    // Default option
    const defRole = document.createElement('option');
    defRole.value = '';
    defRole.textContent = 'Select Role';
    roleSelect.appendChild(defRole);

    const ROLES = ['GM', 'HOD', 'Admin', 'Staff'];
    ROLES.forEach(r => {
        const op = document.createElement('option');
        op.value = r;
        op.textContent = r;
        roleSelect.appendChild(op);
    });

    roleLabel.appendChild(roleSelect);
    roleDiv.appendChild(roleLabel);

    container.appendChild(username.container);
    container.appendChild(password.container);
    container.appendChild(confirm.container);
    container.appendChild(deptDiv);
    container.appendChild(roleDiv);

    const createBtn = DOM.createButton('Create User', () => {
        const u = username.input.value;
        const p = password.input.value;
        const c = confirm.input.value;
        const d = deptSelect.value;
        const r = roleSelect.value;

        if (!u || !p || !d || !r) { alert('Please fill all fields'); return; }
        if (p !== c) { alert('Passwords do not match'); return; }

        const users = JSON.parse(localStorage.getItem('kpi_users') || '[]');
        if (users.find(x => x.username === u)) {
            alert('User already exists');
            return;
        }

        users.push({
            username: u,
            password: p,
            department: d,
            role: r
        });

        localStorage.setItem('kpi_users', JSON.stringify(users));
        alert('User created! Please login.');
        renderLoginScreen();
    });
    createBtn.style.width = '100%';
    createBtn.style.marginTop = '20px';

    const backBtn = DOM.createButton('Back to Home', () => {
        renderHomePage();
    }, 'ghost');
    backBtn.style.width = '100%';
    backBtn.style.marginTop = '10px';

    container.appendChild(createBtn);
    container.appendChild(backBtn);
    content.appendChild(container);
}

function performLogin(u, p) {
    const users = JSON.parse(localStorage.getItem('kpi_users') || '[]');

    // Auto-create admin if no users
    if (users.length === 0 && u === 'admin' && p === 'admin') {
        const admin = { username: 'admin', password: 'admin', role: 'Admin' };
        users.push(admin);
        localStorage.setItem('kpi_users', JSON.stringify(users));
    }

    const user = users.find(x => x.username === u && x.password === p);
    if (user) {
        STATE.currentUser = user;
        localStorage.setItem('kpi_current_user', JSON.stringify(user));
        initApp();
    } else {
        alert('Invalid credentials');
    }
}

function logout() {
    STATE.currentUser = null;
    localStorage.removeItem('kpi_current_user');
    renderHomePage();
}

function renderSidebar() {
    const nav = document.getElementById('sidebar');
    const userDisplay = STATE.systemUser || (STATE.currentUser ? STATE.currentUser.username : 'User');

    const userRole = STATE.currentUser ? STATE.currentUser.role : 'User';
    const canViewChat = ['Admin', 'GM', 'HOD'].includes(userRole);

    // Sidebar styling - The user requested the sidebar to change to a sleek black (#111827)
    const sidebarBg = '#111827';
    const sidebarText = '#ffffff';
    const sidebarHover = 'rgba(255, 255, 255, 0.1)';

    // Apply background to the sidebar container (this might need to be done in CSS or here)
    // We'll update the CSS file separately, but let's Ensure the styles inside work.

    nav.innerHTML = `
        <h2 style="margin-bottom: 20px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 15px;"><i class="fa-solid fa-chart-line" style="margin-right: 8px; color: #fbbf24;"></i>Adamus KPI</h2>
        
        <div style="margin-bottom:20px; padding:15px; background: rgba(0,0,0,0.2); border-radius:8px; font-size:14px; color: #fff; border: 1px solid rgba(255,255,255,0.1);">
            Logged in as: <strong style="color: #fbbf24;">${userDisplay}</strong><br>
            <span style="font-size:12px; opacity:0.8;">Role: ${userRole}</span>
            <div style="margin-top:8px; text-align:right;">
                <a href="#" onclick="renderHomePage()" style="color: #60a5fa; font-size:12px; text-decoration:none; font-weight: 500; margin-right: 12px;"><i class="fa-solid fa-home"></i> Home</a>
                <a href="#" onclick="logout()" style="color: #fca5a5; font-size:12px; text-decoration:none; font-weight: 500;"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
            </div>
        </div>

        <div style="font-size: 11px; color: #fbbf24; opacity: 0.8; letter-spacing: 1px; font-weight: bold; margin-bottom: 8px; margin-top: 10px;">DEPARTMENTS</div>
        <ul style="padding: 0; margin: 0; margin-bottom: 20px;">
            ${DEPARTMENTS.map(dept => {
        let iconClass = 'fa-solid fa-circle';
        switch (dept) {
            case 'Geology': iconClass = 'fa-solid fa-mountain'; break;
            case 'Mining': iconClass = 'fa-solid fa-person-digging'; break;
            case 'Crushing': iconClass = 'fa-solid fa-hammer'; break;
            case 'Milling_CIL': iconClass = 'fa-solid fa-industry'; break;
            case 'OHS': iconClass = 'fa-solid fa-truck-medical'; break;
            case 'Engineering': iconClass = 'fa-solid fa-wrench'; break;
            case 'GM_Report': iconClass = 'fa-solid fa-file-invoice'; break;
        }
        return `
                <li style="margin-bottom: 4px; list-style: none;">
                    <a href="#" onclick="loadDepartmentView('${dept}')" 
                       style="text-decoration: none; color: ${sidebarText}; display: flex; align-items: center; padding: 10px 12px; border-radius: 6px; font-weight: 500; transition: all 0.2s; ${dept === 'GM_Report' ? 'font-size: 14px;' : ''}"
                       onmouseover="this.style.backgroundColor='${sidebarHover}'"
                       onmouseout="this.style.backgroundColor='transparent'">
                       <i class="${iconClass}" style="width: 20px; text-align: center; margin-right: 12px; font-size: 15px; opacity: 0.9;"></i>
                       ${dept.replace('_', ' ')}
                    </a>
                </li>
                `;
    }).join('')}
        </ul>

        ${userRole === 'Admin' ? `
        <div style="font-size: 11px; color: #fbbf24; opacity: 0.8; letter-spacing: 1px; font-weight: bold; margin-bottom: 8px;">ADMINISTRATION</div>
        <ul style="padding: 0; margin: 0;">
            <li style="margin-bottom: 4px; list-style: none;">
                <a href="#" onclick="renderUsersDirectory()" 
                   style="text-decoration: none; color: ${sidebarText}; display: flex; align-items: center; padding: 10px 12px; border-radius: 6px; font-weight: 500; transition: all 0.2s;"
                   onmouseover="this.style.backgroundColor='${sidebarHover}'"
                   onmouseout="this.style.backgroundColor='transparent'">
                   <i class="fa-solid fa-users" style="width: 20px; text-align: center; margin-right: 12px; font-size: 15px; opacity: 0.9;"></i>
                   Users
                </a>
            </li>
        </ul>
        <div style="margin-bottom: 20px;"></div>
        ` : ''}

        ${canViewChat ? `
        <!-- Sidebar Chat Widget -->
        <div id="sidebar-chat" style="margin-top: auto; background: rgba(0,0,0,0.25); border-top: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
             <div style="font-size: 13px; color: #fbbf24; font-weight: bold; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                 <span>Chat Room</span>
                 <span id="clear-chat-btn" style="cursor: pointer; font-size: 11px; color: #fca5a5; opacity: 0.9;" title="Clear Chat history">Clear</span>
             </div>
             <div id="sidebar-chat-messages" style="height: 120px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 8px; font-size: 12px; color: #e5e7eb; border-radius: 4px; margin-bottom: 5px;"></div>
             <div style="display: flex; gap: 5px;">
                 <input type="text" id="sidebar-chat-input" placeholder="Type..." style="flex: 1; min-width: 0; padding: 6px; font-size: 12px; background: rgba(255,255,255,0.95); border: none; color: #333; border-radius: 4px;">
                 <button id="sidebar-chat-send" style="padding: 6px 10px; font-size: 12px; background: #fbbf24; border: none; border-radius: 4px; cursor: pointer; color: #78350f; font-weight: bold;">></button>
             </div>
        </div>
        ` : ''}
    `;

    // Only init chat if allowed
    if (canViewChat) {
        // Initialize Sidebar Chat
        const msgList = document.getElementById('sidebar-chat-messages');
        const input = document.getElementById('sidebar-chat-input');
        const btn = document.getElementById('sidebar-chat-send');
        const clearBtn = document.getElementById('clear-chat-btn');

        const loadSidebarChat = async () => {
            try {
                // Keep limit low for small widget
                const response = await fetch(`${API_BASE_URL}/chat?limit=20`);
                if (!response.ok) return;
                const messages = await response.json();

                msgList.innerHTML = '';
                messages.forEach(msg => {
                    const div = document.createElement('div');
                    div.style.marginBottom = '4px';
                    // Simple format: Name: Message
                    div.innerHTML = `<strong style="color: #fbbf24;">${msg.sender}:</strong> ${msg.message}`;
                    msgList.appendChild(div);
                });
                msgList.scrollTop = msgList.scrollHeight;
            } catch (e) {
                console.error("Sidebar chat error", e);
            }
        };

        const sendSidebarMessage = async () => {
            const text = input.value.trim();
            if (!text) return;
            const sender = STATE.systemUser || (STATE.currentUser ? STATE.currentUser.username : 'User');
            try {
                await fetch(`${API_BASE_URL}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender, message: text })
                });
                input.value = '';
                loadSidebarChat();
            } catch (e) { console.error(e); }
        };

        // Clear Chat Logic
        clearBtn.onclick = () => {
            DOM.showConfirmModal("Clear Chat", "Are you sure you want to clear the chat history?", async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/chat`, { method: 'DELETE' });
                    if (res.ok) {
                        loadSidebarChat();
                    } else {
                        alert("Failed to clear chat");
                    }
                } catch (e) { console.error(e); }
            });
        };


        btn.onclick = sendSidebarMessage;
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendSidebarMessage();
        });

        // Handle Interval (Global)
        if (STATE.sidebarChatInterval) clearInterval(STATE.sidebarChatInterval);
        loadSidebarChat();
        STATE.sidebarChatInterval = setInterval(loadSidebarChat, 5000); // Poll every 5s
    } else {
        // Ensure interval is cleared if permission removed (e.g. logout/re-login scenarios if SPA)
        if (STATE.sidebarChatInterval) clearInterval(STATE.sidebarChatInterval);
    }

}

// Make loadDepartmentView global so HTML onclick can find it
window.loadDepartmentView = async function (dept) {
    if (STATE.intervals) {
        STATE.intervals.forEach(i => clearInterval(i));
        STATE.intervals = [];
    }
    STATE.currentDept = dept;
    const content = document.getElementById('content');

    // -- GM Report View --
    if (dept === "GM_Report") {
        content.innerHTML = '';
        renderGMReport(content);
        return;
    }

    const availableMetrics = DEPT_METRICS[dept] || ["General"];
    // Default to the first metric if not set or if switching depts
    if (!availableMetrics.includes(STATE.currentMetric)) {
        STATE.currentMetric = availableMetrics[0];
    }

    const userDisplay = STATE.systemUser || (STATE.currentUser ? STATE.currentUser.username : 'User');
    // Initials logic: take first letter of each word if space exists, else first 2 chars
    const getInitials = (name) => {
        const parts = name.trim().split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };
    const userInitials = getInitials(userDisplay);

    content.innerHTML = `
        <div style="position: relative; background: white; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; display: flex; justify-content: flex-end; align-items: center;">
            <h2 style="margin: 0; color: #111827; position: absolute; left: 50%; transform: translateX(-50%); pointer-events: none;">${dept.replace('_', ' ')} Dashboard</h2>
            
            <div style="display: flex; align-items: center;">
                <span style="font-size: 14px; font-weight: 600; color: #374151; margin-right: 10px;">${userDisplay}</span>
                <div style="width: 36px; height: 36px; background-color: #111827; color: #fbbf24; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">
                    ${userInitials}
                </div>
            </div>
        </div>
        
        <!-- Submenu Navigation -->
        <div id="submenu-nav" style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            ${availableMetrics.map(metric => `
                <button class="btn" style="background-color: ${STATE.currentMetric === metric ? 'var(--primary)' : 'white'}; color: ${STATE.currentMetric === metric ? 'white' : 'var(--text-primary)'}; border: 1px solid #d1d5db;" 
                    onclick="loadMetricView('${metric}')">
                    ${metric}
                </button>
            `).join('')}
        </div>

        <div id="kpi-forms-container"></div>
        <div id="records-table-container" style="margin-top: 30px;">
            <h3><span id="table-metric-title">${STATE.currentMetric}</span></h3>
            <table id="records-table" style="width: 100%; border-collapse: collapse; margin-top: 10px; background: white; border-radius: 8px; overflow: hidden; box-shadow: var(--card-shadow);">
                <thead style="background: #f9fafb;">
                    <tr>
                        <th style="padding: 12px; text-align: left;">Date</th>
                        <th style="padding: 12px; text-align: left;">Metric</th>
                        <th style="padding: 12px; text-align: left;">Daily Actual</th>
                        <th style="padding: 12px; text-align: left;">Daily Forecast</th>
                        <th style="padding: 12px; text-align: left;">Var %</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;

    loadMetricView(STATE.currentMetric);
};

window.loadMetricView = function (metric) {
    STATE.currentMetric = metric;

    // Update active button state
    const buttons = document.querySelectorAll('#submenu-nav button');
    buttons.forEach(btn => {
        if (btn.textContent.trim() === metric) {
            btn.style.backgroundColor = 'var(--primary)';
            btn.style.color = 'white';
        } else {
            btn.style.backgroundColor = 'white';
            btn.style.color = 'var(--text-primary)';
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
        } else if ((metric === "Light Vehicles" || metric === "Tipper Trucks" || metric === "Prime Excavators" || metric === "Anx Excavators" || metric === "Dump Trucks" || metric === "ART Dump Trucks" || metric === "Wheel Loaders" || metric === "Graders" || metric === "Dozers" || metric === "Drill Rigs") && STATE.currentDept === "Engineering") {
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
    card.className = 'card';

    const title = document.createElement('h3');
    title.textContent = metricName;
    card.appendChild(title);

    // MTD Status Cards
    renderStatusCards(dept, metricName, card);

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
    } else if (dept === "Engineering" && metricName === "Drill Rigs") {
        renderEngineeringDrillRigsForm(dept, metricName, card);
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
    inputDays.step = 'any';
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
            num_days: parseFloat(daysVal) || 0,
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
    attachVarianceListener(outlook.input, fullFcst.input, budgVar.input);

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
        if (!dateVal) { DOM.showAlert("Watch Out!", "Please select a date.", "warning"); return; }

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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
    attachVarianceListener(outlook.input, fullFcst.input, budgVar.input);

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
        if (!dateVal) { DOM.showAlert("Watch Out!", "Please select a date.", "warning"); return; }

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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
    attachVarianceListener(outlook.input, fullFcst.input, budgVar.input);

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
        if (!dateVal) { DOM.showAlert("Watch Out!", "Please select a date.", "warning"); return; }

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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
    attachVarianceListener(outlook.input, fullFcst.input, budgVar.input);

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

            // Numerator: SumProduct = Σ (DailyActualGrade * DailyActual)
            let sumProduct = relevantRecords.reduce((sum, r) => {
                const rGrade = parseFloat(r.data.daily_act_grade) || 0; // Using daily_act_grade for Grade (g/t)
                const rAct = parseFloat(r.data.daily_actual) || 0; // Using daily_actual for weight
                return sum + (rGrade * rAct);
            }, 0);

            // Add Current Day Product
            const currentDailyAct = parseFloat(dAct.input.value) || 0;
            sumProduct += (currentDailyActGrade * currentDailyAct);

            // Denominator: Sum = Σ (DailyActual)
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
                mAct.input.value = 0;
            }
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.warn("Auto-calc MTD failed", e);
        }
    };

    dActGrade.input.addEventListener('input', calculateMTD);
    dAct.input.addEventListener('input', calculateMTD);
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
        if (!dateVal) { DOM.showAlert("Watch Out!", "Please select a date.", "warning"); return; }

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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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

            // MTD Actual Calculation (Weighted Average: SumProduct(DailyAct * DailyActT) / Sum(DailyActT))
            // Only using Daily Actual (t) [Tonnage] as weight for Grade 
            const currentDailyActT = parseFloat(dActT.input.value) || 0;

            let numerator = 0;
            let denominator = 0;

            relevantRecords.forEach(r => {
                const rAct = parseFloat(r.data.daily_actual) || 0;
                const rActT = parseFloat(r.data.daily_act_tonnes) || 0;
                numerator += (rAct * rActT);
                denominator += rActT;
            });

            // Add current inputs
            numerator += (currentDailyAct * currentDailyActT);
            denominator += currentDailyActT;

            const totalMTDAct = (denominator !== 0) ? (numerator / denominator) : 0;

            mAct.input.value = totalMTDAct.toFixed(2);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

            // MTD Forecast Calculation - Re-enabled
            const prevFcstSum = relevantRecords.reduce((sum, r) => sum + (parseFloat(r.data.daily_forecast) || 0), 0);
            const totalMTDFcst = prevFcstSum + currentDailyFcst;
            mFcst.input.value = totalMTDFcst.toFixed(2);
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        } catch (e) {
            console.warn("Auto-calc MTD failed", e);
            // Fallback: Weighted calc with just current values
            const denom = currentDailyFcst;
            const num = currentDailyAct * currentDailyFcst;
            const res = denom !== 0 ? num / denom : 0;

            mAct.input.value = res.toFixed(2);
            mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
            mFcst.input.value = currentDailyFcst;
            mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    dAct.input.addEventListener('input', calculateMTD);
    dActT.input.addEventListener('input', calculateMTD);
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
    attachVarianceListener(outlook.input, fullFcst.input, budgVar.input);

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

                // Allow overriding days in month with fixed input num_days if available
                let divisorDays = daysInMonth;
                if (fixedRecord.data.num_days) {
                    divisorDays = parseFloat(fixedRecord.data.num_days);
                }

                // "and divide it by the number of days in month in date placeholder"
                if (divisorDays > 0) {
                    const calculatedDailyFcst = fullForecastVal / divisorDays;
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
    let fixedTargetDays = null;

    const updateCalculations = () => {
        const curDAct = parseFloat(dAct.input.value) || 0;
        const curDFcst = parseFloat(dFcst.input.value) || 0;

        // MTD Actual = History Sum + Current Daily
        const currentMtdAct = priorMtdAct + curDAct;
        mAct.input.value = Math.round(currentMtdAct * 100) / 100;
        mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        // MTD Forecast = History Sum + Current Forecast
        mFcst.input.value = Math.round((priorMtdFcst + curDFcst) * 100) / 100;
        mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        // Outlook Logic
        const dateVal = date.input.value;
        if (dateVal) {
            const d = new Date(dateVal);
            const calendarDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const totalDays = fixedTargetDays !== null ? fixedTargetDays : calendarDays;
            const currentDay = d.getDate();

            if (currentDay > 0) {
                const remainingDays = totalDays - currentDay;
                const ratio = remainingDays / currentDay;
                const adjustment = ratio * currentMtdAct;
                const finalVal = adjustment + currentMtdAct;

                outlook.input.value = Math.round(finalVal * 100) / 100;
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
                fullFcst.input.value = fixedRecord.data.full_forecast || '';
                fullBudg.input.value = fixedRecord.data.full_budget || '';
                fixedTargetDays = parseFloat(fixedRecord.data.num_days) || null;
                // Trigger events
                fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                fixedTargetDays = null;
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
    let fixedTargetDays = null;

    const updateCalculations = () => {
        const curDAct = parseFloat(dAct.input.value) || 0;
        const curDFcst = parseFloat(dFcst.input.value) || 0;

        // Logic: Prior Month Sum + Current Daily
        // Only if we found records. If not (priorMtdAct is 0), it just equals Daily Actual (plus 0).
        const finalMtd = priorMtdAct + curDAct;
        mAct.input.value = Math.round(finalMtd * 100) / 100;
        mAct.input.dispatchEvent(new Event('input', { bubbles: true }));

        const finalMtdFcst = priorMtdFcst + curDFcst;
        mFcst.input.value = Math.round(finalMtdFcst * 100) / 100;
        mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

        // Outlook Logic
        let currentOutlook = 0;
        const dateVal = date.input.value;
        if (dateVal) {
            const d = new Date(dateVal);
            const calendarDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const totalDays = fixedTargetDays !== null ? fixedTargetDays : calendarDays;
            const currentDay = d.getDate();

            if (currentDay > 0) {
                const remainingDays = totalDays - currentDay;
                const ratio = remainingDays / currentDay;
                const adjustment = ratio * finalMtd;
                const finalVal = adjustment + finalMtd;

                currentOutlook = finalVal;
                outlook.input.value = Math.round(finalVal * 100) / 100;
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
                fullFcst.input.value = fixedRecord.data.full_forecast || '';
                fullBudg.input.value = fixedRecord.data.full_budget || '';
                fixedTargetDays = parseFloat(fixedRecord.data.num_days) || null;
                fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                fullBudg.input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                fixedTargetDays = null;
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
    const dAct = DOM.createInputGroup("Daily Actual", `input-${dept}-daily-act`, "text");
    const dFcst = DOM.createInputGroup("Daily Forecast", `input-${dept}-daily-fcst`, "text");
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

    // Listener for Daily Forecast removed: MTD Forecast is derived from Gold Recovery and Gold Contained MTD Forecasts.

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
                const grMtdAct = parseFloat(grRecord.data.mtd_actual) || 0;
                const gcMtdAct = parseFloat(gcRecord.data.mtd_actual) || 0;
                const grMtdFcst = parseFloat(grRecord.data.mtd_forecast) || 0;
                const gcMtdFcst = parseFloat(gcRecord.data.mtd_forecast) || 0;

                // MTD Actual & Outlook
                if (gcMtdAct !== 0) {
                    const resultAct = (grMtdAct / gcMtdAct) * 100;
                    const formattedAct = resultAct.toFixed(2) + '%';
                    outlook.input.value = formattedAct;
                    mAct.input.value = formattedAct;
                    outlook.input.dispatchEvent(new Event('input', { bubbles: true }));
                    mAct.input.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    outlook.input.value = '';
                    mAct.input.value = '';
                }

                // MTD Forecast
                if (gcMtdFcst !== 0) {
                    const resultFcst = (grMtdFcst / gcMtdFcst) * 100;
                    const formattedFcst = resultFcst.toFixed(2) + '%';
                    mFcst.input.value = formattedFcst;
                    mFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    mFcst.input.value = '';
                }

            } else {
                outlook.input.value = '';
                mAct.input.value = '';
                mFcst.input.value = '';
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
        if (!dateVal) { DOM.showAlert("Watch Out!", "Please select a date.", "warning"); return; }

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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
        if (!dateVal) { DOM.showAlert("Watch Out!", "Please select a date.", "warning"); return; }

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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
        if (!dateVal) { DOM.showAlert("Watch Out!", "Please select a date.", "warning"); return; }

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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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

    const updateSafetyVariance = () => {
        dVar.input.value = calculateVariance(dAct.input.value, dFcst.input.value, true);
    };
    dAct.input.addEventListener('input', updateSafetyVariance);
    dFcst.input.addEventListener('input', updateSafetyVariance);

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input, true);

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
        if (!dateVal) { DOM.showAlert("Watch Out!", "Please select a date.", "warning"); return; }

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
            DOM.showAlert("Success!", `Awesome! ${metricName} Incident has been logged! 🛡️`, "success");
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
    const updateEnvVariance = (actInput, fcstInput, varInput) => {
        varInput.value = calculateVariance(actInput.value, fcstInput.value, true);
    };

    dAct.input.addEventListener('input', () => updateEnvVariance(dAct.input, dFcst.input, dVar.input));
    dFcst.input.addEventListener('input', () => updateEnvVariance(dAct.input, dFcst.input, dVar.input));

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;

    mAct.input.addEventListener('input', () => updateEnvVariance(mAct.input, mFcst.input, mVar.input));
    mFcst.input.addEventListener('input', () => updateEnvVariance(mAct.input, mFcst.input, mVar.input));

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
    outlook.input.addEventListener('input', () => updateEnvVariance(outlook.input, fullBudg.input, budgVar.input));
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
        DOM.showAlert("Success!", "Environmental Incident has been successfully logged! 🌱", "success");
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

    const updatePropDamVariance = (actInput, fcstInput, varInput) => {
        varInput.value = calculateVariance(actInput.value, fcstInput.value, true);
    };

    dAct.input.addEventListener('input', () => updatePropDamVariance(dAct.input, dFcst.input, dVar.input));
    dFcst.input.addEventListener('input', () => updatePropDamVariance(dAct.input, dFcst.input, dVar.input));

    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "number");
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "number");
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;

    // Logic: ((MTD Forecast - MTD Actual) / MTD Actual) * 100
    const updatePropDamMTDVariance = () => {
        mVar.input.value = calculateVariance(mAct.input.value, mFcst.input.value, true);
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

    const updatePropDamOutlookVariance = () => {
        budgVar.input.value = calculateVariance(outlook.input.value, fullBudg.input.value, true);
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Property Damage Record has been successfully logged! 🚧", "success");
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
            DOM.showAlert("Error!", "Failed to save record.", "error");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Error!", "Failed to save record.", "error");
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
                // alert(`Match Found for ${metricName}! ID: ${target.id}`); // Uncomment for distinct visual confirmation

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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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


function renderEngineeringDrillRigsForm(dept, metricName, card) {
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

    // Auto-Fetch Fixed Inputs on Date Change for Drill Rigs
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

    // Auto-Populate MTD Forecast from Daily Forecast for Drill Rigs
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
    date.input.value = '';

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text"); // Changed to text
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text"); // Changed to text
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Auto-Fetch Fixed Inputs on Date Change for Crusher
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
                        let bVal = target.data.full_budget;
                        if (typeof bVal === 'number') {
                            bVal = bVal + '%';
                        } else if (typeof bVal === 'string' && !bVal.includes('%')) {
                            bVal = bVal + '%';
                        }
                        fullBudg.input.value = bVal;
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

    // Auto-Populate MTD Forecast from Daily Forecast for Crusher
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
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "text"); // Changed to text

    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(fullFcst); add(fullBudg); grid.appendChild(document.createElement('div')); // Spacer

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
            return;
        }

        const record = {
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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
            // date.input.value = ''; // Keep date selected or clear?

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
    date.input.value = ''; // Default to empty

    // Row 2
    const dAct = DOM.createInputGroup("Daily Actual(%)", `input-${dept}-daily-act-pct`, "text"); // Changed to text
    const dFcst = DOM.createInputGroup("Daily Forecast(%)", `input-${dept}-daily-fcst-pct`, "text"); // Changed to text
    const dVar = DOM.createInputGroup("Var %", `input-${dept}-daily-var`, "text");
    dVar.input.readOnly = true;
    attachVarianceListener(dAct.input, dFcst.input, dVar.input);

    // Lookup Daily Forecast from Fixed Inputs (using Full Forecast)
    date.input.addEventListener('change', async () => {
        const dateVal = date.input.value;
        if (!dateVal) return;

        // Parse YYYY-MM from input for matching
        const searchMonth = `${dateVal.substring(0, 7)}`; // "YYYY-MM"

        try {
            const records = await fetchKPIRecords(dept);

            const target = records.find(r => {
                if (r.subtype !== 'fixed_input') return false;
                if (r.metric_name.trim().toLowerCase() !== metricName.trim().toLowerCase()) return false;

                // Match prefix of the stored date (YYYY-MM-01) with searchMonth (YYYY-MM)
                return r.date && r.date.startsWith(searchMonth);
            });

            if (target && target.data) {
                // alert("Record found: " + JSON.stringify(target.data));

                // Populate Daily Forecast from Full Forecast value in Fixed Inputs
                if (target.data.full_forecast != null) {
                    let val = target.data.full_forecast;
                    if (typeof val === 'number') {
                        val = val + '%';
                    } else if (typeof val === 'string' && !val.includes('%')) {
                        val = val + '%';
                    }

                    dFcst.input.value = val;
                    dFcst.input.dispatchEvent(new Event('input', { bubbles: true }));

                    // Also populate Full Forecast (b)
                    if (typeof fullFcst !== 'undefined') {
                        fullFcst.input.value = val;
                        fullFcst.input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }

                // Populate Full Budget (c) from Full Budget value in Fixed Inputs
                if (target.data.full_budget != null) {
                    let val = target.data.full_budget;
                    if (typeof val === 'number') {
                        val = val + '%';
                    } else if (typeof val === 'string' && !val.includes('%')) {
                        val = val + '%';
                    }

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

    // Row 3
    // Row 3
    const mAct = DOM.createInputGroup("MTD Actual", `input-${dept}-mtd-act`, "text"); // Changed to text
    const mFcst = DOM.createInputGroup("MTD Forecast", `input-${dept}-mtd-fcst`, "text"); // Changed to text
    const mVar = DOM.createInputGroup("Var %", `input-${dept}-mtd-var`, "text");
    mVar.input.readOnly = true;
    attachVarianceListener(mAct.input, mFcst.input, mVar.input);

    // Auto-Populate MTD Forecast from Daily Forecast for Mill
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

        const [y, m, d] = dateVal.split('-').map(Number);

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

                // Parse record date
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

    // Attach listeners for MTD Actual
    dAct.input.addEventListener('input', updateMTDActual);
    date.input.addEventListener('change', updateMTDActual);

    // Row 4
    const fullFcst = DOM.createInputGroup("Full Forecast (b)", `input-${dept}-full-fcst`, "text"); // Changed to text
    const fullBudg = DOM.createInputGroup("Full Budget (c)", `input-${dept}-full-budg`, "text"); // Changed to text
    // Note: No Outlook (a) in this form, so comparing Full Forecast vs Budget usually


    // Add to Grid
    add(kpi); add(date); grid.appendChild(document.createElement('div')); // Spacer
    add(dAct); add(dFcst); add(dVar);
    add(mAct); add(mFcst); add(mVar);
    add(fullFcst); add(fullBudg); grid.appendChild(document.createElement('div')); // Spacer for removed Var

    card.appendChild(grid);

    // Save Button
    const btnContainer = document.createElement('div');
    const saveBtn = DOM.createButton("Save Record", async () => {
        const dateVal = date.input.value;
        if (!dateVal) {
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
            return;
        }

        const record = {
            metric_name: metricName,
            date: dateVal,
            department: dept,
            data: {
                daily_actual: dAct.input.value,
                daily_forecast: dFcst.input.value,
                var1: dVar.input.value,
                mtd_actual: mAct.input.value,
                mtd_forecast: mFcst.input.value,
                var2: mVar.input.value,
                full_forecast: fullFcst.input.value,
                full_budget: fullBudg.input.value,
                var3: ''
            }
        };

        try {
            await saveKPIRecord(dept, record);
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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

        } catch (e) {
            console.error(e);
            alert("Failed to save record: " + e.message);
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
            DOM.showAlert("Watch Out!", "Please select a date.", "warning");
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
            DOM.showAlert("Success!", "Record saved successfully!", "success");
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

window.deleteRecord = (id) => {
    DOM.showConfirmModal("Delete Record", "Are you sure you want to delete this record?", async () => {
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
    });
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
        // Ensure we capture the metric name from the record
        const metricName = record.metric_name;
        STATE.currentMetric = metricName;

        // Helper to safe-set value by ID and trigger input event
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                // Handle 0 explicitly if needed, but 'val' handles mixed types
                el.value = (val !== undefined && val !== null) ? val : '';
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };

        // Populate Date
        setVal(`input-${dept}-date`, record.date);

        // Map data keys to potential DOM ID suffixes
        // This mapping covers standard and department-specific fields
        const mapping = {
            'daily_actual': ['daily-act-pct', 'daily-act', 'actual', 'daily-act-tonnes'],
            'daily_act_grade': ['daily-act-gt'],
            'daily_forecast': ['daily-fcst-pct', 'daily-fcst', 'forecast'],
            'mtd_actual': ['mtd-act'],
            'mtd_forecast': ['mtd-fcst'],
            'outlook': ['outlook'],
            'full_forecast': ['full-fcst', 'full-forecast'],
            'full_budget': ['full-budg', 'full-budget'],
            'qty_available': ['qty-avail'],
            'num_rigs': ['rigs'],
            'wet_tonnes': ['wet-tonnes'],
            'grade': ['grade'],
            'grade_7': ['grade-7', 'grade-day-7']
        };

        // Iterate through valid data keys and populate fields
        if (record.data) {
            for (const [key, suffixes] of Object.entries(mapping)) {
                if (record.data[key] !== undefined) {
                    suffixes.forEach(suffix => {
                        setVal(`input-${dept}-${suffix}`, record.data[key]);
                    });
                }
            }
        }

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
                    <td style="padding: 12px;">${formatNum(r.data.full_forecast)}${dept === 'Engineering' ? '%' : ''}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.wet_tonnes)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${r.data.daily_act_grade || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_act_tonnes)}</td>
                    <td style="padding: 12px;">${r.data.daily_actual || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${r.data.daily_var || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${r.data.mtd_var || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
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

        // Handling for Ore Mined
        if (STATE.currentMetric === 'Ore Mined') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | Daily Actual | Daily Forecast | Daily Var % | MTD Actual | MTD Forecast | MTD Var % | Outlook (a) | Full Forecast (b) | Full Budget (c) | Budget Var % | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_act_tonnes)}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var1)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${val(r.data.var2)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${val(r.data.var3)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.day2)}</td>
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
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.daily_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var1 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_actual)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.mtd_forecast)}</td>
                    <td style="padding: 12px;">${r.data.var2 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.outlook)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_forecast)}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.full_budget)}</td>
                    <td style="padding: 12px;">${r.data.var3 || '-'}</td>
                    <td style="padding: 12px;">${DOM.formatNumber(r.data.day2)}</td>
                    <td style="padding: 12px;">
                        <button onclick="editRecord(${r.id})" style="margin-right:8px; padding:2px 6px; cursor:pointer;" title="Edit">✏️</button>
                        <button onclick="deleteRecord(${r.id})" style="padding:2px 6px; cursor:pointer; color:red;" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }

        // Handling for Anx Excavators OR Dump Trucks OR ART Dump Trucks OR Wheel Loaders OR Dozers OR Graders (Identical columns)
        if (STATE.currentMetric === 'Anx Excavators' || STATE.currentMetric === 'Dump Trucks' || STATE.currentMetric === 'ART Dump Trucks' || STATE.currentMetric === 'Wheel Loaders' || STATE.currentMetric === 'Dozers' || STATE.currentMetric === 'Graders' || STATE.currentMetric === 'Drill Rigs') {
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

        // Handling for Crusher (No Qty Available)
        if (STATE.currentMetric === 'Crusher') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act(%) | D.Fcst(%) | Var% | MTD.Act | MTD.Fcst | Var% | F.Fcst | F.Budg | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
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
                tbody.innerHTML = `<tr><td colspan="10" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
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

        // Handling for Mill
        if (STATE.currentMetric === 'Mill') {
            filteredRecords = records.filter(r => r.metric_name === STATE.currentMetric && r.subtype !== 'fixed_input');

            // Date | D.Act(%) | D.Fcst(%) | Var% | MTD.Act | MTD.Fcst | Var% | F.Fcst | F.Budg | Action
            thead.innerHTML = `
                <th style="padding: 12px; text-align: left; min-width: 90px;">Date</th>
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
                tbody.innerHTML = `<tr><td colspan="10" style="padding: 12px; text-align: center;">No records found for ${STATE.currentMetric}</td></tr>`;
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

// -- GM Report Implementation --

function renderGMReport(card) {
    // 1. Controls Container
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.justifyContent = 'space-between';
    controls.style.alignItems = 'center';
    controls.style.marginBottom = '20px';
    controls.style.backgroundColor = '#000'; // Dark background for top bar
    controls.style.color = '#fff';
    controls.style.padding = '10px';
    controls.style.position = 'sticky'; // Allow absolute positioning of title AND stick to top
    controls.style.top = '0';
    controls.style.zIndex = '1000';

    // Date Picker
    const dateDiv = document.createElement('div');
    dateDiv.style.display = 'flex';
    dateDiv.style.flexDirection = 'column';
    dateDiv.style.zIndex = '10'; // Ensure it stays on top if overlap

    const dateLabel = document.createElement('span');
    dateLabel.textContent = "SELECTED DATE:";
    dateLabel.style.fontSize = '12px';
    dateLabel.style.fontWeight = 'bold';
    dateLabel.style.color = '#fbbf24'; // Goldish color

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.style.backgroundColor = '#fff'; // White bg for visibility
    dateInput.style.color = '#000';
    dateInput.style.border = '1px solid #ccc';
    dateInput.style.borderRadius = '4px';
    dateInput.style.padding = '5px';
    dateInput.style.fontSize = '14px';
    dateInput.style.fontWeight = 'bold';
    dateInput.style.outline = 'none';
    dateInput.style.cursor = 'pointer';

    // Default to today
    dateInput.valueAsDate = new Date();

    dateDiv.appendChild(dateLabel);
    dateDiv.appendChild(dateInput);
    controls.appendChild(dateDiv);

    // Title
    const title = document.createElement('h2');
    title.textContent = "Adamus Resources Limited KPI - " + new Date().getFullYear();
    title.style.margin = '0';
    title.style.fontSize = '24px';
    title.style.position = 'absolute';
    title.style.left = '50%';
    title.style.transform = 'translateX(-50%)';
    controls.appendChild(title);

    // PDF Export Link
    // Right Group (PDF + User Info)
    const rightGroup = document.createElement('div');
    rightGroup.style.display = 'flex';
    rightGroup.style.alignItems = 'center';
    rightGroup.style.gap = '20px';
    rightGroup.style.zIndex = '10';

    // PDF Export Link
    const pdfLink = document.createElement('a');
    pdfLink.textContent = "PDF";
    pdfLink.href = "#";
    pdfLink.style.color = '#fbbf24'; // Goldish
    pdfLink.style.textDecoration = 'none';
    pdfLink.style.fontWeight = 'bold';
    pdfLink.style.fontSize = '14px';
    pdfLink.style.border = '1px solid #fbbf24';
    pdfLink.style.padding = '5px 10px';
    pdfLink.style.borderRadius = '4px';
    pdfLink.style.cursor = 'pointer';

    pdfLink.onclick = (e) => {
        e.preventDefault();

        // Hide PDF link during generation
        pdfLink.style.display = 'none';
        // Also hide User Info for PDF? Maybe keeps it clean.
        userDiv.style.display = 'none';

        const opt = {
            margin: 0.2,
            filename: `GM_Report_${dateInput.value}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        // Use html2pdf library (assumed loaded in index.html)
        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(card).save().then(() => {
                pdfLink.style.display = 'block'; // Show again
                userDiv.style.display = 'flex';
            }).catch(err => {
                console.error(err);
                pdfLink.style.display = 'block';
                userDiv.style.display = 'flex';
                alert("Error generating PDF. Please ensure html2pdf is loaded.");
            });
        } else {
            alert("PDF Generation library not loaded.");
            pdfLink.style.display = 'block';
            userDiv.style.display = 'flex';
        }
    };

    // User Info
    const userDisplay = STATE.systemUser || (STATE.currentUser ? STATE.currentUser.username : 'User');
    const parts = userDisplay.trim().split(' ');
    const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : userDisplay.slice(0, 2)).toUpperCase();

    const userDiv = document.createElement('div');
    userDiv.style.display = 'flex';
    userDiv.style.alignItems = 'center';
    userDiv.style.gap = '10px';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = userDisplay;
    nameSpan.style.fontSize = '14px';
    nameSpan.style.fontWeight = 'bold';
    nameSpan.style.color = '#fff';

    const circle = document.createElement('div');
    circle.textContent = initials;
    circle.style.width = '32px';
    circle.style.height = '32px';
    circle.style.backgroundColor = '#fbbf24'; // Gold circle
    circle.style.color = '#000'; // Black text
    circle.style.borderRadius = '50%';
    circle.style.display = 'flex';
    circle.style.alignItems = 'center';
    circle.style.justifyContent = 'center';
    circle.style.fontWeight = 'bold';
    circle.style.fontSize = '12px';

    userDiv.appendChild(nameSpan);
    userDiv.appendChild(circle);

    rightGroup.appendChild(pdfLink);
    rightGroup.appendChild(userDiv);

    controls.appendChild(rightGroup);

    card.appendChild(controls);

    // 2. Report Container (Table)
    const reportTable = document.createElement('table');
    reportTable.style.width = '100%';
    reportTable.style.borderCollapse = 'collapse';
    reportTable.style.fontSize = '11px';

    card.appendChild(reportTable);

    // Load Data Function

    // Load Data Function
    const loadReport = async () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        // Fetch all data in parallel
        // We need data from: OHS, Milling_CIL, Crushing, Mining, Geology, Engineering
        const deptsToFetch = ["OHS", "Milling_CIL", "Crushing", "Mining", "Geology", "Engineering"];

        try {
            // Show loading
            reportTable.innerHTML = '<tr><td colspan="15" style="text-align:center; padding:20px;">Loading Report...</td></tr>';

            // Calculate Date Range for Sparklines (Last 7 days)
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 7);
            const startDate = d.toISOString().split('T')[0];
            const endDate = selectedDate;

            const promises = deptsToFetch.map(d => fetchKPIRecords(d, startDate, endDate));
            const results = await Promise.all(promises);

            // Map results to dept
            const dataStore = {};
            deptsToFetch.forEach((d, i) => {
                dataStore[d] = results[i];
            });

            // Clear table
            reportTable.innerHTML = '';

            // Render Sections
            renderGMSection(reportTable, "OHS", "OHS", dataStore["OHS"], selectedDate);
            renderGMSection(reportTable, "Milling/CIL", "Milling_CIL", dataStore["Milling_CIL"], selectedDate);
            renderGMSection(reportTable, "Crushing", "Crushing", dataStore["Crushing"], selectedDate);
            renderGMSection(reportTable, "Mining", "Mining", dataStore["Mining"], selectedDate);
            renderGMSection(reportTable, "Geology", "Geology", dataStore["Geology"], selectedDate);
            renderGMSection(reportTable, "Engineering", "Engineering", dataStore["Engineering"], selectedDate);

        } catch (e) {
            console.error(e);
            reportTable.innerHTML = `<tr><td colspan="15" style="color:red; text-align:center;">Error loading report: ${e.message}</td></tr>`;
        }
    };

    // Initial Load
    // loadReport(); // Can uncomment to load immediately, or wait for user interaction. 
    // Usually better to load immediately.
    loadReport();

    dateInput.addEventListener('change', loadReport);
}

// Helper to render a section (Department)
function renderGMSection(table, areaLabel, deptKey, records, dateStr) {
    // 1. Header Row
    // The screenshot has a specific header row for EACH section, often with varying columns?
    // Actually, looking closely, the columns are MOSTLY aligned, but "Day-2" and "Qty Available" shift things?
    // Let's create a header row for the section.

    // Header Color: Brown/Orange from screenshot #8B4513
    const headerBg = '#8B4513';
    const headerColor = '#fff';

    // Global CSS th style overrides tr background, so we must apply to th directly
    const thStyle = `padding: 2px; background-color: ${headerBg}; color: ${headerColor}; font-size: 11px;`;

    let headerRowHTML = `
        <tr style="font-weight: bold; text-align: center;">
            <th style="${thStyle} text-align: left; width: 80px;">Area</th>
            <th style="${thStyle} text-align: left;">KPI</th>
            <th style="${thStyle}">Daily Actual</th>
    `;

    // Special Columns Handling
    if (deptKey === "Milling_CIL") {
        headerRowHTML += `<th style="${thStyle}">Day-2</th>`;
    } else if (deptKey === "Engineering") {
        headerRowHTML += `<th style="${thStyle}">Qty Available</th>`;
    } else if (deptKey === "Geology") {
        headerRowHTML += `<th style="${thStyle} width: 60px;">Grade (Day-7)</th>`;
    } else {
        headerRowHTML += `<th style="${thStyle} width: 60px;"></th>`; // Spacer/Extra
    }

    headerRowHTML += `
            <th style="${thStyle}">Daily Forecast</th>
            <th style="${thStyle}">Variance</th>
            <th style="${thStyle} width: 30px;">Status</th>
            <th style="${thStyle}">MTD Actual</th>
            <th style="${thStyle}">MTD Forecast</th>
            <th style="${thStyle}">Variance</th>
            <th style="${thStyle} width: 30px;">Status</th>
            <th style="${thStyle}">Outlook (a)</th>
            <th style="${thStyle}">Forecast (b)</th>
            <th style="${thStyle}">Budget (c)</th>
            <th style="${thStyle}">Variance</th>
            <th style="${thStyle} width: 30px;">Status</th>
            <th style="${thStyle}">Last 7 Days Trend</th>
        </tr>
    `;

    // Add Header
    // Note: If we want one big table, we shouldn't add headers every time if they are identical.
    // But they differ (Area label, extra column). So section headers are good.
    // table.insertAdjacentHTML('beforeend', headerRowHTML); 
    // Actually, create element to be safe
    const thead = document.createElement('tbody'); // Use tbody grouping for sections
    thead.innerHTML = headerRowHTML;
    table.appendChild(thead);

    // 2. Data Rows
    // Get metrics for this dept
    const metrics = DEPT_METRICS[deptKey].filter(m => m !== 'Fixed Inputs');

    metrics.forEach((metric, index) => {
        // Find record for this date
        const record = records.find(r => r.metric_name.trim() === metric.trim() && r.date === dateStr && r.subtype !== 'fixed_input');


        let rowHTML = `<tr style="background-color: #ddd; border-bottom: 1px solid #999;">`;

        // Area Cell (Only for first row of section)
        if (index === 0) {
            rowHTML += `<td rowspan="${metrics.length}" style="background-color: #a0522d; color: white; font-weight: bold; vertical-align: middle; text-align: center; border-bottom: 1px solid #777; padding: 2px;">${areaLabel}</td>`;
        }

        rowHTML += `<td style="padding: 2px; font-weight: 500;">${metric}</td>`;

        // Data Extraction Helper
        const val = (v) => (v != null && v !== '') ? v : '-';
        const num = (v) => (v != null && v !== '' && !isNaN(v)) ? Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }) : val(v);
        // Variance color/icon helper
        const statusIcon = (varianceVal) => {
            // Simple logic: if variance string contains negative (e.g. -10%), RED Frown based on metric polarity?
            // Assuming typical: Positive is Green (Good), Negative is Red (Bad).
            // Exception: Safety/Cost.
            // For now, heuristic: Green if >= 0 or safely string check.
            // If variance is string "-10%", key is the minus.
            // BUT for Safety, 0 is good.
            if (!varianceVal) return '';

            let isNegative = varianceVal.toString().includes('-');
            // Invert for OHS?
            if (deptKey === 'OHS' && (metric.includes('Incident') || metric.includes('Damage'))) {
                isNegative = !isNegative; // If it's negative (reduction), it's good ??
                // Wait, Variance = (Actual - Target) / Target.
                // If Actual (1) > Target (0), Variance is +Infinity/Bad.
                // If Actual (0) < Target (1), Variance is -100%/Good.
                // So for Safety: Negative Variance is GOOD.
            }

            const color = isNegative ? '#ffcccb' : '#90ee90'; // Light red / Light green
            const icon = isNegative ? '☹️' : '🙂';
            // For Safety: Negative is Good (Green), Positive is Bad (Red)
            if (deptKey === 'OHS') {
                return `<div style="background-color: ${isNegative ? '#90ee90' : '#ffcccb'}; text-align: center; border-radius: 4px;">${isNegative ? '🙂' : '☹️'}</div>`;
            }

            return `<div style="background-color: ${isNegative ? '#ffcccb' : '#90ee90'}; text-align: center; border-radius: 4px;">${icon}</div>`;
        };

        const d = record ? record.data : {};

        // Helper to calculate variance if missing
        const calcVar = (act, fcst) => {
            if (act == null || fcst == null || act === '' || fcst === '') return null;
            const a = parseFloat(String(act).replace(/,/g, ''));
            const f = parseFloat(String(fcst).replace(/,/g, ''));
            if (isNaN(a) || isNaN(f)) return null;

            return calculateVariance(a, f, deptKey === 'OHS');
        };

        // Ensure variances exist
        if (!d.var1 && d.daily_actual && d.daily_forecast) d.var1 = calcVar(d.daily_actual, d.daily_forecast);
        if (!d.var2 && d.mtd_actual && d.mtd_forecast) d.var2 = calcVar(d.mtd_actual, d.mtd_forecast);
        if (!d.var3 && d.full_forecast && d.full_budget) d.var3 = calcVar(d.full_forecast, d.full_budget); // Outlook vs Forecast? Or Forecast vs Budget?
        // Note: var3 in form usually is Budget Var. Budget Var usually (Forecast - Budget) or (Outlook - Budget)?
        // In form: Budget Var % (var3) compares Full Forecast (full_forecast) vs Full Budget (full_budget) ??
        // Let's assume standard calc.

        const safeFormat = (v) => DOM.formatNumber(v);
        const cellStyle = 'padding: 2px; text-align: center;';

        // Daily Actual
        rowHTML += `<td style="${cellStyle}">${safeFormat(d.daily_actual)}</td>`;

        // Extra Column (Day-2, Qty Avail, Grade-7, or Spacer)
        if (deptKey === "Milling_CIL") {
            rowHTML += `<td style="${cellStyle}">${safeFormat(d.day2)}</td>`;
        } else if (deptKey === "Engineering") {
            rowHTML += `<td style="${cellStyle}">${safeFormat(d.qty_available)}</td>`;
        } else if (deptKey === "Geology" && metric === "Toll") {
            rowHTML += `<td style="${cellStyle}">${val(d.grade_7)}</td>`;
        } else {
            rowHTML += `<td style="${cellStyle}"></td>`;
        }

        rowHTML += `<td style="${cellStyle}">${safeFormat(d.daily_forecast)}</td>`;
        rowHTML += `<td style="${cellStyle}">${val(d.var1)}</td>`; // Daily Var
        rowHTML += `<td style="padding: 2px;">${statusIcon(d.var1)}</td>`;

        rowHTML += `<td style="${cellStyle}">${safeFormat(d.mtd_actual)}</td>`;
        rowHTML += `<td style="${cellStyle}">${safeFormat(d.mtd_forecast)}</td>`;
        rowHTML += `<td style="${cellStyle}">${val(d.var2)}</td>`; // MTD Var
        rowHTML += `<td style="padding: 2px;">${statusIcon(d.var2)}</td>`;

        rowHTML += `<td style="${cellStyle}">${safeFormat(d.outlook)}</td>`;
        rowHTML += `<td style="${cellStyle}">${safeFormat(d.full_forecast)}</td>`;
        rowHTML += `<td style="${cellStyle}">${safeFormat(d.full_budget)}</td>`;
        rowHTML += `<td style="${cellStyle}">${val(d.var3)}</td>`; // Budget Var

        // Status for Budget Var? Screenshot shows status col after last variance
        rowHTML += `<td style="padding: 2px;">${statusIcon(d.var3)}</td>`;

        // Sparkline Placeholder
        rowHTML += `<td><canvas id="spark-${deptKey}-${index}" width="70" height="20"></canvas></td>`;

        rowHTML += `</tr>`;
        thead.insertAdjacentHTML('beforeend', rowHTML);

        // Render Sparkline (Async/Later)
        // We need past 7 days data.
        setTimeout(() => {
            drawSparkline(`spark-${deptKey}-${index}`, records, metric, dateStr);
        }, 0);
    });
}

function drawSparkline(canvasId, records, metric, curDateStr) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Get last 7 days including current
    const dates = [];
    const current = new Date(curDateStr);
    for (let i = 6; i >= 0; i--) {
        const d = new Date(current);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const values = dates.map(date => {
        const rec = records.find(r => r.date === date && r.metric_name.trim() === metric.trim());
        if (!rec || rec.data == null) return 0; // rec.data check
        let val = rec.data.daily_actual;
        if (typeof val === 'string') val = parseFloat(val.replace('%', '').replace(/,/g, ''));
        return isNaN(val) ? 0 : val;
    });

    // Draw
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb'; // Blue
    ctx.lineWidth = 2;

    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min;

    values.forEach((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2; // Padding
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

async function renderStatusCards(dept, metricName, container) {
    if (metricName === "Fixed Inputs") return;

    // Create Card Container
    const cardRow = document.createElement('div');
    cardRow.style.display = 'flex';
    cardRow.style.gap = '20px';
    cardRow.style.marginBottom = '30px';
    cardRow.style.marginTop = '20px';
    cardRow.style.justifyContent = 'flex-start'; // or center

    // Determine Target Date Logic
    // Interpretation: Always show T-1 (Yesterday's) MTD Data.
    // If T-1 is missing, show latest available in the same month.
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - 1); // Yesterday

    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    // Start of the target month
    const monthStartStr = `${y}-${m}-01`;
    // End date for fetch (Target Date)
    const d = String(targetDate.getDate()).padStart(2, '0');
    const targetDateStr = `${y}-${m}-${d}`;

    // Helper text to show what date is being displayed (optional, good for debugging)
    const dateHelper = document.createElement('div');
    dateHelper.style.fontSize = '11px';
    dateHelper.style.color = '#9ca3af';
    dateHelper.style.marginTop = '5px';
    dateHelper.style.textAlign = 'right';
    dateHelper.style.width = '100%';

    try {
        // Fetch KPI records for the whole range (Month Start -> Yesterday)
        const records = await fetchKPIRecords(dept, monthStartStr, targetDateStr);

        // Filter for specific metric and sort by Date Descending to get latest
        const relevantRecords = records.filter(r => r.metric_name === metricName && r.subtype !== 'fixed_input');

        // Sort descending by date string comparison
        relevantRecords.sort((a, b) => {
            if (a.date > b.date) return -1;
            if (a.date < b.date) return 1;
            return 0;
        });

        const record = relevantRecords[0]; // Latest record

        // Data Extraction
        let mtdAct = 0;
        let mtdFcst = 0;
        let variance = 0;
        let displayDate = targetDateStr;

        if (record && record.data) {
            mtdAct = parseFloat(record.data.mtd_actual) || 0;
            mtdFcst = parseFloat(record.data.mtd_forecast) || 0;
            // Variance = MTD Actual - MTD Forecast
            variance = mtdAct - mtdFcst;
            displayDate = record.date;
            dateHelper.textContent = `Data as of: ${displayDate}`;
        } else {
            dateHelper.textContent = `No data available for ${monthStartStr} to ${targetDateStr}`;
        }

        // Helper to create single card
        const createCard = (title, value, colorClass) => {
            const card = document.createElement('div');
            card.style.flex = '1';
            card.style.maxWidth = '200px';
            card.style.padding = '20px';
            card.style.borderRadius = '8px';
            card.style.textAlign = 'center';
            card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

            if (colorClass === 'yellow') {
                card.style.backgroundColor = '#fffbeb'; // Light Yellow
                card.style.border = '1px solid #fcd34d';
                card.style.color = '#b45309';
            } else if (colorClass === 'green') {
                card.style.backgroundColor = '#ecfdf5'; // Light Green
                card.style.border = '1px solid #6ee7b7';
                card.style.color = '#047857';
            } else if (colorClass === 'red') {
                card.style.backgroundColor = '#fef2f2'; // Light Red
                card.style.border = '1px solid #fca5a5';
                card.style.color = '#b91c1c';
            }

            const h4 = document.createElement('h4');
            h4.textContent = title;
            h4.style.margin = '0 0 10px 0';
            h4.style.fontSize = '12px';
            h4.style.textTransform = 'uppercase';
            h4.style.letterSpacing = '0.5px';

            const valDiv = document.createElement('div');
            // Format number
            valDiv.textContent = value.toLocaleString(undefined, { maximumFractionDigits: 0 });
            valDiv.style.fontSize = '24px';
            valDiv.style.fontWeight = 'bold';

            card.appendChild(h4);
            card.appendChild(valDiv);
            return card;
        };

        const card1 = createCard("MTD ACTUAL", mtdAct, 'yellow');
        const card2 = createCard("MTD FORECAST", mtdFcst, 'green');
        const card3 = createCard("VARIANCE", variance, 'red');

        cardRow.appendChild(card1);
        cardRow.appendChild(card2);
        cardRow.appendChild(card3);

        // Insert after title (firstChild is h3 title)
        if (container.firstChild) {
            container.insertBefore(cardRow, container.childNodes[1]);
        } else {
            container.appendChild(cardRow);
        }

    } catch (e) {
        console.error("Error fetching status card data", e);
    }
}
