// ==========================================================================
// ANTIGRAVITY CRM - APPLICATION LOGIC (CZECH LANGUAGE)
// ==========================================================================

window.onerror = function(message, source, lineno, colno, error) {
    const msg = "CRITICAL ERROR: " + message + "\nLine: " + lineno + ":" + colno + "\nSource: " + source;
    console.error(msg, error);
    return false;
};

function showDebugMsg(text) {
    console.log("[DEBUG] " + text.replace(/<br>/g, "\n"));
}

// Global state variables
let state = {
    users: [],
    events: [],
    clients: [],
    workers: [],
    audit_logs: [],
    permissions: {},
    currentUser: null,
    currentTheme: 'light',
    currentCalendarDate: new Date(),
    map: null,
    mapMarkers: []
};

// Access Level Code definitions (KOD-PRISTUP)
// We map each KOD-PRISTUP code to permitted tabs.
const DEFAULT_PERMISSIONS = {
    "ADMIN": { name: "Administrátor", dashboard: true, uzivatele: true, klienti: true, pracovnici: true, kalendar: true, opravneni: true, audit: true, smazani: true, dochazka: true },
    "OBCHODNIK": { name: "Obchodní zástupce", dashboard: true, uzivatele: false, klienti: true, pracovnici: true, kalendar: true, opravneni: false, audit: false, smazani: false, dochazka: true },
    "ASISTENT": { name: "Asistent/ka", dashboard: true, uzivatele: false, klienti: true, pracovnici: true, kalendar: true, opravneni: false, audit: false, smazani: false, dochazka: true },
    "HOST": { name: "Host (Čtenář)", dashboard: true, uzivatele: false, klienti: true, pracovnici: false, kalendar: true, opravneni: false, audit: false, smazani: false, dochazka: true }
};

// Initial/Mock Data in Czech language for immediate demonstration
const INITIAL_USERS = [
    { id: "1", por_cislo: 1, jmeno: "Daniel Havlíček", zkratka: "DHA", nastup_datum: "2020-01-15", vystup_datum: "", datum_nar: "1988-05-20", kod_pristup: "ADMIN", heslo: "admin123", dny_dovolena: 25, hod_nv: 12 },
    { id: "2", por_cislo: 2, jmeno: "Jana Malá", zkratka: "JMA", nastup_datum: "2022-09-01", vystup_datum: "", datum_nar: "1995-11-02", kod_pristup: "OBCHODNIK", heslo: "obchod123", dny_dovolena: 20, hod_nv: 4 },
    { id: "3", por_cislo: 3, jmeno: "Petr Svoboda", zkratka: "PSV", nastup_datum: "2024-03-01", vystup_datum: "", datum_nar: "1999-02-14", kod_pristup: "ASISTENT", heslo: "asistent123", dny_dovolena: 25, hod_nv: 0 },
    { id: "4", por_cislo: 4, jmeno: "Host Hostovský", zkratka: "HST", nastup_datum: "2025-06-01", vystup_datum: "2026-12-31", datum_nar: "1990-08-30", kod_pristup: "HOST", heslo: "host123", dny_dovolena: 10, hod_nv: 0 }
];

const INITIAL_CLIENTS = [
    { id: "c1", nazev: "Kovovýroba Plzeň s.r.o.", ulice: "Průmyslová 120", psc: "301 00", mesto: "Plzeň", okres: "Plzeň-město", stat: "Česká republika", velikost: "Střední (10-49 zaměstnanců)", typ_vyroby: "Strojírenství a zámečnictví", souradnice: "49.7384, 13.3736", spv1: true, spv2: false, spv3: true },
    { id: "c2", nazev: "BioPotraviny Brno a.s.", ulice: "Křenová 45", psc: "602 00", mesto: "Brno", okres: "Brno-město", stat: "Česká republika", velikost: "Velká (50+ zaměstnanců)", typ_vyroby: "Potravinářství", souradnice: "49.1915, 16.6212", spv1: false, spv2: true, spv3: false },
    { id: "c3", nazev: "Dřevostavby Liberec", ulice: "Ještědská 88", psc: "460 08", mesto: "Liberec", okres: "Liberec", stat: "Česká republika", velikost: "Malá (1-9 zaměstnanců)", typ_vyroby: "Zpracování dřeva", souradnice: "50.7512, 15.0298", spv1: true, spv2: true, spv3: false },
    { id: "c4", nazev: "Pražská technologická s.r.o.", ulice: "Václavské náměstí 1", psc: "110 00", mesto: "Praha", okres: "Praha 1", stat: "Česká republika", velikost: "Střední (10-49 zaměstnanců)", typ_vyroby: "IT a vývoj", souradnice: "50.0833, 14.4253", spv1: false, spv2: false, spv3: true }
];

const INITIAL_WORKERS = [
    { id: "w1", jmeno: "Ing. Antonín Dvořák", klient_id: "c1", funkce: "Technický ředitel", mobil: "+420 603 456 789", email: "dvorak@kovoplzen.cz", enews: true },
    { id: "w2", jmeno: "Marie Nováková", klient_id: "c1", funkce: "Vedoucí nákupu", mobil: "+420 777 111 222", email: "novakova@kovoplzen.cz", enews: false },
    { id: "w3", jmeno: "Tomáš Král", klient_id: "c2", funkce: "Manažer kvality", mobil: "+420 605 987 654", email: "kral@biobrno.cz", enews: true },
    { id: "w4", jmeno: "Jiří Horák", klient_id: "c3", funkce: "Majitel", mobil: "+420 724 555 666", email: "horak@drevostavbyliberec.cz", enews: true },
    { id: "w5", jmeno: "Alena Černá", klient_id: "c4", funkce: "Projektový manažer", mobil: "+420 739 888 999", email: "cerna@pragetech.cz", enews: false }
];

// Seed initial events using relative dates so they display in current month/year
const INITIAL_EVENTS = [];
const today = new Date();
const pad = num => String(num).padStart(2, '0');
const formatDateStr = (date, hours, mins) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hours)}:${pad(mins)}`;

// Set 4 initial events around today's date
const event1Date = new Date(today);
event1Date.setDate(today.getDate() - 1);
INITIAL_EVENTS.push({
    id: "e1",
    por_cislo: 1,
    typ: "schůzka",
    datum_zal: formatDateStr(new Date(), 10, 0),
    datum_plan: formatDateStr(event1Date, 10, 0),
    datum_kon: formatDateStr(event1Date, 12, 0),
    nazev: "Technická konzultace o výkovcích",
    poznámka: "Proběhlo na provozovně v Plzni. Zákazník požaduje nacenění nových forem.",
    uzivatel_id: "2", // Jana Malá
    uzivatel: "Jana Malá",
    link_client_id: "c1", // Kovovýroba Plzeň
    link_worker_id: "w1", // Antonín Dvořák
    origin: "klient" // Tracing info
});

const event2Date = new Date(today); // Today
INITIAL_EVENTS.push({
    id: "e2",
    por_cislo: 2,
    typ: "schůzka",
    datum_zal: formatDateStr(new Date(), 9, 30),
    datum_plan: formatDateStr(event2Date, 14, 0),
    datum_kon: formatDateStr(event2Date, 15, 0),
    nazev: "Schůzka ohledně dřevostaveb",
    poznámka: "Probrat možnosti dodávky materiálu na třetí kvartál.",
    uzivatel_id: "1", // Daniel Havlíček
    uzivatel: "Daniel Havlíček",
    link_client_id: "c3", // Dřevostavby Liberec
    link_worker_id: "w4", // Jiří Horák
    origin: "pracovnik" // Tracing info
});

const event3Date = new Date(today);
event3Date.setDate(today.getDate() + 1); // Tomorrow
INITIAL_EVENTS.push({
    id: "e3",
    por_cislo: 3,
    typ: "úkol",
    datum_zal: formatDateStr(new Date(), 14, 0),
    datum_plan: formatDateStr(event3Date, 9, 0),
    datum_kon: "", // Not completed yet
    nazev: "Odeslat cenovou nabídku",
    poznámka: "Cenová nabídka pro IT vývoj portálu.",
    uzivatel_id: "2", // Jana Malá
    uzivatel: "Jana Malá",
    link_client_id: "c4", // Pražská tech.
    link_worker_id: "",
    origin: "klient"
});

const event4Date = new Date(today);
event4Date.setDate(today.getDate() + 2); // In 2 days
INITIAL_EVENTS.push({
    id: "e4",
    por_cislo: 4,
    typ: "úkol",
    datum_zal: formatDateStr(new Date(), 8, 0),
    datum_plan: formatDateStr(event4Date, 10, 0),
    datum_kon: "", // Not completed yet
    nazev: "Interní porada a plánování",
    poznámka: "Pravidelný interní sync celého týmu nad projekty.",
    uzivatel_id: "1", // Daniel Havlíček
    uzivatel: "Daniel Havlíček",
    link_client_id: "",
    link_worker_id: "",
    origin: "direct" // General event
});


// ==========================================================================
// 1. DATA MANAGEMENT & INITIALIZATION
// ==========================================================================

function initData() {
    // Check if data is already in LocalStorage, if not load mock data
    if (!localStorage.getItem('crm_users')) {
        localStorage.setItem('crm_users', JSON.stringify(INITIAL_USERS));
        localStorage.setItem('crm_clients', JSON.stringify(INITIAL_CLIENTS));
        localStorage.setItem('crm_workers', JSON.stringify(INITIAL_WORKERS));
        localStorage.setItem('crm_events', JSON.stringify(INITIAL_EVENTS));
        localStorage.setItem('crm_permissions', JSON.stringify(DEFAULT_PERMISSIONS));
        localStorage.setItem('crm_audit_logs', JSON.stringify([]));
        localStorage.setItem('crm_attendance', JSON.stringify([]));
    }

    // Load data from LocalStorage to application state
    state.users = JSON.parse(localStorage.getItem('crm_users'));
    state.clients = JSON.parse(localStorage.getItem('crm_clients'));
    state.workers = JSON.parse(localStorage.getItem('crm_workers'));
    state.events = JSON.parse(localStorage.getItem('crm_events'));
    
    // Migration: If permissions are missing dochazka property or need to be defaulted, re-write them
    let savedPerms = null;
    try {
        savedPerms = JSON.parse(localStorage.getItem('crm_permissions'));
    } catch(e) {}
    
    if (!savedPerms || !savedPerms.ADMIN || typeof savedPerms.ADMIN.dochazka === 'undefined') {
        localStorage.setItem('crm_permissions', JSON.stringify(DEFAULT_PERMISSIONS));
        state.permissions = DEFAULT_PERMISSIONS;
    } else {
        state.permissions = savedPerms;
    }

    state.audit_logs = JSON.parse(localStorage.getItem('crm_audit_logs')) || [];
    state.attendance = JSON.parse(localStorage.getItem('crm_attendance')) || [];
    state.currentTheme = localStorage.getItem('crm_theme') || 'light';
    
    // Set active user (Default to Daniel Havlíček DHA)
    const savedUserId = localStorage.getItem('crm_active_user_id');
    state.currentUser = state.users.find(u => u.id === savedUserId) || state.users[0];
    
    // Setup visual theme
    document.documentElement.setAttribute('data-theme', state.currentTheme);
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Helper to generate next POR-CISLO or integer ID
function getNextPorCislo(array) {
    if (array.length === 0) return 1;
    const max = Math.max(...array.map(item => item.por_cislo || 0));
    return max + 1;
}

function getNextId(prefix, array) {
    let nextNum = 1;
    if (array.length > 0) {
        const ids = array.map(item => parseInt(item.id.replace(prefix, ''))).filter(n => !isNaN(n));
        if (ids.length > 0) {
            nextNum = Math.max(...ids) + 1;
        }
    }
    return prefix + nextNum;
}


// ==========================================================================
// 2. DOMContentLoaded & APPLICATION SETUP
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initData();
    setupThemeToggle();
    setupNavigation();
    populateUserSimulator();
    setupPermissionsTable();
    setupFormsAndModals();
    
    // Initial UI render
    renderActiveUserBadge();
    checkSectionAccess('dashboard'); // Verify access for current default section
    renderDashboard();
    
    // Map needs to load after dashboard view is visible, so initialize it next
    setTimeout(initLeafletMap, 150);

    // Auto-refresh interval (every 30 seconds)
    setInterval(() => {
        console.log('[CRM] Automatická aktualizace dat na pozadí...');
        
        // 1. Reload data from storage
        state.users = JSON.parse(localStorage.getItem('crm_users')) || state.users;
        state.clients = JSON.parse(localStorage.getItem('crm_clients')) || state.clients;
        state.workers = JSON.parse(localStorage.getItem('crm_workers')) || state.workers;
        state.events = JSON.parse(localStorage.getItem('crm_events')) || state.events;
        state.attendance = JSON.parse(localStorage.getItem('crm_attendance')) || state.attendance;
        
        // 2. Refresh active views without closing opened modals
        // Only refresh map markers if map exists
        if (state.map) {
            // Save open popup state if any
            const openPopup = state.map._popup;
            const wasOpen = openPopup && openPopup.isOpen();
            
            renderMapMarkers();
            
            // If popup was open, keep it open if possible
            if (wasOpen && openPopup._source) {
                const markerLatLng = openPopup._source.getLatLng();
                // Find matching marker and re-open it
                const match = state.mapMarkers.find(m => m.getLatLng().equals(markerLatLng));
                if (match) match.openPopup();
            }
        }
        
        // Refresh dashboard statistics and events list
        renderDashboard();
        
        // Refresh tables if currently active
        const activeTab = document.querySelector('.nav-item.active')?.getAttribute('data-tab');
        if (activeTab === 'uzivatele') renderUsersTable();
        if (activeTab === 'klienti') renderClientsTable();
        if (activeTab === 'pracovnici') renderWorkersTable();
        if (activeTab === 'kalendar') renderCalendar();
        if (activeTab === 'dochazka') renderAttendance();
    }, 30000); // 30000 ms = 30 seconds
});


// ==========================================================================
// 3. THEME & NAVIGATION CONTROLLER
// ==========================================================================

function setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
        state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.currentTheme);
        localStorage.setItem('crm_theme', state.currentTheme);
    });
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Handle back/forward/initial hash if present
    if (window.location.hash) {
        const tab = window.location.hash.substring(1);
        if (['dashboard', 'uzivatele', 'klienti', 'pracovnici', 'kalendar', 'opravneni', 'audit', 'dochazka'].includes(tab)) {
            switchTab(tab);
        } else {
            switchTab('dashboard');
        }
    } else {
        switchTab('dashboard');
    }
}

function switchTab(tabName) {
    // 1. Enforce access control permissions check
    const isAllowed = checkSectionAccess(tabName);
    if (!isAllowed) {
        // Show Access Denied view instead
        showAccessDeniedView(tabName);
        return;
    }

    // Hide all views
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
    
    // Show target view
    const targetView = document.getElementById(`${tabName}-view`);
    if (targetView) targetView.classList.remove('hidden');

    // Update active nav menu item
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update page header title
    const titles = {
        'dashboard': 'Nástěnka',
        'uzivatele': 'Správa Uživatelů',
        'klienti': 'Databáze Klientů',
        'pracovnici': 'Pracovníci & Kontaktní osoby',
        'kalendar': 'Kalendář Plánovaných Událostí',
        'opravneni': 'Přístupová Práva a Oprávnění',
        'audit': 'Historie Změn (Audit Log)',
        'dochazka': 'Evidence Docházky'
    };
    document.getElementById('current-section-title').textContent = titles[tabName] || 'CRM';
    
    // Update hash
    window.location.hash = tabName;

    // Trigger tab-specific renders
    if (tabName === 'dashboard') {
        renderDashboard();
        if (state.map) {
            // Force Leaflet map to redraw correctly after the CSS 300ms transition finishes
            setTimeout(() => {
                state.map.invalidateSize();
            }, 350);
        }
    } else if (tabName === 'uzivatele') {
        renderUsersTable();
    } else if (tabName === 'klienti') {
        renderClientsTable();
    } else if (tabName === 'pracovnici') {
        renderWorkersTable();
    } else if (tabName === 'kalendar') {
        populateCalendarFilters();
        renderCalendar();
    } else if (tabName === 'audit') {
        renderAuditLogsTable();
    } else if (tabName === 'dochazka') {
        // Enforce setting filters to current month & year when switching to Docházka
        const monthSelect = document.getElementById('filter-attendance-month');
        const yearSelect = document.getElementById('filter-attendance-year');
        const today = new Date();
        if (monthSelect) monthSelect.value = String(today.getMonth() + 1);
        if (yearSelect) yearSelect.value = String(today.getFullYear());

        initAttendanceFilters();
        renderAttendance();
    }
}


// ==========================================================================
// 4. SIMULATOR & ACCESS CONTROL (KOD-PRISTUP) LOGIC
// ==========================================================================

function populateUserSimulator() {
    const selector = document.getElementById('simulation-user');
    selector.innerHTML = '';
    
    state.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.jmeno} (${user.zkratka} - ${user.kod_pristup})`;
        if (user.id === state.currentUser.id) {
            option.selected = true;
        }
        selector.appendChild(option);
    });

    selector.addEventListener('change', (e) => {
        const userId = e.target.value;
        const selectedUser = state.users.find(u => u.id === userId);
        if (selectedUser) {
            state.currentUser = selectedUser;
            localStorage.setItem('crm_active_user_id', userId);
            
            // Re-eval and reload active session
            renderActiveUserBadge();
            
            // Redirect to dashboard or refresh permissions on current tab
            const currentTab = window.location.hash.substring(1) || 'dashboard';
            switchTab(currentTab);
        }
    });
}

