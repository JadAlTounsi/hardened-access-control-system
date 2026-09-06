const SEV = {
    granted:  { stripe: 'border-l-4 border-granted',  dot: 'bg-granted'  },
    warning:  { stripe: 'border-l-4 border-warning',  dot: 'bg-warning'  },
    critical: { stripe: 'border-l-4 border-critical', dot: 'bg-critical' },
    neutral:  { stripe: 'border-l-4 border-dim',  dot: 'bg-dim' },
};

const ROW_BASE = 'event-row';
const TD_BASE = 'event-cell';
const VISIBLE_LOCKOUTS = 4;

const tbody = document.getElementById('event-rows');
const lockoutCountEl = document.getElementById('lockout-count');
const lockoutListEl = document.getElementById('lockout-list');
const backdrop = document.getElementById('modal-backdrop');
const titleEl = document.getElementById('modal-title');
const bodyEl = document.getElementById('modal-body');

// splits an "expires" timestamp into a readable "expires on x at y" string
function expiresText(expires) {
    const [date, time] = expires.split(' ');
    return `Expires on ${date} at ${time}`;
}

// builds one label/value row used inside the lockout detail modal
function detailRow(label, value) {
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-[3px]';

    const labelEl = document.createElement('div');
    labelEl.className = 'detail-label text-dim font-medium';
    labelEl.textContent = label;

    const valueEl = document.createElement('div');
    valueEl.className = 'text-sm';
    valueEl.textContent = value;

    wrap.append(labelEl, valueEl);
    return wrap;
}

// fills and opens the modal with the given title and content
function showModal(title, bodyContent) {
    titleEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-critical"></span> ${title}`;

    bodyEl.innerHTML = '';
    const nodes = Array.isArray(bodyContent) ? bodyContent : [bodyContent];
    nodes.forEach(node => bodyEl.appendChild(node));

    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');
}

// hides the modal
function closeModal() {
    backdrop.classList.add('hidden');
    backdrop.classList.remove('flex');
}

// opens the modal showing details for a single lockout event
function openLockoutDetail(ev) {
    const capture = document.createElement('div');
    capture.className = 'flex-none w-[180px] h-[180px] rounded-lg  border border-dashed border-dim flex flex-col items-center justify-center gap-2 text-dim';
    capture.innerHTML = `${svgCamera()}`;

    const details = document.createElement('div');
    details.className = 'flex-1 min-w-0 flex flex-col gap-3.5';
    details.append(
        detailRow('Timestamp', ev.t),
        detailRow('User', ev.user || 'Unregistered card'),
        detailRow('Failed attempts', `${ev.lockout.attempts} of 3`),
        detailRow('Lockout expires', ev.lockout.expires),
    );

    showModal('Lockout Triggered', [capture, details]);
}

// opens the modal listing every active lockout
function openLockoutsList(lockouts) {
    const container = document.createElement('div');
    container.className = 'flex-1 min-w-0 flex flex-col';

    lockouts.forEach(l => {
        const row = document.createElement('div');
        row.className = 'divider-row';

        const info = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'text-sm font-medium';
        name.textContent = l.name;
        const attempts = document.createElement('div');
        attempts.className = 'mt-0.5 text-xs text-dim';
        attempts.textContent = `${l.attempts} of 3 failed attempts`;
        info.append(name, attempts);

        const expires = document.createElement('div');
        expires.className = 'flex-shrink-0 text-[13px] text-muted text-right';
        expires.append(expiresText(l.expires));

        row.append(info, expires);
        container.appendChild(row);
    });

    showModal('Active Lockouts', container);
}

// returns the camera icon svg markup
function svgCamera() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-camera"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg>';
}

