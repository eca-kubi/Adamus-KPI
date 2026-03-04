// dom.js
// Helpers for creating UI elements dynamically

const DOM = {
    createInputGroup: (labelText, id, type = 'text', placeholder = '') => {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.style.marginBottom = '10px';

        const label = document.createElement('label');
        label.className = 'small';
        label.textContent = labelText;
        label.style.display = 'block';
        label.style.marginBottom = '4px';
        label.style.fontSize = '12px';
        label.style.color = '#6b7280';

        const input = document.createElement('input');
        input.id = id;
        input.type = type;
        // Only show placeholder for KPI and Date if not provided, otherwise keep clean
        if (labelText === 'KPI' || labelText === 'Date') {
            input.placeholder = placeholder || labelText;
        } else {
            input.placeholder = placeholder || '';
        }
        input.className = 'form-input';

        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.border = '1px solid #d1d5db';
        input.style.borderRadius = '6px';
        input.style.boxSizing = 'border-box';

        label.appendChild(input);
        div.appendChild(label);
        return { container: div, input: input };
    },

    createButton: (text, onClick, variant = 'primary') => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'btn';
        if (variant === 'ghost') {
            btn.style.backgroundColor = 'transparent';
            btn.style.color = 'var(--text-primary)';
            btn.style.border = '1px solid #d1d5db';
        }
        btn.addEventListener('click', onClick);
        return btn;
    },

    clear: (elementId) => {
        const el = document.getElementById(elementId);
        if (el) el.innerHTML = '';
    },

    showToast: (message, type = 'success') => {
        let toast = document.getElementById('toast-msg');
        if (toast) toast.remove();

        toast = document.createElement('div');
        toast.id = 'toast-msg';
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.color = '#fff';
        toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
        toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        toast.style.zIndex = '1000';

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    formatNumber: (val) => {
        if (val === undefined || val === null || val === '') return '-';
        if (typeof val === 'string' && val.includes('%')) return val;
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    },

    showConfirmModal: (title, message, onConfirm) => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s ease';

        const modal = document.createElement('div');
        modal.style.backgroundColor = '#fff';
        modal.style.borderRadius = '16px';
        modal.style.padding = '32px';
        modal.style.width = '90%';
        modal.style.maxWidth = '400px';
        modal.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
        modal.style.transform = 'scale(0.95)';
        modal.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        modal.style.textAlign = 'center';

        const iconContainer = document.createElement('div');
        iconContainer.style.width = '64px';
        iconContainer.style.height = '64px';
        iconContainer.style.backgroundColor = '#fee2e2';
        iconContainer.style.borderRadius = '50%';
        iconContainer.style.display = 'flex';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';
        iconContainer.style.margin = '0 auto 20px auto';
        iconContainer.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="font-size: 28px; color: #dc2626;"></i>';
        modal.appendChild(iconContainer);

        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.margin = '0 0 12px 0';
        titleEl.style.color = '#111827';
        titleEl.style.fontSize = '22px';
        titleEl.style.fontWeight = '700';
        modal.appendChild(titleEl);

        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        messageEl.style.margin = '0 0 30px 0';
        messageEl.style.color = '#6b7280';
        messageEl.style.fontSize = '15px';
        messageEl.style.lineHeight = '1.6';
        modal.appendChild(messageEl);

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '12px';
        btnContainer.style.justifyContent = 'center';

        const cancelBtn = DOM.createButton('Cancel', () => closeModal(), 'ghost');
        cancelBtn.style.flex = '1';
        cancelBtn.style.fontWeight = '600';
        cancelBtn.style.padding = '10px 0';

        const confirmBtn = DOM.createButton('Proceed', () => {
            closeModal();
            onConfirm();
        });
        confirmBtn.style.flex = '1';
        confirmBtn.style.backgroundColor = '#dc2626';
        confirmBtn.style.color = 'white';
        confirmBtn.style.border = 'none';
        confirmBtn.style.fontWeight = '600';
        confirmBtn.style.padding = '10px 0';

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });

        const closeModal = () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (overlay.parentNode) document.body.removeChild(overlay);
            }, 200);
        };
    }
};