function renderActiveUserBadge() {
    const initialsEl = document.getElementById('active-user-initials');
    const nameEl = document.getElementById('active-user-name');
    const roleEl = document.getElementById('active-user-role');

    if (state.currentUser) {
        initialsEl.textContent = state.currentUser.zkratka;
        nameEl.textContent = state.currentUser.jmeno;
        
        const roleConfig = state.permissions[state.currentUser.kod_pristup];
        roleEl.textContent = roleConfig ? roleConfig.name : state.currentUser.kod_pristup;
    }
    
    // Refresh all sidebar items visibility immediately
    updateSidebarNavigationAccess();
}

function updateSidebarNavigationAccess() {
    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const rolePermissions = state.permissions[userRole];
    if (!rolePermissions) return;

    // Check visibility for all available tabs
    const tabs = ['dashboard', 'uzivatele', 'klienti', 'pracovnici', 'kalendar', 'opravneni', 'audit', 'dochazka'];
    tabs.forEach(tab => {
        const allowed = rolePermissions[tab] || false;
        const navEl = document.getElementById(`nav-${tab}`);
        if (navEl) {
            navEl.style.display = allowed ? 'flex' : 'none';
        }
    });
}

function checkSectionAccess(tabName) {
    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const rolePermissions = state.permissions[userRole];
    
    // If permission not set, default to false (secure by default)
    const allowed = rolePermissions ? rolePermissions[tabName] : false;
    
    const navId = `nav-${tabName}`;
    const navEl = document.getElementById(navId);
    if (navEl) {
        if (allowed) {
            navEl.style.display = 'flex';
        } else {
            navEl.style.display = 'none';
        }
    }

    return allowed;
}

function showAccessDeniedView(tabName) {
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
    
    const deniedView = document.getElementById('access-denied-view');
    deniedView.classList.remove('hidden');
    
    document.getElementById('denied-code').textContent = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    document.getElementById('current-section-title').textContent = 'Přístup odepřen';
}

function setupPermissionsTable() {
    const tableBody = document.querySelector('#table-permissions tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    Object.keys(state.permissions).forEach(code => {
        const perm = state.permissions[code];
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><strong>${code}</strong></td>
            <td>${perm.name}</td>
            <td class="text-center">${renderPermissionCheckbox(code, 'dashboard', perm.dashboard)}</td>
            <td class="text-center">${renderPermissionCheckbox(code, 'uzivatele', perm.uzivatele)}</td>
            <td class="text-center">${renderPermissionCheckbox(code, 'klienti', perm.klienti)}</td>
            <td class="text-center">${renderPermissionCheckbox(code, 'pracovnici', perm.pracovnici)}</td>
            <td class="text-center">${renderPermissionCheckbox(code, 'kalendar', perm.kalendar)}</td>
            <td class="text-center">${renderPermissionCheckbox(code, 'opravneni', perm.opravneni)}</td>
            <td class="text-center">${renderPermissionCheckbox(code, 'audit', perm.audit)}</td>
            <td class="text-center">${renderPermissionCheckbox(code, 'smazani', perm.smazani)}</td>
            <td class="text-center">${renderPermissionCheckbox(code, 'dochazka', perm.dochazka)}</td>
        `;
        tableBody.appendChild(tr);
    });

    // Handle live modifications of permissions
    tableBody.querySelectorAll('.perm-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const role = e.target.getAttribute('data-role');
            const section = e.target.getAttribute('data-section');
            const value = e.target.checked;
            
            state.permissions[role][section] = value;
            saveData('crm_permissions', state.permissions);
            
            // Refresh permissions checks for logged-in simulated user
            checkSectionAccess(window.location.hash.substring(1) || 'dashboard');
            
            // Re-render current view to hide/show delete buttons
            const activeTab = window.location.hash.substring(1) || 'dashboard';
            if (activeTab === 'uzivatele') renderUsersTable();
            if (activeTab === 'klienti') renderClientsTable();
            if (activeTab === 'pracovnici') renderWorkersTable();
        });
    });
}

function renderPermissionCheckbox(role, section, val) {
    // Disable editing rights for HOST so we don't break simulation controls easily, and ADMIN must always access 'opravneni', 'audit', and 'smazani' to prevent lockouts
    const isDisabled = (role === 'ADMIN' && (section === 'opravneni' || section === 'audit' || section === 'smazani'));
    return `
        <input type="checkbox" class="perm-checkbox" data-role="${role}" data-section="${section}" 
               ${val ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
    `;
}


// ==========================================================================
// 5. DASHBOARD & INTERACTIVE MAP (LEAFLET)
// ==========================================================================

function renderDashboard() {
    // 1. Stats Counter
    document.getElementById('stat-clients').textContent = state.clients.length;
    document.getElementById('stat-workers').textContent = state.workers.length;
    document.getElementById('stat-events').textContent = state.events.filter(e => !e.datum_kon).length;
    document.getElementById('stat-users').textContent = state.users.length;

    // 2. Upcoming Events List
    const upcomingContainer = document.getElementById('dashboard-events');
    upcomingContainer.innerHTML = '';
    
    // Sort events by date ascending
    const sortedEvents = [...state.events].sort((a, b) => new Date(a.datum_plan) - new Date(b.datum_plan));
    
    // Filter events of today and tomorrow
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const limitDate = new Date(todayStart);
    limitDate.setDate(todayStart.getDate() + 2); // 48h limit
    
    const filteredEvents = sortedEvents.filter(e => {
        const planDate = new Date(e.datum_plan);
        return planDate >= todayStart && planDate <= limitDate;
    });

    if (filteredEvents.length === 0) {
        upcomingContainer.innerHTML = '<div class="empty-state">Žádné události v nejbližších 48 hodinách.</div>';
    } else {
        filteredEvents.forEach(e => {
            const div = document.createElement('div');
            div.className = `event-item-card ${e.typ === 'úkol' ? 'task-type' : ''}`;
            
            // Format dates for display
            const plan = new Date(e.datum_plan);
            const dateStr = `${plan.getDate()}.${plan.getMonth() + 1}. v ${pad(plan.getHours())}:${pad(plan.getMinutes())}`;
            
            // Find linked objects to display tracing source
            let traceText = '';
            if (e.link_client_id) {
                const client = state.clients.find(c => c.id === e.link_client_id);
                if (client) {
                    traceText += `<span class="event-tag client-origin" style="color: white;">Klient: ${client.nazev}</span>`;
                }
            }
            if (e.link_worker_id) {
                const worker = state.workers.find(w => w.id === e.link_worker_id);
                if (worker) {
                    traceText += `<span class="event-tag worker-origin" style="color: white; margin-left: 5px;">Pracovník: ${worker.jmeno}</span>`;
                }
            }
            if (!traceText) {
                traceText = `<span class="event-tag direct-origin" style="color: white;">Obecná</span>`;
            }

            div.innerHTML = `
                <div class="event-item-header">
                    <span class="event-item-title">${e.nazev}</span>
                    <span class="event-item-time">${dateStr}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.3;">
                    ${e.poznámka ? e.poznámka.substring(0, 100) + (e.poznámka.length > 100 ? '...' : '') : 'Bez popisu.'}
                </div>
                <div class="event-item-meta">
                    <span>Odpovědný: <strong>${e.uzivatel}</strong></span>
                    <div style="margin-left: auto;">${traceText}</div>
                </div>
            `;
            
            // Click to open event detail/edit
            div.addEventListener('click', () => openEventModal(e.id));
            upcomingContainer.appendChild(div);
        });
    }
}

function initLeafletMap() {
    const mapDiv = document.getElementById('map');
    if (state.map) return; // Prevent double init
    
    try {
        if (typeof window.L === 'undefined') {
            console.error("Leaflet library (window.L) is not loaded!");
            return;
        }

        if (!mapDiv) {
            console.error("#map element not found in DOM!");
            return;
        }

        state.map = L.map('map').setView([49.0, 18.5], 6);
        
        // OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors'
        }).addTo(state.map);
        
        // Place client markers
        renderMapMarkers();
        
        // Delay size calculation to ensure layout dimensions are fully calculated by browser
        setTimeout(() => {
            if (state.map) {
                state.map.invalidateSize();
            }
        }, 400);

        // Bind resize event
        window.addEventListener('resize', () => {
            if (state.map) {
                state.map.invalidateSize();
            }
        });
    } catch (err) {
        console.error("Leaflet map initialization failed: ", err);
        showDebugMsg("Leaflet MAP INIT EXCEPTION: " + err.message + "\nStack: " + err.stack);
    }
}

function renderMapMarkers() {
    if (!state.map) return;
    
    // Clear existing markers
    state.mapMarkers.forEach(m => state.map.removeLayer(m));
    state.mapMarkers = [];
    
    state.clients.forEach(client => {
        if (!client.souradnice) return;
        
        const coords = client.souradnice.split(',').map(c => parseFloat(c.trim()));
        if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return;

        // Find workers for this client
        const clientWorkers = state.workers.filter(w => w.klient_id === client.id);
        let workersHTML = '';
        if (clientWorkers.length > 0) {
            workersHTML = `
                <div class="map-popup-workers">
                    <strong>Kontakty:</strong>
                    ${clientWorkers.map(w => `<div class="map-popup-worker-item"><span>${w.jmeno}</span> <span>${w.mobil}</span></div>`).join('')}
                </div>
            `;
        }

        // Find incomplete tasks and meetings for this client
        const clientEvents = state.events.filter(e => e.link_client_id === client.id);
        const incompleteTasks = clientEvents.filter(e => e.typ === 'úkol' && !e.datum_kon);
        const incompleteMeetings = clientEvents.filter(e => e.typ === 'schůzka' && !e.datum_kon);
        
        let eventsHTML = '';
        let hasIncompleteTask = incompleteTasks.length > 0;
        let hasIncompleteMeeting = incompleteMeetings.length > 0;
        
        if (hasIncompleteTask || hasIncompleteMeeting) {
            eventsHTML += `<div class="map-popup-workers" style="border-top: 1px dashed var(--border-color); margin-top: 6px; padding-top: 6px;">`;
            
            if (hasIncompleteTask) {
                eventsHTML += `
                    <strong style="color: var(--danger); display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                        ⚠️ Nesplněné úkoly (${incompleteTasks.length}):
                    </strong>
                    ${incompleteTasks.map(t => `
                        <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;" title="${t.nazev}">${t.nazev}</span>
                            <button class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 0.75rem;" onclick="appDirectViewEvent('${t.id}')">Zobrazit úkol</button>
                        </div>
                    `).join('')}
                `;
            }
            
            if (hasIncompleteMeeting) {
                // If we also had tasks, add small spacing
                const topMargin = hasIncompleteTask ? 'margin-top: 8px;' : '';
                eventsHTML += `
                    <strong style="color: #f97316; display: flex; align-items: center; gap: 4px; ${topMargin} margin-bottom: 2px;">
                        📅 Nedokončené schůzky (${incompleteMeetings.length}):
                    </strong>
                    ${incompleteMeetings.map(m => `
                        <div style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;" title="${m.nazev}">${m.nazev}</span>
                            <button class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 0.75rem;" onclick="appDirectViewEvent('${m.id}')">Zobrazit schůzku</button>
                        </div>
                    `).join('')}
                `;
            }
            
            eventsHTML += `</div>`;
        }

        // Popup content
        const popupContent = `
            <div class="map-popup">
                <div class="map-popup-title">${client.nazev}</div>
                <div class="map-popup-text">${client.ulice}, ${client.mesto}</div>
                <div class="map-popup-text">Výroba: ${client.typ_vyroby}</div>
                ${workersHTML}
                ${eventsHTML}
                <div style="margin-top: 10px; display: flex; gap: 6px;">
                    <button class="btn btn-primary btn-sm" onclick="appDirectLinkEvent('${client.id}', 'client')">+ Nová schůzka</button>
                    <button class="btn btn-secondary btn-sm" onclick="appDirectViewClient('${client.id}')">Zobrazit detail</button>
                </div>
            </div>
        `;

        // Custom SVG pin icon – Red if has active tasks, Orange if has active meetings, otherwise Indigo/Purple gradient
        const initials = client.nazev.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        const uid = 'g' + client.id;
        
        let stopColorStart = '#4F46E5';
        let stopColorEnd = '#7C3AED';
        let shadowColor = 'rgba(79,70,229,0.5)';
        
        if (hasIncompleteTask) {
            stopColorStart = '#EF4444'; // Red
            stopColorEnd = '#B91C1C';
            shadowColor = 'rgba(239,68,68,0.6)';
        } else if (hasIncompleteMeeting) {
            stopColorStart = '#F97316'; // Orange
            stopColorEnd = '#C2410C';
            shadowColor = 'rgba(249,115,22,0.6)';
        }

        const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
                <defs>
                    <linearGradient id="${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${stopColorStart}"/>
                        <stop offset="100%" style="stop-color:${stopColorEnd}"/>
                    </linearGradient>
                </defs>
                <path d="M18 0 C8.059 0 0 8.059 0 18 C0 31.5 18 48 18 48 C18 48 36 31.5 36 18 C36 8.059 27.941 0 18 0Z" fill="url(#${uid})" stroke="white" stroke-width="1.5" style="filter: drop-shadow(0px 2px 4px ${shadowColor});"/>
                <text x="18" y="22" font-size="11" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif">${initials}</text>
            </svg>`,
            iconSize: [36, 48],
            iconAnchor: [18, 48],
            popupAnchor: [0, -48]
        });

        const marker = L.marker([coords[0], coords[1]], { icon: customIcon }).addTo(state.map);
        marker.bindPopup(popupContent);
        marker.bindTooltip(`<strong>${client.nazev}</strong>`, {
            permanent: false,
            direction: 'top',
            offset: [0, -38]
        });
        
        state.mapMarkers.push(marker);
    });

    // Fixed view covering Czech Republic + Slovakia
    state.map.setView([49.0, 18.5], 6);
}