// renders every event as a row in the events table
function renderEventTable(events) {
    events.forEach((ev) => {
        const sev = SEV[ev.sev];
        const isLockout = ev.e === 'Lockout Triggered';

        const tr = document.createElement('tr');
        tr.className = ROW_BASE;
        tr.innerHTML = `
            <td class="${TD_BASE} ${sev.stripe} text-text whitespace-nowrap"></td>
            <td class="${TD_BASE}"><span class="flex items-center gap-1.5 text-[13.5px]"><span class="w-1.5 h-1.5 rounded-full flex-shrink-0 ${sev.dot}"></span><span class="event-label"></span></span></td>
            <td class="${TD_BASE}"><span class="user-cell"></span></td>
            <td class="${TD_BASE}">${isLockout ? '<div class="flex justify-start capture-cell"></div>' : ''}</td>
        `;


        tr.children[0].textContent = ev.t;
        tr.querySelector('.event-label').textContent = ev.e;

        const userCell = tr.querySelector('.user-cell');
        if (ev.user) {
            userCell.classList.add('text-text');
            userCell.textContent = ev.user;
        } else {
            userCell.classList.add('text-dim', 'italic');
            userCell.textContent = 'unregistered';
        }

        if (isLockout) {
            const captureCell = tr.querySelector('.capture-cell');
            captureCell.innerHTML = svgCamera();
            const icon = captureCell.querySelector('svg');
            icon.classList.add('w-5', 'h-5', 'text-critical', 'cursor-pointer');
            icon.addEventListener('click', () => openLockoutDetail(ev));
        }

        tbody.appendChild(tr);
    });
    renderEventsToday(events);
    renderLockoutSummary(events);
}

// counts today's granted, denied, and lockout events and updates the stat card
function renderEventsToday(events) {
    let granted = 0;
    let denied = 0;
    let lockouts = 0;
    
    events.forEach((ev) => {
        const eventDate = new Date(ev.t);
        const now = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const isWithinLastDay = now - eventDate <= oneDayMs;

        if (!isWithinLastDay) return;

        if (ev.e === 'Access Granted') granted++;
        else if (ev.e === 'Access Denied') denied++;
        else if (ev.e === 'Lockout Triggered') lockouts++;
    });

    document.getElementById('granted-today').textContent = granted;
    document.getElementById('denied-today').textContent = denied;
    document.getElementById('lockout-today').textContent = lockouts;
}

// renders the active lockouts count and summary list on the stat card
function renderLockoutSummary(events) {
    const lockouts = events
        .filter(ev => ev.e === 'Lockout Triggered')
        .map(ev => ({ name: ev.user, attempts: ev.lockout.attempts, expires: ev.lockout.expires }));

    lockoutCountEl.textContent = lockouts.length;

    lockouts.slice(0, VISIBLE_LOCKOUTS).forEach((l) => {
        const row = document.createElement('div');
        row.className = 'flex flex-col gap-0.5 min-w-32';

        const nameEl = document.createElement('span');
        nameEl.className = 'text-[13px] font-medium text-text overflow-hidden text-ellipsis whitespace-nowrap';
        nameEl.textContent = l.name;

        const expiresEl = document.createElement('span');
        expiresEl.className = 'text-xs text-muted';
        expiresEl.textContent = expiresText(l.expires);

        row.append(nameEl, expiresEl);
        lockoutListEl.appendChild(row);
    });

    const remaining = lockouts.length - VISIBLE_LOCKOUTS;
    if (remaining > 0) {
        const viewMore = document.createElement('button');
        viewMore.className = 'basis-full text-left bg-transparent border-0 p-0 font-sans text-xs font-semibold text-accent cursor-pointer hover:underline';
        viewMore.textContent = `View ${remaining} more`;
        viewMore.addEventListener('click', () => openLockoutsList(lockouts));
        lockoutListEl.appendChild(viewMore);
    }
}


fetch('/api/access-logs')
    .then(res => res.json())
    .then(renderEventTable);


document.getElementById('modal-close').addEventListener('click', closeModal);
backdrop.addEventListener('click', (e) => { 
    if (e.target === backdrop) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// closes every open dropdown menu
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-container').forEach(container => {
        container.querySelector('.dropdown-menu').classList.add('hidden');
        container.querySelector('.chevron').style.transform = 'rotate(0deg)';
    });
}

// initialize all dropdowns on the page
document.querySelectorAll('.dropdown-container').forEach(container => {
    const btn = container.querySelector('.dropdown-btn');
    const menu = container.querySelector('.dropdown-menu');
    const chevron = container.querySelector('.chevron');
    const label = container.querySelector('.selected-label');

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !menu.classList.contains('hidden');
        
        closeAllDropdowns(); 

        if (!isOpen) {
            menu.classList.remove('hidden');
            chevron.style.transform = 'rotate(180deg)';
        }
    });

    menu.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', () => {
            label.textContent = option.textContent;
            closeAllDropdowns();
        });
    });
});

// global click to close everything when clicking outside
document.addEventListener('click', closeAllDropdowns);