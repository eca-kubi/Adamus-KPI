// dom.js
// Helpers for creating UI elements dynamically with Bootstrap 5 classes

const DOM = {
    /**
     * Create a Bootstrap-styled input group with label
     */
    createInputGroup: (labelText, id, type = 'text', placeholder = '', required = false) => {
        const div = document.createElement('div');
        div.className = 'mb-3 text-start';

        if (labelText === 'KPI') {
            div.style.display = 'none';
            div.classList.add('kpi-hidden-field');
        }

        if (type === 'date') {
            div.classList.add('kpi-date-field');
        }

        const label = document.createElement('label');
        label.className = 'form-label fw-medium';
        label.setAttribute('for', id);
        label.textContent = labelText;

        const input = document.createElement('input');
        input.id = id;
        input.type = type;
        // Only set placeholder if explicitly provided, don't duplicate label
        if (placeholder) {
            input.placeholder = placeholder;
        }
        input.className = 'form-control form-control-lg';
        input.autocomplete = type === 'password' ? 'current-password' : 'off';
        if (required) {
            input.required = true;
        }

        div.appendChild(label);
        div.appendChild(input);
        return { container: div, input: input };
    },

    /**
     * Create a Bootstrap-styled select dropdown
     */
    createSelect: (labelText, id, options = [], defaultText = 'Select...') => {
        const div = document.createElement('div');
        div.className = 'mb-3 text-start';

        const label = document.createElement('label');
        label.className = 'form-label fw-medium';
        label.setAttribute('for', id);
        label.textContent = labelText;

        const select = document.createElement('select');
        select.id = id;
        select.className = 'form-select form-select-lg';

        // Default option
        const defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = defaultText;
        select.appendChild(defOpt);

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = typeof opt === 'object' ? opt.value : opt;
            option.textContent = typeof opt === 'object' ? opt.label : opt.replace('_', ' ');
            select.appendChild(option);
        });

        div.appendChild(label);
        div.appendChild(select);
        return { container: div, select: select };
    },

    /**
     * Create a Bootstrap-styled group of checkboxes for multi-selection
     */
    createCheckboxGroup: (labelText, id, options = []) => {
        const div = document.createElement('div');
        div.className = 'mb-3 text-start';

        const label = document.createElement('label');
        label.className = 'form-label fw-bold d-block mb-2 text-dark';
        label.textContent = labelText;
        div.appendChild(label);

        const groupContainer = document.createElement('div');
        groupContainer.className = 'd-flex flex-wrap gap-3 p-3 bg-light rounded border';
        groupContainer.id = id;

        const checkboxes = [];

        options.forEach(opt => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lab = typeof opt === 'object' ? opt.label : opt.replace(/_/g, ' ');

            const checkWrapper = document.createElement('div');
            checkWrapper.className = 'form-check';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input';
            input.id = `${id}-${val}`;
            input.value = val;

            const checkLabel = document.createElement('label');
            checkLabel.className = 'form-check-label';
            checkLabel.setAttribute('for', `${id}-${val}`);
            checkLabel.textContent = lab;

            checkWrapper.appendChild(input);
            checkWrapper.appendChild(checkLabel);
            groupContainer.appendChild(checkWrapper);
            checkboxes.push(input);
        });

        div.appendChild(groupContainer);

        // "All" checkbox: when checked, enable all other checkboxes; when
        // unchecked, disable all others.  Also, if every non-"All" checkbox is
        // manually selected, auto-check "All"; if any is deselected, auto-uncheck "All".
        const allCheckbox = checkboxes.find(c => c.value === 'All');
        const otherCheckboxes = checkboxes.filter(c => c.value !== 'All');

        if (allCheckbox) {
            allCheckbox.addEventListener('change', () => {
                const checked = allCheckbox.checked;
                otherCheckboxes.forEach(c => { c.checked = checked; });
            });
        }

        otherCheckboxes.forEach(c => {
            c.addEventListener('change', () => {
                if (!allCheckbox) return;
                allCheckbox.checked = otherCheckboxes.every(oc => oc.checked);
            });
        });

        // Helper to get selected values
        const getValues = () => checkboxes.filter(c => c.checked).map(c => c.value);
        // Helper to set selected values
        const setValues = (vals) => {
            if (!Array.isArray(vals)) vals = [vals];
            const hasAll = vals.includes('All');
            checkboxes.forEach(c => {
                if (hasAll) {
                    // When "All" is present, check every box (including "All")
                    c.checked = true;
                } else {
                    c.checked = vals.includes(c.value);
                }
            });
            // If every non-"All" checkbox is checked, also check "All"
            if (!hasAll && allCheckbox && otherCheckboxes.every(oc => oc.checked)) {
                allCheckbox.checked = true;
            }
        };

        return { container: div, checkboxes, getValues, setValues };
    },

    /**
     * Create a Bootstrap-styled button
     * @param {string} text - Button text
     * @param {function} onClick - Click handler
     * @param {string} variant - 'primary', 'secondary', 'outline-primary', 'danger', 'link'
     * @param {string} icon - Bootstrap icon class (optional)
     */
    createButton: (text, onClick, variant = 'primary', icon = null) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-${variant}`;

        if (icon) {
            const iconEl = document.createElement('i');
            iconEl.className = `bi ${icon} me-2`;
            btn.appendChild(iconEl);
            btn.appendChild(document.createTextNode(text));
        } else {
            btn.textContent = text;
        }

        btn.addEventListener('click', onClick);
        return btn;
    },

    /**
     * Clear the contents of an element
     */
    clear: (elementId) => {
        const el = document.getElementById(elementId);
        if (el) el.innerHTML = '';
    },

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', 'warning', 'info'
     */
    showToast: (message, type = 'success') => {
        // Remove existing toast if any
        let existingToast = document.getElementById('toast-msg');
        if (existingToast) existingToast.remove();

        const toastContainer = document.getElementById('toast-container') || document.body;

        // Map type to icon
        const icons = {
            success: 'bi-check-circle-fill',
            error: 'bi-exclamation-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };
        const iconClass = icons[type] || icons.info;

        // Ensure type is valid class suffix, default to info if unknown
        const toastClass = `toast-${['success', 'error', 'warning', 'info'].includes(type) ? type : 'info'}`;

        // Create toast element
        const toast = document.createElement('div');
        toast.id = 'toast-msg';
        toast.className = `toast show align-items-center border-0 ${toastClass}`;
        toast.setAttribute('role', 'alert');
        toast.style.minWidth = '280px';

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi ${iconClass}"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('fade');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    },

    /**
     * Create a card container
     * @param {string} title - Card title (optional)
     * @param {string} extraClasses - Additional CSS classes
     */
    createCard: (title = '', extraClasses = '') => {
        const card = document.createElement('div');
        card.className = `card ${extraClasses}`.trim();

        if (title) {
            const header = document.createElement('div');
            header.className = 'card-header';
            header.innerHTML = `<h5 class="card-title mb-0">${title}</h5>`;
            card.appendChild(header);
        }

        const body = document.createElement('div');
        body.className = 'card-body';
        card.appendChild(body);

        return { card, body };
    },

    /**
     * Create a Bootstrap table
     * @param {Array} headers - Array of header texts
     * @param {string} id - Table ID
     */
    createTable: (headers, id = '') => {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';

        const table = document.createElement('table');
        table.className = 'table table-striped table-hover mb-0';
        if (id) table.id = id;

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        const tbody = document.createElement('tbody');

        table.appendChild(thead);
        table.appendChild(tbody);
        wrapper.appendChild(table);

        return { wrapper, table, thead, tbody };
    },

    /**
     * Show a loading spinner in an element
     */
    showLoading: (elementId) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `
                <div class="d-flex justify-content-center align-items-center py-5">
                    <div class="spinner-border spinner-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Create badge element
     * @param {string} text - Badge text
     * @param {string} variant - 'primary', 'success', 'danger', 'warning', 'info', 'secondary'
     */
    createBadge: (text, variant = 'primary') => {
        const badge = document.createElement('span');
        badge.className = `badge bg-${variant}`;
        badge.textContent = text;
        return badge;
    }
};