// Global functions exposed to window so that Leaflet popup buttons can execute them
window.appDirectLinkEvent = function(entityId, type) {
    if (type === 'client') {
        openEventModal(null, { clientId: entityId });
    } else if (type === 'worker') {
        openEventModal(null, { workerId: entityId });
    }
};

window.appDirectViewClient = function(clientId) {
    switchTab('klienti');
    openClientModal(clientId);
};

window.appDirectViewEvent = function(eventId) {
    // Closes map popup, keeps user on dashboard, opens event modal
    if (state.map) {
        state.map.closePopup();
    }
    openEventModal(eventId);
};

window.showClientOnMap = function(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client || !client.souradnice) {
        alert("Klient nemá vyplněné platné souřadnice!");
        return;
    }
    
    const coords = client.souradnice.split(',').map(c => parseFloat(c.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
        alert("Neplatné souřadnice klienta!");
        return;
    }
    
    // Switch to Dashboard
    switchTab('dashboard');
    
    // Center map and open popup
    if (state.map) {
        setTimeout(() => {
            state.map.invalidateSize();
            state.map.setView([coords[0], coords[1]], 14);
            
            // Search marker matching coords
            const marker = state.mapMarkers.find(m => {
                const latLng = m.getLatLng();
                return Math.abs(latLng.lat - coords[0]) < 0.001 && Math.abs(latLng.lng - coords[1]) < 0.001;
            });
            
            if (marker) {
                marker.openPopup();
            }
        }, 400); // Give 400ms for switchTab animation to finish
    }
};


// ==========================================================================
// 6. UŽIVATELÉ CRUD (USERS)
// ==========================================================================

function renderUsersTable() {
    const tbody = document.querySelector('#table-users tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    const searchVal = document.getElementById('search-users').value.toLowerCase();
    const filtered = state.users.filter(u => 
        u.jmeno.toLowerCase().includes(searchVal) || 
        u.zkratka.toLowerCase().includes(searchVal) ||
        u.kod_pristup.toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted">Žádní uživatelé neodpovídají vyhledávání.</td></tr>`;
        return;
    }

    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const hasDeletePermission = state.permissions[userRole] ? state.permissions[userRole].smazani : false;

    filtered.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${u.por_cislo}</strong></td>
            <td><strong>${u.jmeno}</strong></td>
            <td><span class="event-tag">${u.zkratka}</span></td>
            <td>${u.nastup_datum ? new Date(u.nastup_datum).toLocaleDateString('cs-CZ') : '--'}</td>
            <td>${u.vystup_datum ? new Date(u.vystup_datum).toLocaleDateString('cs-CZ') : '<span class="text-muted">Aktivní</span>'}</td>
            <td>${u.datum_nar ? new Date(u.datum_nar).toLocaleDateString('cs-CZ') : '--'}</td>
            <td><span class="badge-role">${u.kod_pristup}</span></td>
            <td><code>••••••</code></td>
            <td class="text-center">${u.dny_dovolena} d</td>
            <td class="text-center">${u.hod_nv} h</td>
            <td class="text-right">
                <button class="btn btn-secondary btn-sm btn-edit-user" data-id="${u.id}">Upravit</button>
                ${hasDeletePermission ? `<button class="btn btn-danger btn-sm btn-delete-user" data-id="${u.id}">Smazat</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Wire up row buttons
    tbody.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', () => openUserModal(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(btn.getAttribute('data-id')));
    });
}

function openUserModal(userId = null) {
    const modal = document.getElementById('modal-user');
    const form = document.getElementById('form-user');
    const title = document.getElementById('modal-user-title');
    
    // Populate role selectors
    const roleSelect = document.getElementById('user-kod-pristup');
    roleSelect.innerHTML = '';
    Object.keys(state.permissions).forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${code} (${state.permissions[code].name})`;
        roleSelect.appendChild(option);
    });

    form.reset();

    // Render audit trail info
    renderAuditTrail('user-audit-info', userId ? state.users.find(u => u.id === userId) : null);

    if (userId) {
        title.textContent = 'Upravit Uživatele';
        const user = state.users.find(u => u.id === userId);
        if (user) {
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-jmeno').value = user.jmeno;
            document.getElementById('user-zkratka').value = user.zkratka;
            document.getElementById('user-kod-pristup').value = user.kod_pristup;
            document.getElementById('user-nastup-datum').value = user.nastup_datum;
            document.getElementById('user-vystup-datum').value = user.vystup_datum;
            document.getElementById('user-datum-nar').value = user.datum_nar;
            document.getElementById('user-heslo').value = user.heslo;
            document.getElementById('user-dovolenana').value = user.dny_dovolena;
            document.getElementById('user-hod-nv').value = user.hod_nv;
        }
    } else {
        title.textContent = 'Nový Uživatel';
        document.getElementById('user-id').value = '';
    }

    showModal(modal);
}

// Universal helper to display created/updated metadata inside modal footers for ADMIN / Authorized roles
function renderAuditTrail(elementId, entity) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Check if current simulated user has access to permissions
    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const rolePermissions = state.permissions[userRole];
    const hasPermissionView = rolePermissions ? rolePermissions['opravneni'] : false;

    if (!hasPermissionView || !entity) {
        el.style.display = 'none';
        el.innerHTML = '';
        return;
    }

    const createdBy = entity.created_by || 'SYSTEM';
    const createdAt = entity.created_at ? new Date(entity.created_at).toLocaleString('cs-CZ') : 'Neznámé';
    const updatedBy = entity.updated_by || createdBy;
    const updatedAt = entity.updated_at ? new Date(entity.updated_at).toLocaleString('cs-CZ') : createdAt;
    const changeDetails = entity.last_change_details || 'Počáteční import dat';

    el.style.display = 'block';
    el.innerHTML = `
        <div style="border-top: 1px solid var(--border-glass); padding-top: 8px; margin-top: 8px; line-height: 1.4;">
            <div>ℹ️ <strong>Vytvořil:</strong> ${createdBy} (${createdAt})</div>
            <div>ℹ️ <strong>Naposledy změnil:</strong> ${updatedBy} (${updatedAt})</div>
            <div style="margin-top: 4px; font-style: italic; font-size: 0.78rem; color: var(--text-secondary);">
                📝 <strong>Poslední změna:</strong> ${changeDetails}
            </div>
        </div>
    `;
}

function saveUser(e) {
    e.preventDefault();
    const id = document.getElementById('user-id').value;
    const jmeno = document.getElementById('user-jmeno').value;
    const zkratka = document.getElementById('user-zkratka').value.toUpperCase();
    const kod_pristup = document.getElementById('user-kod-pristup').value;
    const nastup_datum = document.getElementById('user-nastup-datum').value;
    const vystup_datum = document.getElementById('user-vystup-datum').value;
    const datum_nar = document.getElementById('user-datum-nar').value;
    const heslo = document.getElementById('user-heslo').value;
    const dny_dovolena = parseInt(document.getElementById('user-dovolenana').value);
    const hod_nv = parseInt(document.getElementById('user-hod-nv').value);

    const activeUser = state.currentUser ? state.currentUser.zkratka : 'SYSTEM';
    const nowStr = formatDateToISO(new Date());

    if (id) {
        // Edit mode
        const index = state.users.findIndex(u => u.id === id);
        if (index !== -1) {
            const old = state.users[index];
            const changes = [];
            if (old.jmeno !== jmeno) changes.push(`Jméno (${old.jmeno} -> ${jmeno})`);
            if (old.zkratka !== zkratka) changes.push(`Zkratka (${old.zkratka} -> ${zkratka})`);
            if (old.kod_pristup !== kod_pristup) changes.push(`Přístup (${old.kod_pristup} -> ${kod_pristup})`);
            if (old.heslo !== heslo) changes.push(`Heslo (změněno)`);
            if (old.dny_dovolena !== dny_dovolena) changes.push(`Dovolená (${old.dny_dovolena} -> ${dny_dovolena} d)`);
            if (old.hod_nv !== hod_nv) changes.push(`NV (${old.hod_nv} -> ${hod_nv} h)`);

            const changeText = changes.length > 0 ? `Změna: ${changes.join(', ')}` : 'Beze změny hodnot';

            state.users[index] = { 
                ...state.users[index], 
                jmeno, zkratka, kod_pristup, nastup_datum, vystup_datum, datum_nar, heslo, dny_dovolena, hod_nv,
                updated_by: activeUser,
                updated_at: nowStr,
                last_change_details: changeText
            };
            logAuditEvent('ÚPRAVA', 'Uživatelé', jmeno, changeText);
        }
    } else {
        // Add mode
        const por_cislo = getNextPorCislo(state.users);
        const newId = String(por_cislo);
        state.users.push({
            id: newId, por_cislo, jmeno, zkratka, kod_pristup, nastup_datum, vystup_datum, datum_nar, heslo, dny_dovolena, hod_nv,
            created_by: activeUser,
            created_at: nowStr,
            updated_by: activeUser,
            updated_at: nowStr,
            last_change_details: 'Vytvoření nového uživatele'
        });
        logAuditEvent('VYTVOŘENÍ', 'Uživatelé', jmeno, 'Vytvoření nového uživatelského účtu v CRM');
    }

    saveData('crm_users', state.users);
    closeAllModals();
    renderUsersTable();
    populateUserSimulator();
}

function deleteUser(userId) {
    if (state.currentUser.id === userId) {
        alert("Nemůžete smazat sami sebe (aktuálně simulovaného uživatele)!");
        return;
    }
    const targetUser = state.users.find(u => u.id === userId);
    const targetName = targetUser ? targetUser.jmeno : 'Neznámý';
    
    if (confirm("Opravdu chcete smazat tohoto uživatele? Tato akce je nevratná.")) {
        state.users = state.users.filter(u => u.id !== userId);
        saveData('crm_users', state.users);
        logAuditEvent('SMAZÁNÍ', 'Uživatelé', targetName, `Smazání uživatelského účtu (Zkratka: ${targetUser ? targetUser.zkratka : '?'})`);
        renderUsersTable();
        populateUserSimulator();
    }
}


// ==========================================================================
// 7. KLIENTI CRUD (CLIENTS)
// ==========================================================================

function renderClientsTable() {
    const tbody = document.querySelector('#table-clients tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const searchVal = document.getElementById('search-clients').value.toLowerCase();
    const filtered = state.clients.filter(c => 
        c.nazev.toLowerCase().includes(searchVal) || 
        c.mesto.toLowerCase().includes(searchVal) ||
        c.okres.toLowerCase().includes(searchVal) ||
        c.typ_vyroby.toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">Žádní klienti neodpovídají vyhledávání.</td></tr>`;
        return;
    }

    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const hasDeletePermission = state.permissions[userRole] ? state.permissions[userRole].smazani : false;

    filtered.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.nazev}</strong></td>
            <td>${c.ulice}, ${c.psc} ${c.mesto}</td>
            <td>${c.okres} / ${c.stat}</td>
            <td><span class="event-tag">${c.velikost}</span></td>
            <td>${c.typ_vyroby}</td>
            <td><code>${c.souradnice}</code></td>
            <td class="text-center">${renderDisplayCheckbox(c.spv1)}</td>
            <td class="text-center">${renderDisplayCheckbox(c.spv2)}</td>
            <td class="text-center">${renderDisplayCheckbox(c.spv3)}</td>
            <td class="text-right">
                <button class="btn btn-primary btn-sm btn-map-client" data-id="${c.id}">🗺️ Mapa</button>
                <button class="btn btn-secondary btn-sm btn-edit-client" data-id="${c.id}">Upravit</button>
                ${hasDeletePermission ? `<button class="btn btn-danger btn-sm btn-delete-client" data-id="${c.id}">Smazat</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-map-client').forEach(btn => {
        btn.addEventListener('click', () => {
            showClientOnMap(btn.getAttribute('data-id'));
        });
    });

    tbody.querySelectorAll('.btn-edit-client').forEach(btn => {
        btn.addEventListener('click', () => openClientModal(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-delete-client').forEach(btn => {
        btn.addEventListener('click', () => deleteClient(btn.getAttribute('data-id')));
    });
}

function renderDisplayCheckbox(val) {
    return `<span class="checkbox-display ${val ? 'checked' : 'unchecked'}"></span>`;
}

function openClientModal(clientId = null) {
    const modal = document.getElementById('modal-client');
    const form = document.getElementById('form-client');
    const title = document.getElementById('modal-client-title');
    const linkedInfo = document.getElementById('client-linked-events-info');

    form.reset();
    linkedInfo.innerHTML = '';

    // Render audit trail info
    renderAuditTrail('client-audit-info', clientId ? state.clients.find(c => c.id === clientId) : null);

    if (clientId) {
        title.textContent = 'Detail / Upravit Klienta';
        const client = state.clients.find(c => c.id === clientId);
        if (client) {
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-nazev').value = client.nazev;
            document.getElementById('client-ulice').value = client.ulice;
            document.getElementById('client-psc').value = client.psc;
            document.getElementById('client-mesto').value = client.mesto;
            document.getElementById('client-okres').value = client.okres;
            document.getElementById('client-stat').value = client.stat;
            document.getElementById('client-velikost').value = client.velikost;
            document.getElementById('client-typ-vyroby').value = client.typ_vyroby;
            document.getElementById('client-souradnice').value = client.souradnice;
            document.getElementById('client-spv1').checked = client.spv1;
            document.getElementById('client-spv2').checked = client.spv2;
            document.getElementById('client-spv3').checked = client.spv3;

            // Link event tracking check
            const linkedEvents = state.events.filter(e => e.link_client_id === clientId);
            if (linkedEvents.length > 0) {
                linkedInfo.innerHTML = `Propojené události: <strong>${linkedEvents.length}x</strong>. <a href="#kalendar" onclick="closeAllModals(); switchTab('kalendar');" style="color: var(--primary); font-weight:600;">Zobrazit v kalendáři</a>`;
            } else {
                linkedInfo.innerHTML = `Žádné propojené události. <a href="#" onclick="event.preventDefault(); closeAllModals(); openEventModal(null, {clientId: '${clientId}'});" style="color: var(--primary); font-weight:600;">Vytvořit událost</a>`;
            }

            // Populate linked workers list
            const linkedWorkers = state.workers.filter(w => w.klient_id === clientId);
            const workersContainer = document.getElementById('client-linked-workers-list');
            if (linkedWorkers.length > 0) {
                workersContainer.innerHTML = linkedWorkers.map(w => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-glass);">
                        <div>
                            <strong>${w.jmeno}</strong> <span class="text-muted" style="font-size:0.8rem; margin-left: 8px;">(${w.funkce})</span>
                        </div>
                        <div style="font-size: 0.85rem;">
                            📞 ${w.mobil} | ✉️ <a href="mailto:${w.email}" style="color: var(--primary);">${w.email}</a>
                        </div>
                    </div>
                `).join('');
            } else {
                workersContainer.innerHTML = `<span class="text-muted" style="font-size:0.85rem; font-style:italic;">K tomuto klientovi nejsou přiřazeni žádní pracovníci.</span>`;
            }
        }
    } else {
        title.textContent = 'Nový Klient';
        document.getElementById('client-id').value = '';
        document.getElementById('client-linked-workers-list').innerHTML = `<span class="text-muted" style="font-size:0.85rem; font-style:italic;">U nového klienta nelze zobrazit pracovníky před uložením.</span>`;
    }

    showModal(modal);
}

function saveClient(e) {
    e.preventDefault();
    const id = document.getElementById('client-id').value;
    const nazev = document.getElementById('client-nazev').value;
    const ulice = document.getElementById('client-ulice').value;
    const psc = document.getElementById('client-psc').value;
    const mesto = document.getElementById('client-mesto').value;
    const okres = document.getElementById('client-okres').value;
    const stat = document.getElementById('client-stat').value;
    const velikost = document.getElementById('client-velikost').value;
    const typ_vyroby = document.getElementById('client-typ-vyroby').value;
    const souradnice = document.getElementById('client-souradnice').value;
    const spv1 = document.getElementById('client-spv1').checked;
    const spv2 = document.getElementById('client-spv2').checked;
    const spv3 = document.getElementById('client-spv3').checked;

    const activeUser = state.currentUser ? state.currentUser.zkratka : 'SYSTEM';
    const nowStr = formatDateToISO(new Date());

    if (id) {
        const index = state.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            const old = state.clients[index];
            const changes = [];
            if (old.nazev !== nazev) changes.push(`Název (${old.nazev} -> ${nazev})`);
            if (old.ulice !== ulice || old.mesto !== mesto) changes.push(`Adresa (${old.ulice}, ${old.mesto} -> ${ulice}, ${mesto})`);
            if (old.velikost !== velikost) changes.push(`Velikost (${old.velikost} -> ${velikost})`);
            if (old.typ_vyroby !== typ_vyroby) changes.push(`Výroba (${old.typ_vyroby} -> ${typ_vyroby})`);
            if (old.souradnice !== souradnice) changes.push(`GPS (změna)`);
            if (old.spv1 !== spv1) changes.push(`SPV1 (${old.spv1} -> ${spv1})`);
            if (old.spv2 !== spv2) changes.push(`SPV2 (${old.spv2} -> ${spv2})`);
            if (old.spv3 !== spv3) changes.push(`SPV3 (${old.spv3} -> ${spv3})`);

            const changeText = changes.length > 0 ? `Změna: ${changes.join(', ')}` : 'Beze změny hodnot';

            state.clients[index] = { 
                ...state.clients[index], 
                nazev, ulice, psc, mesto, okres, stat, velikost, typ_vyroby, souradnice, spv1, spv2, spv3,
                updated_by: activeUser,
                updated_at: nowStr,
                last_change_details: changeText
            };
            logAuditEvent('ÚPRAVA', 'Klienti', nazev, changeText);
        }
    } else {
        const newId = getNextId('c', state.clients);
        state.clients.push({
            id: newId, nazev, ulice, psc, mesto, okres, stat, velikost, typ_vyroby, souradnice, spv1, spv2, spv3,
            created_by: activeUser,
            created_at: nowStr,
            updated_by: activeUser,
            updated_at: nowStr,
            last_change_details: 'Vytvoření nového klienta'
        });
        logAuditEvent('VYTVOŘENÍ', 'Klienti', nazev, `Vytvoření nového klienta: ${nazev} (${mesto})`);
    }

    saveData('crm_clients', state.clients);
    closeAllModals();
    renderClientsTable();
    renderMapMarkers();
}

function deleteClient(clientId) {
    const targetClient = state.clients.find(c => c.id === clientId);
    const targetName = targetClient ? targetClient.nazev : 'Neznámý';

    if (confirm("Opravdu chcete smazat tohoto klienta? Budou smazáni i pracovníci a odpojeny události.")) {
        // Remove client
        state.clients = state.clients.filter(c => c.id !== clientId);
        // Cascade delete workers
        state.workers = state.workers.filter(w => w.klient_id !== clientId);
        // Clean up links in events
        state.events = state.events.map(e => {
            if (e.link_client_id === clientId) {
                return { ...e, link_client_id: "", origin: "direct" };
            }
            return e;
        });

        saveData('crm_clients', state.clients);
        saveData('crm_workers', state.workers);
        saveData('crm_events', state.events);
        
        logAuditEvent('SMAZÁNÍ', 'Klienti', targetName, `Smazání klienta včetně cascade mazání pracovníků`);
        renderClientsTable();
        renderMapMarkers();
    }
}

// Real Geocoding via OpenStreetMap Nominatim API
document.getElementById('btn-geocode').addEventListener('click', async () => {
    const ulice = document.getElementById('client-ulice').value.trim();
    const mesto = document.getElementById('client-mesto').value.trim();
    const psc = document.getElementById('client-psc').value.trim();
    const stat = document.getElementById('client-stat').value.trim();
    
    if (!ulice || !mesto) {
        alert("Prosím vyplňte ulici a město před vyhledáním souřadnic.");
        return;
    }

    const btn = document.getElementById('btn-geocode');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Hledám...';
    btn.disabled = true;

    try {
        // Build a precise query string from address components
        const query = [ulice, psc, mesto, stat || 'Česká republika'].filter(Boolean).join(', ');
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
        
        console.log('[GEOCODE] Querying:', url);
        const response = await fetch(url, {
            headers: { 'Accept-Language': 'cs,en;q=0.9' }
        });

        if (!response.ok) throw new Error(`HTTP chyba: ${response.status}`);

        const results = await response.json();
        console.log('[GEOCODE] Results:', results);

        if (results.length > 0) {
            const lat = parseFloat(results[0].lat).toFixed(4);
            const lng = parseFloat(results[0].lon).toFixed(4);
            document.getElementById('client-souradnice').value = `${lat}, ${lng}`;
            const displayName = results[0].display_name;
            alert(`✅ Souřadnice nalezeny:\nLat: ${lat}, Lng: ${lng}\n\nAdresa dle mapy:\n${displayName}`);
        } else {
            // Fallback: search by city only
            const fallbackQuery = [mesto, stat || 'Česká republika'].join(', ');
            const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallbackQuery)}&format=json&limit=1`;
            console.log('[GEOCODE] Fallback query:', fallbackUrl);
            const fallbackResp = await fetch(fallbackUrl, {
                headers: { 'Accept-Language': 'cs,en;q=0.9' }
            });
            const fallbackResults = await fallbackResp.json();
            if (fallbackResults.length > 0) {
                const lat = parseFloat(fallbackResults[0].lat).toFixed(4);
                const lng = parseFloat(fallbackResults[0].lon).toFixed(4);
                document.getElementById('client-souradnice').value = `${lat}, ${lng}`;
                alert(`✅ Souřadnice nalezeny (přibližně dle města):\nLat: ${lat}, Lng: ${lng}\n\n⚠️ Přesná ulice nebyla rozpoznána, souřadnice jsou středem města.`);
            } else {
                alert("❌ Adresa nebyla nalezena. Zkontrolujte ulici a město, nebo zadejte souřadnice ručně.");
            }
        }
    } catch (err) {
        console.error('[GEOCODE] Error:', err);
        alert("❌ Chyba při vyhledávání souřadnic:\n" + err.message + "\n\nZkontrolujte připojení k internetu nebo zadejte souřadnice ručně.");
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});


// ==========================================================================
// 8. PRACOVNÍCI CRUD (WORKERS)
// ==========================================================================

function renderWorkersTable() {
    const tbody = document.querySelector('#table-workers tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const searchVal = document.getElementById('search-workers').value.toLowerCase();
    const filtered = state.workers.filter(w => {
        const client = state.clients.find(c => c.id === w.klient_id);
        const clientName = client ? client.nazev : '';
        
        return w.jmeno.toLowerCase().includes(searchVal) || 
               w.funkce.toLowerCase().includes(searchVal) ||
               clientName.toLowerCase().includes(searchVal) ||
               w.email.toLowerCase().includes(searchVal)
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Žádní pracovníci neodpovídají vyhledávání.</td></tr>`;
        return;
    }

    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const hasDeletePermission = state.permissions[userRole] ? state.permissions[userRole].smazani : false;

    filtered.forEach(w => {
        const client = state.clients.find(c => c.id === w.klient_id);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><strong>${w.jmeno}</strong></td>
            <td><a href="#" onclick="event.preventDefault(); appDirectViewClient('${w.klient_id}')"><strong>${client ? client.nazev : 'Neznámý klient'}</strong></a></td>
            <td>${w.funkce}</td>
            <td><code>${w.mobil}</code></td>
            <td><a href="mailto:${w.email}">${w.email}</a></td>
            <td class="text-center">${renderDisplayCheckbox(w.enews)}</td>
            <td class="text-right">
                <button class="btn btn-secondary btn-sm btn-edit-worker" data-id="${w.id}">Upravit / Detail</button>
                ${hasDeletePermission ? `<button class="btn btn-danger btn-sm btn-delete-worker" data-id="${w.id}">Smazat</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit-worker').forEach(btn => {
        btn.addEventListener('click', () => openWorkerModal(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-delete-worker').forEach(btn => {
        btn.addEventListener('click', () => deleteWorker(btn.getAttribute('data-id')));
    });
}

function openWorkerModal(workerId = null) {
    const modal = document.getElementById('modal-worker');
    const form = document.getElementById('form-worker');
    const title = document.getElementById('modal-worker-title');
    const linkedInfo = document.getElementById('worker-linked-events-info');

    // Populate clients dropdown
    const clientSelect = document.getElementById('worker-klient-id');
    clientSelect.innerHTML = '<option value="" disabled selected>-- Vyberte klienta --</option>';
    state.clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.nazev;
        clientSelect.appendChild(option);
    });

    form.reset();
    linkedInfo.innerHTML = '';

    // Render audit trail info
    renderAuditTrail('worker-audit-info', workerId ? state.workers.find(w => w.id === workerId) : null);

    if (workerId) {
        title.textContent = 'Detail / Upravit Pracovníka';
        const worker = state.workers.find(w => w.id === workerId);
        if (worker) {
            document.getElementById('worker-id').value = worker.id;
            document.getElementById('worker-jmeno').value = worker.jmeno;
            document.getElementById('worker-klient-id').value = worker.klient_id;
            document.getElementById('worker-funkce').value = worker.funkce;
            document.getElementById('worker-mobil').value = worker.mobil;
            document.getElementById('worker-email').value = worker.email;
            document.getElementById('worker-enews').checked = worker.enews;

            // Link event tracking check
            const linkedEvents = state.events.filter(e => e.link_worker_id === workerId);
            if (linkedEvents.length > 0) {
                linkedInfo.innerHTML = `Propojené události: <strong>${linkedEvents.length}x</strong>. <a href="#kalendar" onclick="closeAllModals(); switchTab('kalendar');" style="color: var(--primary); font-weight:600;">Zobrazit v kalendáři</a>`;
            } else {
                linkedInfo.innerHTML = `Žádné propojené události. <a href="#" onclick="event.preventDefault(); closeAllModals(); openEventModal(null, {workerId: '${workerId}'});" style="color: var(--primary); font-weight:600;">Vytvořit událost</a>`;
            }
        }
    } else {
        title.textContent = 'Nový Pracovník';
        document.getElementById('worker-id').value = '';
    }

    showModal(modal);
}

function saveWorker(e) {
    e.preventDefault();
    const id = document.getElementById('worker-id').value;
    const jmeno = document.getElementById('worker-jmeno').value;
    const klient_id = document.getElementById('worker-klient-id').value;
    const funkce = document.getElementById('worker-funkce').value;
    const mobil = document.getElementById('worker-mobil').value;
    const email = document.getElementById('worker-email').value;
    const enews = document.getElementById('worker-enews').checked;

    const activeUser = state.currentUser ? state.currentUser.zkratka : 'SYSTEM';
    const nowStr = formatDateToISO(new Date());

    if (id) {
        const index = state.workers.findIndex(w => w.id === id);
        if (index !== -1) {
            const old = state.workers[index];
            const changes = [];
            if (old.jmeno !== jmeno) changes.push(`Jméno (${old.jmeno} -> ${jmeno})`);
            if (old.klient_id !== klient_id) {
                const oldC = state.clients.find(c => c.id === old.klient_id);
                const newC = state.clients.find(c => c.id === klient_id);
                changes.push(`Firma (${oldC ? oldC.nazev : 'Bez firmy'} -> ${newC ? newC.nazev : 'Bez firmy'})`);
            }
            if (old.funkce !== funkce) changes.push(`Funkce (${old.funkce} -> ${funkce})`);
            if (old.mobil !== mobil) changes.push(`Mobil (${old.mobil} -> ${mobil})`);
            if (old.email !== email) changes.push(`Email (${old.email} -> ${email})`);
            if (old.enews !== enews) changes.push(`Enews (${old.enews} -> ${enews})`);

            const changeText = changes.length > 0 ? `Změna: ${changes.join(', ')}` : 'Beze změny hodnot';

            state.workers[index] = { 
                ...state.workers[index], 
                jmeno, klient_id, funkce, mobil, email, enews,
                updated_by: activeUser,
                updated_at: nowStr,
                last_change_details: changeText
            };
            logAuditEvent('ÚPRAVA', 'Pracovníci', jmeno, changeText);
        }
    } else {
        const newId = getNextId('w', state.workers);
        state.workers.push({
            id: newId, jmeno, klient_id, funkce, mobil, email, enews,
            created_by: activeUser,
            created_at: nowStr,
            updated_by: activeUser,
            updated_at: nowStr,
            last_change_details: 'Vytvoření nového pracovníka'
        });
        logAuditEvent('VYTVOŘENÍ', 'Pracovníci', jmeno, `Vytvoření nového pracovníka: ${jmeno}`);
    }

    saveData('crm_workers', state.workers);
    closeAllModals();
    renderWorkersTable();
}

function deleteWorker(workerId) {
    const targetWorker = state.workers.find(w => w.id === workerId);
    const targetName = targetWorker ? targetWorker.jmeno : 'Neznámý';

    if (confirm("Opravdu chcete smazat tohoto pracovníka? Události budou odpojeny.")) {
        state.workers = state.workers.filter(w => w.id !== workerId);
        
        // Clean up linked events
        state.events = state.events.map(e => {
            if (e.link_worker_id === workerId) {
                return { ...e, link_worker_id: "", origin: "direct" };
            }
            return e;
        });

        saveData('crm_workers', state.workers);
        saveData('crm_events', state.events);
        logAuditEvent('SMAZÁNÍ', 'Pracovníci', targetName, `Smazání pracovníka a odpojení jeho událostí`);
        renderWorkersTable();
    }
}


// ==========================================================================
// 9. KALENDÁŘ & TRASOVÁNÍ UDÁLOSTÍ (EVENTS)
// ==========================================================================

function renderCalendar() {
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarCells = document.getElementById('calendar-cells');
    
    if (!calendarMonthYear || !calendarCells) return;

    calendarCells.innerHTML = '';

    const year = state.currentCalendarDate.getFullYear();
    const month = state.currentCalendarDate.getMonth();

    const CzechMonths = [
        "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
        "Července", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
    ];
    calendarMonthYear.textContent = `${CzechMonths[month]} ${year}`;

    // Get first day of the month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Adjust to starting monday (0 = sunday -> convert sunday to index 6, monday to 0, etc.)
    const startDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Get last date of the current month
    const lastDate = new Date(year, month + 1, 0).getDate();
    // Get last date of the previous month
    const prevLastDate = new Date(year, month, 0).getDate();

    // Renders cells
    let cellsHTML = '';

    // Filter events based on selections
    const filterType = document.getElementById('filter-event-type').value;
    const filterUser = document.getElementById('filter-event-user').value;

    const activeEvents = state.events.filter(e => {
        if (filterType === 'active') {
            if (e.datum_kon) return false;
        } else if (filterType !== 'all' && e.typ !== filterType) {
            return false;
        }
        
        if (filterUser !== 'all' && e.uzivatel_id !== filterUser) return false;
        return true;
    });

    // Days from previous month
    for (let x = startDayOffset; x > 0; x--) {
        const day = prevLastDate - x + 1;
        const cellDate = new Date(year, month - 1, day);
        cellsHTML += renderCalendarCell(cellDate, false, activeEvents);
    }

    // Days of current month
    for (let i = 1; i <= lastDate; i++) {
        const cellDate = new Date(year, month, i);
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        cellsHTML += renderCalendarCell(cellDate, true, activeEvents, isToday);
    }

    // Days of next month to fill grid (assuming 42 cell slots maximum)
    const totalRendered = startDayOffset + lastDate;
    const remaining = 42 - totalRendered;
    for (let j = 1; j <= remaining; j++) {
        const cellDate = new Date(year, month + 1, j);
        cellsHTML += renderCalendarCell(cellDate, false, activeEvents);
    }

    calendarCells.innerHTML = cellsHTML;

    // Add click listeners to events
    calendarCells.querySelectorAll('.calendar-event').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid triggering cell click
            openEventModal(el.getAttribute('data-id'));
        });
    });

    // Add click listeners to blank cells to quickly add an event
    calendarCells.querySelectorAll('.calendar-cell').forEach(el => {
        el.addEventListener('click', () => {
            const dateStr = el.getAttribute('data-date');
            openEventModal(null, { defaultDate: dateStr });
        });
    });
}

function renderCalendarCell(dateObj, isCurrentMonth, eventsList, isToday = false) {
    const dateStr = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
    
    // Find events matching this date
    const dayEvents = eventsList.filter(e => {
        const pDate = new Date(e.datum_plan);
        return pDate.getFullYear() === dateObj.getFullYear() &&
               pDate.getMonth() === dateObj.getMonth() &&
               pDate.getDate() === dateObj.getDate();
    });

    let eventsHTML = '';
    dayEvents.forEach(e => {
        // Visual indicator of origin link trace
        let traceClass = 'direct-origin';
        if (e.link_client_id) traceClass = 'linked-client';
        else if (e.link_worker_id) traceClass = 'linked-worker';
        
        // Find user initials
        const userObj = state.users.find(u => u.id === e.uzivatel_id);
        const initials = userObj ? userObj.zkratka : '??';

        const isCompleted = !!e.datum_kon;
        const completedClass = isCompleted ? 'event-completed' : '';

        eventsHTML += `
            <div class="calendar-event ${e.typ === 'úkol' ? 'task-type' : 'meeting-type'} ${traceClass} ${completedClass}" 
                 data-id="${e.id}" title="${e.nazev} (${e.uzivatel}) ${isCompleted ? '[SPLNĚNO]' : ''}">
                 <span class="event-user-badge" style="font-weight: bold; background: rgba(0,0,0,0.15); padding: 1px 4px; border-radius: 3px; font-size: 0.72rem; margin-right: 4px;">${initials}</span>
                 <span>${pad(new Date(e.datum_plan).getHours())}:${pad(new Date(e.datum_plan).getMinutes())} ${e.nazev}</span>
            </div>
        `;
    });

    return `
        <div class="calendar-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}" data-date="${dateStr}">
            <span class="calendar-cell-date">${dateObj.getDate()}</span>
            <div class="calendar-events-container">
                ${eventsHTML}
            </div>
        </div>
    `;
}

// Logic for Calendar filter selectors
document.getElementById('filter-event-type').addEventListener('change', renderCalendar);
document.getElementById('filter-event-user').addEventListener('change', renderCalendar);

document.getElementById('btn-prev-month').addEventListener('click', () => {
    state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('btn-next-month').addEventListener('click', () => {
    state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + 1);
    renderCalendar();
});

document.getElementById('btn-calendar-today').addEventListener('click', () => {
    state.currentCalendarDate = new Date();
    renderCalendar();
});

// Setup calendar filter dropdown with current users list
function populateCalendarFilters() {
    const filterUserSelect = document.getElementById('filter-event-user');
    const val = filterUserSelect.value;
    filterUserSelect.innerHTML = '';
    
    // 1. "Všichni" option
    const optAll = document.createElement('option');
    optAll.value = 'all';
    optAll.textContent = 'Všichni uživatelé';
    filterUserSelect.appendChild(optAll);

    // 2. "Jen já" dynamic option
    if (state.currentUser) {
        const optMe = document.createElement('option');
        optMe.value = state.currentUser.id;
        optMe.textContent = `Pouze já (${state.currentUser.jmeno})`;
        filterUserSelect.appendChild(optMe);
    }

    // 3. Divider / other users list
    state.users.forEach(u => {
        if (state.currentUser && u.id === state.currentUser.id) return; // skip duplicate me
        const option = document.createElement('option');
        option.value = u.id;
        option.textContent = u.jmeno;
        filterUserSelect.appendChild(option);
    });

    filterUserSelect.value = val || 'all';
}


// ==========================================================================
// 10. EVENTS CRUD, TRACING ORIGIN & DATA CONTEXTS
// ==========================================================================

function openEventModal(eventId = null, options = {}) {
    const modal = document.getElementById('modal-event');
    const form = document.getElementById('form-event');
    const title = document.getElementById('modal-event-title');
    const deleteBtn = document.getElementById('btn-delete-event');
    const banner = document.getElementById('event-origin-banner');

    form.reset();
    deleteBtn.classList.add('hidden');
    document.getElementById('btn-complete-event').classList.add('hidden');
    banner.classList.add('hidden');
    banner.innerHTML = '';

    // Populate Users dropdown
    const userSelect = document.getElementById('event-uzivatel-id');
    userSelect.innerHTML = '';
    
    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const isAdmin = (userRole === 'ADMIN');

    state.users.forEach(u => {
        const option = document.createElement('option');
        option.value = u.id;
        option.textContent = u.jmeno;
        userSelect.appendChild(option);
    });
    // Default to current simulated user
    userSelect.value = state.currentUser.id;
    
    // Non-admins can only create events for themselves
    userSelect.disabled = !isAdmin;

    // Populate Clients linking dropdown
    const clientSelect = document.getElementById('event-link-client');
    clientSelect.innerHTML = '<option value="">-- Nepropojovat s klientem --</option>';
    state.clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.nazev;
        clientSelect.appendChild(option);
    });

    // Helper to dynamically populate worker dropdown based on selected client
    function populateLinkedWorkers(selectedClientId) {
        const workerSelect = document.getElementById('event-link-worker');
        const previousWorkerValue = workerSelect.value;
        workerSelect.innerHTML = '<option value="">-- Nepropojovat s pracovníkem --</option>';
        
        const filteredWorkers = selectedClientId 
            ? state.workers.filter(w => w.klient_id === selectedClientId)
            : state.workers;

        filteredWorkers.forEach(w => {
            const client = state.clients.find(c => c.id === w.klient_id);
            const option = document.createElement('option');
            option.value = w.id;
            option.textContent = `${w.jmeno} (${client ? client.nazev : 'Bez firmy'})`;
            workerSelect.appendChild(option);
        });

        // Re-set previous value if it's still available in the list
        if ([...workerSelect.options].some(opt => opt.value === previousWorkerValue)) {
            workerSelect.value = previousWorkerValue;
        }
    }

    // Bind change event to client selector to filter workers
    clientSelect.addEventListener('change', (e) => {
        populateLinkedWorkers(e.target.value);
    });

    if (eventId) {
        // Edit mode
        title.textContent = 'Detail / Upravit Událost';
        
        const hasDeletePermission = state.permissions[userRole] ? state.permissions[userRole].smazani : false;
        if (hasDeletePermission) {
            deleteBtn.classList.remove('hidden');
        } else {
            deleteBtn.classList.add('hidden');
        }
        
        const event = state.events.find(e => e.id === eventId);
        // Render audit trail info
        renderAuditTrail('event-audit-info', event);

        if (event) {
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-nazev').value = event.nazev;
            document.getElementById('event-typ').value = event.typ;
            document.getElementById('event-uzivatel-id').value = event.uzivatel_id;
            document.getElementById('event-datum-plan').value = event.datum_plan;
            document.getElementById('event-datum-kon').value = event.datum_kon;
            document.getElementById('event-link-client').value = event.link_client_id;
            
            // Re-populate workers dropdown based on current client
            populateLinkedWorkers(event.link_client_id);
            
            document.getElementById('event-link-worker').value = event.link_worker_id;
            document.getElementById('event-poznamka').value = event.poznámka;

            // Check editing permission
            // Admin can edit everything. 
            // Regular user can only edit events they created (created_by === activeUser initials)
            const activeUserInitials = state.currentUser ? state.currentUser.zkratka : 'SYSTEM';
            const isCreator = (event.created_by === activeUserInitials);
            const canEdit = (userRole === 'ADMIN') || isCreator;

            // Enable/disable form inputs based on editing rights
            const formInputs = form.querySelectorAll('input, select, textarea');
            formInputs.forEach(input => {
                input.disabled = !canEdit;
            });

            // Toggle save and complete buttons
            const saveBtn = form.querySelector('button[type="submit"]');
            if (saveBtn) saveBtn.style.display = canEdit ? 'inline-block' : 'none';

            // Show complete button only if event has no completion date yet AND can edit
            const completeBtn = document.getElementById('btn-complete-event');
            if (!event.datum_kon && canEdit) {
                completeBtn.classList.remove('hidden');
                if (event.typ === 'úkol') {
                    completeBtn.textContent = '✓ Splnit úkol';
                    completeBtn.style.backgroundColor = 'var(--success)';
                } else {
                    completeBtn.textContent = '✓ Dokončit schůzku';
                    completeBtn.style.backgroundColor = '#f97316'; // Orange
                }
            } else {
                completeBtn.classList.add('hidden');
            }
            
            // Adjust title if in read-only mode
            if (!canEdit) {
                title.textContent = 'Detail Události (Pouze pro čtení)';
            }

            // Render tracing / origin info
            banner.classList.remove('hidden');
            let originLabel = '';
            if (event.origin === 'klient' && event.link_client_id) {
                const client = state.clients.find(c => c.id === event.link_client_id);
                originLabel = `📍 Událost zadána v sekci <strong>KLIENT</strong>: ${client ? client.nazev : 'Neznámý klient'}`;
            } else if (event.origin === 'pracovnik' && event.link_worker_id) {
                const worker = state.workers.find(w => w.id === event.link_worker_id);
                originLabel = `👤 Událost zadána v sekci <strong>PRACOVNÍK</strong>: ${worker ? worker.jmeno : 'Neznámý pracovník'}`;
            } else {
                originLabel = `📅 Událost zadána přímo v <strong>KALENDÁŘI</strong>`;
            }
            banner.innerHTML = originLabel;
        }
    } else {
        // Create mode
        title.textContent = 'Nová Událost';
        document.getElementById('event-id').value = '';
        
        // Handle pre-fills and context origins
        let origin = 'direct';
        
        if (options.clientId) {
            document.getElementById('event-link-client').value = options.clientId;
            origin = 'klient';
            banner.classList.remove('hidden');
            const client = state.clients.find(c => c.id === options.clientId);
            banner.innerHTML = `📝 Událost bude přiřazena klientovi: <strong>${client ? client.nazev : ''}</strong>`;
            
            // Populate and link worker
            populateLinkedWorkers(options.clientId);
            const workers = state.workers.filter(w => w.klient_id === options.clientId);
            if (workers.length > 0) {
                document.getElementById('event-link-worker').value = workers[0].id;
            }
        }
        
        if (options.workerId) {
            document.getElementById('event-link-worker').value = options.workerId;
            origin = 'pracovnik';
            banner.classList.remove('hidden');
            const worker = state.workers.find(w => w.id === options.workerId);
            banner.innerHTML = `📝 Událost bude přiřazena pracovníkovi: <strong>${worker ? worker.jmeno : ''}</strong>`;
            
            if (worker) {
                document.getElementById('event-link-client').value = worker.klient_id;
                populateLinkedWorkers(worker.klient_id);
                document.getElementById('event-link-worker').value = worker.id;
            }
        }

        // If no specific client or worker is pre-selected, initialize the default dropdowns (empty client)
        if (!options.clientId && !options.workerId) {
            document.getElementById('event-link-client').value = '';
            populateLinkedWorkers('');
        }

        // Set default dates
        let defaultStart = new Date();
        if (options.defaultDate) {
            defaultStart = new Date(options.defaultDate);
            // Default time to 09:00
            defaultStart.setHours(9, 0, 0, 0);
        } else {
            // Round to nearest hour
            defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0);
        }
        
        const defaultEnd = new Date(defaultStart);
        defaultEnd.setHours(defaultStart.getHours() + 1);

        document.getElementById('event-datum-plan').value = formatDateToISO(defaultStart);
        
        // For new events: completion date is ALWAYS empty by default,
        // so that they start as uncompleted (tasks and meetings)
        document.getElementById('event-datum-kon').value = '';
        
        // Save origin context on form dataset
        form.dataset.origin = origin;

        // Ensure inputs are enabled for new creation (except responsible person dropdown for non-admins)
        const formInputs = form.querySelectorAll('input, select, textarea');
        const activeUserRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
        const isAdmin = (activeUserRole === 'ADMIN');
        formInputs.forEach(input => {
            if (input.id === 'event-uzivatel-id' && !isAdmin) {
                input.disabled = true;
            } else {
                input.disabled = false;
            }
        });
        const saveBtn = form.querySelector('button[type="submit"]');
        if (saveBtn) saveBtn.style.display = 'inline-block';
    }

    // Hide audit info by default for new events
    if (!eventId) {
        renderAuditTrail('event-audit-info', null);
    }

    showModal(modal);
}

function formatDateToISO(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function saveEvent(e) {
    e.preventDefault();
    const id = document.getElementById('event-id').value;
    const nazev = document.getElementById('event-nazev').value;
    const typ = document.getElementById('event-typ').value;
    const uzivatel_id = document.getElementById('event-uzivatel-id').value;
    const datum_plan = document.getElementById('event-datum-plan').value;
    const datum_kon = document.getElementById('event-datum-kon').value;
    const link_client_id = document.getElementById('event-link-client').value;
    const link_worker_id = document.getElementById('event-link-worker').value;
    const poznámka = document.getElementById('event-poznamka').value;

    const user = state.users.find(u => u.id === uzivatel_id);
    const uzivatel = user ? user.jmeno : '';

    const activeUser = state.currentUser ? state.currentUser.zkratka : 'SYSTEM';
    const nowStr = formatDateToISO(new Date());

    if (id) {
        // Edit mode
        const index = state.events.findIndex(e => e.id === id);
        if (index !== -1) {
            const old = state.events[index];
            const changes = [];
            if (old.nazev !== nazev) changes.push(`Název (${old.nazev} -> ${nazev})`);
            if (old.typ !== typ) changes.push(`Typ (${old.typ} -> ${typ})`);
            if (old.uzivatel_id !== uzivatel_id) changes.push(`Odpovědný (${old.uzivatel} -> ${uzivatel})`);
            if (old.datum_plan !== datum_plan) changes.push(`Plánováno (${old.datum_plan} -> ${datum_plan})`);
            if (old.datum_kon !== datum_kon) {
                const oldK = old.datum_kon ? old.datum_kon : 'nesplněno';
                const newK = datum_kon ? datum_kon : 'nesplněno';
                changes.push(`Splněno (${oldK} -> ${newK})`);
            }
            if (old.poznámka !== poznámka) changes.push(`Poznámka (změna)`);

            const changeText = changes.length > 0 ? `Změna: ${changes.join(', ')}` : 'Beze změny hodnot';

            // Keep original origin if it exists
            const existingOrigin = state.events[index].origin || 'direct';
            const createdBy = state.events[index].created_by || 'SYSTEM';
            const createdAt = state.events[index].created_at || state.events[index].datum_zal;
            
            state.events[index] = { 
                ...state.events[index], 
                nazev, typ, uzivatel_id, uzivatel, datum_plan, datum_kon, link_client_id, link_worker_id, poznámka,
                origin: existingOrigin,
                created_by: createdBy,
                created_at: createdAt,
                updated_by: activeUser,
                updated_at: nowStr,
                last_change_details: changeText
            };
            logAuditEvent('ÚPRAVA', 'Události', nazev, changeText);
        }
    } else {
        // Create mode
        const por_cislo = getNextPorCislo(state.events);
        const newId = getNextId('e', state.events);
        
        // Read origin context
        const origin = document.getElementById('form-event').dataset.origin || 'direct';

        state.events.push({
            id: newId, por_cislo, typ, datum_zal: formatDateToISO(new Date()), datum_plan, datum_kon, 
            nazev, poznámka, uzivatel_id, uzivatel, link_client_id, link_worker_id, origin,
            created_by: activeUser,
            created_at: nowStr,
            updated_by: activeUser,
            updated_at: nowStr,
            last_change_details: `Vytvoření události (${typ})`
        });
        logAuditEvent('VYTVOŘENÍ', 'Události', nazev, `Vytvoření nové události (${typ}): ${nazev}`);
    }

    saveData('crm_events', state.events);
    closeAllModals();
    renderCalendar();
    renderDashboard();
}

function deleteEventAction() {
    const id = document.getElementById('event-id').value;
    const targetEvent = state.events.find(e => e.id === id);
    const targetName = targetEvent ? targetEvent.nazev : 'Neznámý';
    
    if (id && confirm("Opravdu chcete smazat tuto událost?")) {
        state.events = state.events.filter(e => e.id !== id);
        saveData('crm_events', state.events);
        logAuditEvent('SMAZÁNÍ', 'Události', targetName, `Smazání události: ${targetName}`);
        closeAllModals();
        renderCalendar();
        renderDashboard();
    }
}


// ==========================================================================
// 11. FORM & MODAL CONTROLLERS (OPEN/CLOSE/BINDINGS)
// ==========================================================================

function setupFormsAndModals() {
    // Event listeners to show/hide modals
    document.querySelectorAll('.open-add-event-modal').forEach(btn => {
        btn.addEventListener('click', () => openEventModal());
    });

    document.getElementById('btn-add-user').addEventListener('click', () => openUserModal());
    document.getElementById('btn-add-client').addEventListener('click', () => openClientModal());
    document.getElementById('btn-add-worker').addEventListener('click', () => openWorkerModal());

    // Bind form submits
    document.getElementById('form-user').addEventListener('submit', saveUser);
    document.getElementById('form-client').addEventListener('submit', saveClient);
    document.getElementById('form-worker').addEventListener('submit', saveWorker);
    document.getElementById('form-event').addEventListener('submit', saveEvent);

    // Bind delete event button inside modal
    document.getElementById('btn-delete-event').addEventListener('click', deleteEventAction);

    // Bind complete event button (sets current time as completion date)
    document.getElementById('btn-complete-event').addEventListener('click', () => {
        const now = new Date();
        document.getElementById('event-datum-kon').value = formatDateToISO(now);
    });

    // Dynamically show/hide & style 'Dokončit' button on type dropdown change
    document.getElementById('event-typ').addEventListener('change', (e) => {
        const id = document.getElementById('event-id').value;
        const completeBtn = document.getElementById('btn-complete-event');
        const datumKon = document.getElementById('event-datum-kon').value;
        
        // Only show button if we are in Edit Mode (id exists) and there's no completion date yet
        if (id && !datumKon) {
            completeBtn.classList.remove('hidden');
            if (e.target.value === 'úkol') {
                completeBtn.textContent = '✓ Splnit úkol';
                completeBtn.style.backgroundColor = 'var(--success)';
            } else {
                completeBtn.textContent = '✓ Dokončit schůzku';
                completeBtn.style.backgroundColor = '#f97316';
            }
        } else {
            completeBtn.classList.add('hidden');
        }
    });

    // Closers
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
        });
    });

    document.getElementById('modal-backdrop').addEventListener('click', closeAllModals);

    // Bind search bars keyup filters
    document.getElementById('search-users').addEventListener('keyup', renderUsersTable);
    document.getElementById('search-clients').addEventListener('keyup', renderClientsTable);
    document.getElementById('search-workers').addEventListener('keyup', renderWorkersTable);
    
    // Bind context links from client/worker modals
    document.getElementById('btn-add-event-from-client').addEventListener('click', (e) => {
        e.preventDefault();
        const clientId = document.getElementById('client-id').value;
        closeAllModals();
        openEventModal(null, { clientId });
    });

    document.getElementById('btn-add-event-from-worker').addEventListener('click', (e) => {
        e.preventDefault();
        const workerId = document.getElementById('worker-id').value;
        closeAllModals();
        openEventModal(null, { workerId });
    });

    // Bind Audit Log filters and actions
    const searchAudit = document.getElementById('search-audit');
    if (searchAudit) {
        searchAudit.addEventListener('keyup', renderAuditLogsTable);
    }

    const btnClearAudit = document.getElementById('btn-clear-audit');
    if (btnClearAudit) {
        btnClearAudit.addEventListener('click', () => {
            if (confirm("Opravdu chcete smazat celou historii změn? Tato akce je nevratná.")) {
                state.audit_logs = [];
                saveData('crm_audit_logs', state.audit_logs);
                renderAuditLogsTable();
            }
        });
    }

    // Bind dashboard stat cards navigation
    const eventsCard = document.getElementById('stat-card-events');
    if (eventsCard) {
        eventsCard.addEventListener('click', () => {
            switchTab('kalendar');
            const typeFilter = document.getElementById('filter-event-type');
            if (typeFilter) {
                typeFilter.value = 'active';
                renderCalendar();
            }
        });
    }

    const clientsCard = document.getElementById('stat-card-clients');
    if (clientsCard) {
        clientsCard.addEventListener('click', () => {
            switchTab('klienti');
        });
    }

    const workersCard = document.getElementById('stat-card-workers');
    if (workersCard) {
        workersCard.addEventListener('click', () => {
            switchTab('pracovnici');
        });
    }

    const usersCard = document.getElementById('stat-card-users');
    if (usersCard) {
        usersCard.addEventListener('click', () => {
            switchTab('uzivatele');
        });
    }

    // Bind Attendance quick action buttons
    document.getElementById('btn-quick-arrival').addEventListener('click', recordQuickArrival);
    document.getElementById('btn-quick-departure').addEventListener('click', recordQuickDeparture);
    document.getElementById('btn-manual-attendance').addEventListener('click', () => openAttendanceModal());

    // Bind Attendance filters
    document.getElementById('filter-attendance-user').addEventListener('change', renderAttendance);
    document.getElementById('filter-attendance-month').addEventListener('change', renderAttendance);
    document.getElementById('filter-attendance-year').addEventListener('change', renderAttendance);

    // Bind attendance modal submit
    document.getElementById('form-attendance').addEventListener('submit', saveAttendance);
    document.getElementById('btn-delete-attendance').addEventListener('click', deleteAttendance);

    // Dynamically toggle times in attendance modal based on type selected and handle date ranges
    const attendanceType = document.getElementById('attendance-type');
    const arrivalInput = document.getElementById('attendance-arrival');
    const departureInput = document.getElementById('attendance-departure');
    const dateToGroup = document.getElementById('attendance-date-to-group');
    const dateToInput = document.getElementById('attendance-date-to');
    const dateInput = document.getElementById('attendance-date');
    const summaryDaysGroup = document.getElementById('attendance-summary-days');

    function calculateAttendanceDays() {
        const type = attendanceType.value;
        const dateFromVal = dateInput.value;
        const dateToVal = dateToInput.value;

        if ((type === 'dovolená' || type === 'nemoc') && dateFromVal) {
            const start = new Date(dateFromVal);
            const end = dateToVal ? new Date(dateToVal) : start;

            if (end < start) {
                summaryDaysGroup.style.display = 'block';
                document.getElementById('attendance-days-text').textContent = '⚠️ Datum do nesmí předcházet datumu od!';
                document.getElementById('attendance-days-text').style.color = 'var(--danger)';
                return;
            }

            let daysCount = 0;
            let current = new Date(start);
            while (current <= end) {
                if (type === 'dovolená') {
                    // Only count business days (Monday-Friday) for vacation
                    const day = current.getDay();
                    if (day !== 0 && day !== 6) {
                        daysCount++;
                    }
                } else {
                    // Count all days for sick leave (nemocenská)
                    daysCount++;
                }
                current.setDate(current.getDate() + 1);
            }

            summaryDaysGroup.style.display = 'block';
            document.getElementById('attendance-days-text').textContent = `Celkový počet dnů k zaúčtování: ${daysCount}`;
            document.getElementById('attendance-days-text').style.color = 'var(--primary)';
        } else {
            summaryDaysGroup.style.display = 'none';
        }
    }

    attendanceType.addEventListener('change', (e) => {
        const type = e.target.value;
        if (type === 'dovolená' || type === 'nemoc') {
            arrivalInput.value = '';
            departureInput.value = '';
            arrivalInput.disabled = true;
            departureInput.disabled = true;
            dateToGroup.style.display = 'block';
            if (!dateToInput.value) dateToInput.value = dateInput.value;
        } else {
            arrivalInput.disabled = false;
            departureInput.disabled = false;
            dateToGroup.style.display = 'none';
            dateToInput.value = '';
        }
        calculateAttendanceDays();
    });

    dateInput.addEventListener('change', calculateAttendanceDays);
    dateToInput.addEventListener('change', calculateAttendanceDays);
}

function showModal(modalEl) {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    modalEl.classList.remove('hidden');
}

function closeAllModals() {
    document.getElementById('modal-backdrop').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    
    // Repopulate filter fields just in case data changed
    populateCalendarFilters();
}


// ==========================================================================
// 12. AUDIT LOGGING SERVICE
// ==========================================================================

function logAuditEvent(actionType, entityType, entityName, details) {
    const activeUser = state.currentUser ? state.currentUser.zkratka : 'SYSTEM';
    const logEntry = {
        timestamp: formatDateToISO(new Date()),
        user: activeUser,
        action: actionType, // 'VYTVOŘENÍ', 'ÚPRAVA', 'SMAZÁNÍ'
        module: entityType, // 'Klienti', 'Pracovníci', 'Uživatelé', 'Události'
        target: entityName,
        details: details
    };
    
    state.audit_logs.unshift(logEntry); // Add to the beginning of list
    saveData('crm_audit_logs', state.audit_logs);
}

function renderAuditLogsTable() {
    const tbody = document.querySelector('#table-audit tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const searchVal = document.getElementById('search-audit').value.toLowerCase();
    const filtered = state.audit_logs.filter(log => 
        log.user.toLowerCase().includes(searchVal) ||
        log.action.toLowerCase().includes(searchVal) ||
        log.module.toLowerCase().includes(searchVal) ||
        log.target.toLowerCase().includes(searchVal) ||
        log.details.toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">V historii změn nejsou žádné odpovídající záznamy.</td></tr>`;
        return;
    }

    filtered.forEach(log => {
        const dateFormatted = new Date(log.timestamp).toLocaleString('cs-CZ');
        const tr = document.createElement('tr');
        
        let actionBadgeClass = 'badge-role'; // default grey
        if (log.action === 'VYTVOŘENÍ') actionBadgeClass = 'badge-create';
        if (log.action === 'ÚPRAVA') actionBadgeClass = 'badge-edit';
        if (log.action === 'SMAZÁNÍ') actionBadgeClass = 'badge-delete';

        tr.innerHTML = `
            <td><code>${dateFormatted}</code></td>
            <td><span class="event-tag">${log.user}</span></td>
            <td><span class="${actionBadgeClass}">${log.action}</span></td>
            <td><strong>${log.module}</strong></td>
            <td><strong>${log.target}</strong></td>
            <td><span style="font-size: 0.85rem; line-height: 1.3; display: block; max-width: 450px; overflow-wrap: break-word;">${log.details}</span></td>
        `;
        tbody.appendChild(tr);
    });
}


// ==========================================================================
// 13. ATTENDANCE (DOCHÁZKA) CONTROLLER
// ==========================================================================

function initAttendanceFilters() {
    const userSelect = document.getElementById('filter-attendance-user');
    if (!userSelect) return;

    // Save selected value to preserve selection during updates
    const currentSelection = userSelect.value;
    userSelect.innerHTML = '';

    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    
    if (userRole === 'ADMIN') {
        // Admin sees all users
        state.users.forEach(u => {
            const option = document.createElement('option');
            option.value = u.id;
            option.textContent = u.jmeno;
            userSelect.appendChild(option);
        });
        // Select back previous selection, or default to current user
        userSelect.value = currentSelection || state.currentUser.id;
        userSelect.disabled = false;
    } else {
        // Regular user only sees themselves
        const option = document.createElement('option');
        option.value = state.currentUser.id;
        option.textContent = state.currentUser.jmeno;
        userSelect.appendChild(option);
        userSelect.value = state.currentUser.id;
        userSelect.disabled = true;
    }

    // Set default month & year filter to today's date if not already selected
    const monthSelect = document.getElementById('filter-attendance-month');
    const yearSelect = document.getElementById('filter-attendance-year');
    const today = new Date();
    
    if (!monthSelect.value) {
        monthSelect.value = String(today.getMonth() + 1);
    }
    if (!yearSelect.value) {
        yearSelect.value = String(today.getFullYear());
    }
}

function renderAttendance() {
    const tbody = document.querySelector('#table-attendance tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const userId = document.getElementById('filter-attendance-user').value;
    const month = parseInt(document.getElementById('filter-attendance-month').value);
    const year = parseInt(document.getElementById('filter-attendance-year').value);

    const user = state.users.find(u => u.id === userId);
    const selectedUserName = user ? user.jmeno : 'Neznámý';

    // Filter attendance records by user & month & year
    const filtered = state.attendance.filter(att => {
        if (att.user_id !== userId) return false;
        const attDate = new Date(att.datum);
        return (attDate.getMonth() + 1) === month && attDate.getFullYear() === year;
    }).sort((a, b) => new Date(a.datum) - new Date(b.datum));

    // Stats counter variables
    let totalWorkHours = 0;
    let totalVacDays = 0;
    let totalNvHours = 0;
    let totalDoctorHours = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const isAdmin = (userRole === 'ADMIN');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">V tomto měsíci nejsou zaevidovány žádné docházkové záznamy.</td></tr>`;
    } else {
        filtered.forEach(att => {
            const tr = document.createElement('tr');
            
            // Calculate work hours if applicable
            let hoursDiffStr = '--';
            let hoursDiff = 0;
            if (att.prichod && att.odchod && (att.typ === 'práce' || att.typ === 'lékař' || att.typ === 'náhradní volno')) {
                const arrTime = att.prichod.split(':');
                const depTime = att.odchod.split(':');
                const arrMin = parseInt(arrTime[0]) * 60 + parseInt(arrTime[1]);
                const depMin = parseInt(depTime[0]) * 60 + parseInt(depTime[1]);
                if (depMin > arrMin) {
                    hoursDiff = (depMin - arrMin) / 60;
                    hoursDiffStr = `${hoursDiff.toFixed(1)} h`;
                }
            }

            // Summarize stats
            if (att.typ === 'práce') {
                totalWorkHours += hoursDiff;
            } else if (att.typ === 'dovolená') {
                totalVacDays += 1;
            } else if (att.typ === 'náhradní volno') {
                totalNvHours += hoursDiff;
            } else if (att.typ === 'lékař') {
                totalDoctorHours += hoursDiff;
            }

            // Rules for editing/deleting:
            // Regular user: can only edit TODAY's records, cannot delete.
            // Admin: can edit and delete anything.
            const isToday = (att.datum === todayStr);
            const canEdit = isAdmin || isToday;
            const canDelete = isAdmin;

            let typeBadgeClass = 'badge-role';
            if (att.typ === 'dovolená') typeBadgeClass = 'badge-edit';
            if (att.typ === 'nemoc') typeBadgeClass = 'badge-delete';
            if (att.typ === 'lékař') typeBadgeClass = 'badge-role';
            if (att.typ === 'náhradní volno') typeBadgeClass = 'badge-create';

            tr.innerHTML = `
                <td><code>${new Date(att.datum).toLocaleDateString('cs-CZ')}</code></td>
                <td><span class="${typeBadgeClass}">${att.typ.toUpperCase()}</span></td>
                <td>${att.prichod || '--'}</td>
                <td>${att.odchod || '--'}</td>
                <td><strong>${hoursDiffStr}</strong></td>
                <td><span style="font-size: 0.82rem; color: var(--text-secondary);">${att.poznamka || '--'}</span></td>
                <td class="text-right">
                    ${canEdit ? `<button class="btn btn-secondary btn-sm btn-edit-att" data-id="${att.id}">Upravit</button>` : '<span class="text-muted" style="font-size:0.8rem;">Uzamčeno</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Wire up edit buttons
        tbody.querySelectorAll('.btn-edit-att').forEach(btn => {
            btn.addEventListener('click', () => openAttendanceModal(btn.getAttribute('data-id')));
        });
    }

    // Write counts to UI
    document.getElementById('att-sum-work').textContent = `${totalWorkHours.toFixed(1)} h`;
    document.getElementById('att-sum-vacation').textContent = `${totalVacDays} dnů`;
    document.getElementById('att-sum-nv').textContent = `${totalNvHours.toFixed(1)} h`;
    document.getElementById('att-sum-doctor').textContent = `${totalDoctorHours.toFixed(1)} h`;

    // Populate remaining limits from user object
    if (user) {
        document.getElementById('att-rem-vacation').textContent = user.dny_dovolena || 0;
        document.getElementById('att-rem-nv').textContent = user.hod_nv || 0;
    }
}

function recordQuickArrival() {
    const todayStr = new Date().toISOString().split('T')[0];
    const userId = state.currentUser.id;

    // Check if there is already an arrival today
    const existing = state.attendance.find(att => att.user_id === userId && att.datum === todayStr);
    if (existing) {
        alert("Dnešní příchod již byl zaznamenán! Pro úpravu klikněte na 'Upravit' v tabulce.");
        return;
    }

    const now = new Date();
    const timeStr = `${padNum(now.getHours())}:${padNum(now.getMinutes())}`;
    const initials = state.currentUser.zkratka;

    const newEntry = {
        id: 'att_' + Date.now(),
        user_id: userId,
        user_name: state.currentUser.jmeno,
        datum: todayStr,
        prichod: timeStr,
        odchod: '',
        typ: 'práce',
        poznamka: 'Rychlý příchod',
        created_by: initials,
        created_at: formatDateToISO(now),
        updated_by: initials,
        updated_at: formatDateToISO(now),
        last_change_details: 'Záznam příchodu'
    };

    state.attendance.push(newEntry);
    saveData('crm_attendance', state.attendance);
    renderAttendance();
    alert(`Příchod zaevidován v: ${timeStr}`);
}

function recordQuickDeparture() {
    const todayStr = new Date().toISOString().split('T')[0];
    const userId = state.currentUser.id;

    // Check if arrival is registered
    const existing = state.attendance.find(att => att.user_id === userId && att.datum === todayStr);
    if (!existing) {
        alert("Nejprve musíte zaevidovat příchod (tlačítko Příchod)!");
        return;
    }

    const now = new Date();
    const timeStr = `${padNum(now.getHours())}:${padNum(now.getMinutes())}`;
    const initials = state.currentUser.zkratka;

    existing.odchod = timeStr;
    existing.updated_by = initials;
    existing.updated_at = formatDateToISO(now);
    existing.last_change_details = `Doplněn odchod v ${timeStr}`;

    saveData('crm_attendance', state.attendance);
    renderAttendance();
    alert(`Odchod zaevidován v: ${timeStr}`);
}

function openAttendanceModal(attId = null) {
    const modal = document.getElementById('modal-attendance');
    const form = document.getElementById('form-attendance');
    const title = document.getElementById('modal-attendance-title');
    const deleteBtn = document.getElementById('btn-delete-attendance');
    const typeSelect = document.getElementById('attendance-type');
    const arrivalInput = document.getElementById('attendance-arrival');
    const departureInput = document.getElementById('attendance-departure');

    form.reset();
    deleteBtn.classList.add('hidden');
    arrivalInput.disabled = false;
    departureInput.disabled = false;

    // Populate defaults
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('attendance-date').value = todayStr;

    // Configure permissions
    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const isAdmin = (userRole === 'ADMIN');

    if (attId) {
        title.textContent = 'Upravit záznam docházky';
        const att = state.attendance.find(a => a.id === attId);
        
        // Render audit info
        renderAuditTrail('attendance-audit-info', att);

        if (att) {
            document.getElementById('attendance-id').value = att.id;
            document.getElementById('attendance-date').value = att.datum;
            document.getElementById('attendance-date-to').value = att.datum_do || att.datum;
            typeSelect.value = att.typ;
            arrivalInput.value = att.prichod || '';
            departureInput.value = att.odchod || '';
            document.getElementById('attendance-note').value = att.poznamka || '';

            // Handle range controls visibility
            const dateToGroup = document.getElementById('attendance-date-to-group');
            if (att.typ === 'dovolená' || att.typ === 'nemoc') {
                arrivalInput.disabled = true;
                departureInput.disabled = true;
                dateToGroup.style.display = 'block';
            } else {
                dateToGroup.style.display = 'none';
            }

            // Only Admin can delete attendance records
            if (isAdmin) {
                deleteBtn.classList.remove('hidden');
            }
        }
    } else {
        title.textContent = 'Nový záznam docházky / absence';
        document.getElementById('attendance-id').value = '';
        document.getElementById('attendance-date-to').value = '';
        document.getElementById('attendance-date-to-group').style.display = 'none';
        renderAuditTrail('attendance-audit-info', null);
    }

    // Trigger calculation updates
    const event = new Event('change');
    typeSelect.dispatchEvent(event);

    showModal(modal);
}

function saveAttendance(e) {
    e.preventDefault();
    const id = document.getElementById('attendance-id').value;
    const datum = document.getElementById('attendance-date').value;
    const datum_do = document.getElementById('attendance-date-to').value;
    const typ = document.getElementById('attendance-type').value;
    const prichod = document.getElementById('attendance-arrival').value;
    const odchod = document.getElementById('attendance-departure').value;
    const poznamka = document.getElementById('attendance-note').value;

    const initials = state.currentUser ? state.currentUser.zkratka : 'SYSTEM';
    const nowStr = formatDateToISO(new Date());

    const activeUserRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const isAdmin = (activeUserRole === 'ADMIN');

    let userId = state.currentUser.id;
    if (isAdmin) {
        userId = document.getElementById('filter-attendance-user').value;
    }
    const targetUserObj = state.users.find(u => u.id === userId);
    const targetName = targetUserObj ? targetUserObj.jmeno : 'Neznámý';

    if (prichod && odchod) {
        const arr = prichod.split(':');
        const dep = odchod.split(':');
        if ((parseInt(dep[0])*60 + parseInt(dep[1])) <= (parseInt(arr[0])*60 + parseInt(arr[1]))) {
            alert("Čas odchodu musí být později než čas příchodu!");
            return;
        }
    }

    // Helper to calculate total count of charged days
    function countChargedDays(type, startStr, endStr) {
        if (!startStr) return 0;
        const start = new Date(startStr);
        const end = endStr ? new Date(endStr) : start;
        if (end < start) return 0;

        let daysCount = 0;
        let current = new Date(start);
        while (current <= end) {
            if (type === 'dovolená') {
                const day = current.getDay();
                if (day !== 0 && day !== 6) daysCount++;
            } else {
                daysCount++;
            }
            current.setDate(current.getDate() + 1);
        }
        return daysCount;
    }

    if (id) {
        // Edit mode
        const index = state.attendance.findIndex(a => a.id === id);
        if (index !== -1) {
            const old = state.attendance[index];
            const changes = [];
            if (old.datum !== datum) changes.push(`Datum od (${old.datum} -> ${datum})`);
            if (old.datum_do !== datum_do) changes.push(`Datum do (${old.datum_do || old.datum} -> ${datum_do || datum})`);
            if (old.typ !== typ) changes.push(`Typ (${old.typ} -> ${typ})`);
            if (old.prichod !== prichod) changes.push(`Příchod (${old.prichod || 'neuveden'} -> ${prichod || 'neuveden'})`);
            if (old.odchod !== odchod) changes.push(`Odchod (${old.odchod || 'neuveden'} -> ${odchod || 'neuveden'})`);
            if (old.poznamka !== poznamka) changes.push(`Poznámka (změna)`);

            const changeText = changes.length > 0 ? `Změna: ${changes.join(', ')}` : 'Beze změny hodnot';

            // Check if changing type away from or to vacation/NV credits
            handleAttendanceCreditsDiff(old.user_id, old, { typ, datum, datum_do, prichod, odchod });

            state.attendance[index] = {
                ...state.attendance[index],
                datum, datum_do, typ, prichod, odchod, poznamka,
                updated_by: initials,
                updated_at: nowStr,
                last_change_details: changeText
            };

            if (old.user_id !== state.currentUser.id) {
                logAuditEvent('ÚPRAVA', 'Docházka', targetName, `Admin ${initials} upravil docházku za období ${datum} - ${datum_do || datum}: ${changeText}`);
            } else {
                logAuditEvent('ÚPRAVA', 'Docházka', targetName, `Změna docházky za období ${datum} - ${datum_do || datum}: ${changeText}`);
            }
        }
    } else {
        // Create mode
        // Prevent duplicate entries for same user & start date
        const duplicate = state.attendance.find(a => a.user_id === userId && a.datum === datum);
        if (duplicate) {
            alert(`Záznam docházky pro ${targetName} na den ${datum} již existuje!`);
            return;
        }

        const newEntry = {
            id: 'att_' + Date.now(),
            user_id: userId,
            user_name: targetName,
            datum, datum_do, typ, prichod, odchod, poznamka,
            created_by: initials,
            created_at: nowStr,
            updated_by: initials,
            updated_at: nowStr,
            last_change_details: 'Ruční zápis docházky'
        };

        // Charge vacation / NV credits if applicable
        handleAttendanceCreditsDiff(userId, null, newEntry);

        state.attendance.push(newEntry);
        
        if (userId !== state.currentUser.id) {
            logAuditEvent('VYTVOŘENÍ', 'Docházka', targetName, `Admin ${initials} vytvořil docházku za období ${datum} - ${datum_do || datum} (Typ: ${typ})`);
        } else {
            logAuditEvent('VYTVOŘENÍ', 'Docházka', targetName, `Vytvoření docházky za období ${datum} - ${datum_do || datum} (Typ: ${typ})`);
        }
    }

    saveData('crm_attendance', state.attendance);
    closeAllModals();
    renderAttendance();
}

function deleteAttendance() {
    const id = document.getElementById('attendance-id').value;
    if (!id) return;

    const att = state.attendance.find(a => a.id === id);
    if (!att) return;

    const targetUserObj = state.users.find(u => u.id === att.user_id);
    const targetName = targetUserObj ? targetUserObj.jmeno : 'Neznámý';

    if (confirm(`Opravdu chcete smazat tento docházkový záznam na období ${att.datum} - ${att.datum_do || att.datum}?`)) {
        // Refund vacation/NV credits on delete
        handleAttendanceCreditsDiff(att.user_id, att, null);

        state.attendance = state.attendance.filter(a => a.id !== id);
        saveData('crm_attendance', state.attendance);

        logAuditEvent('SMAZÁNÍ', 'Docházka', targetName, `Smazání docházky za období ${att.datum} - ${att.datum_do || att.datum} (Původní typ: ${att.typ})`);

        closeAllModals();
        renderAttendance();
    }
}

// Helper function to calculate credits changes when vacations or NV is spent/cancelled
function handleAttendanceCreditsDiff(userId, oldVal, newVal) {
    const userIndex = state.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const user = state.users[userIndex];

    // Helper to calculate total count of charged days
    function countDays(type, startStr, endStr) {
        if (!startStr) return 0;
        const start = new Date(startStr);
        const end = endStr ? new Date(endStr) : start;
        if (end < start) return 0;

        let daysCount = 0;
        let current = new Date(start);
        while (current <= end) {
            if (type === 'dovolená') {
                const day = current.getDay();
                if (day !== 0 && day !== 6) daysCount++;
            } else {
                daysCount++;
            }
            current.setDate(current.getDate() + 1);
        }
        return daysCount;
    }

    // 1. REFUND OLD VALUES
    if (oldVal) {
        if (oldVal.typ === 'dovolená') {
            const oldDays = countDays('dovolená', oldVal.datum, oldVal.datum_do || oldVal.datum);
            user.dny_dovolena = (user.dny_dovolena || 0) + oldDays; // Return vacation days
        } else if (oldVal.typ === 'náhradní volno' && oldVal.prichod && oldVal.odchod) {
            const arr = oldVal.prichod.split(':');
            const dep = oldVal.odchod.split(':');
            const diffHours = (parseInt(dep[0])*60 + parseInt(dep[1]) - (parseInt(arr[0])*60 + parseInt(arr[1]))) / 60;
            user.hod_nv = (user.hod_nv || 0) + Math.round(diffHours); // Return NV hours
        }
    }

    // 2. APPLY NEW VALUES
    if (newVal) {
        if (newVal.typ === 'dovolená') {
            const newDays = countDays('dovolená', newVal.datum, newVal.datum_do || newVal.datum);
            user.dny_dovolena = Math.max(0, (user.dny_dovolena || 0) - newDays); // Deduct vacation days
        } else if (newVal.typ === 'náhradní volno' && newVal.prichod && newVal.odchod) {
            const arr = newVal.prichod.split(':');
            const dep = newVal.odchod.split(':');
            const diffHours = (parseInt(dep[0])*60 + parseInt(dep[1]) - (parseInt(arr[0])*60 + parseInt(arr[1]))) / 60;
            user.hod_nv = Math.max(0, (user.hod_nv || 0) - Math.round(diffHours)); // Deduct NV hours
        }
    }

    state.users[userIndex] = user;
    saveData('crm_users', state.users);
    
    // Refresh user grid
    renderUsersTable();
}

function padNum(num) {
    return String(num).padStart(2, '0');
}
