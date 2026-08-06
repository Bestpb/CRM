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
    "ADMIN": { name: "Administrátor", dashboard: true, uzivatele: true, klienti: true, pracovnici: true, kalendar: true, opravneni: true },
    "OBCHODNIK": { name: "Obchodní zástupce", dashboard: true, uzivatele: false, klienti: true, pracovnici: true, kalendar: true, opravneni: false },
    "ASISTENT": { name: "Asistent/ka", dashboard: true, uzivatele: false, klienti: true, pracovnici: true, kalendar: true, opravneni: false },
    "HOST": { name: "Host (Čtenář)", dashboard: true, uzivatele: false, klienti: true, pracovnici: false, kalendar: true, opravneni: false }
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
    datum_kon: formatDateStr(event3Date, 17, 0),
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
    datum_kon: formatDateStr(event4Date, 11, 30),
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
    }

    // Load data from LocalStorage to application state
    state.users = JSON.parse(localStorage.getItem('crm_users'));
    state.clients = JSON.parse(localStorage.getItem('crm_clients'));
    state.workers = JSON.parse(localStorage.getItem('crm_workers'));
    state.events = JSON.parse(localStorage.getItem('crm_events'));
    state.permissions = JSON.parse(localStorage.getItem('crm_permissions'));
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
        if (['dashboard', 'uzivatele', 'klienti', 'pracovnici', 'kalendar', 'opravneni'].includes(tab)) {
            switchTab(tab);
        }
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
        'opravneni': 'Přístupová Práva a Oprávnění'
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
        renderCalendar();
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
}

function checkSectionAccess(tabName) {
    const userRole = state.currentUser ? state.currentUser.kod_pristup : 'HOST';
    const rolePermissions = state.permissions[userRole];
    
    // If permission not set, default to false (secure by default)
    const allowed = rolePermissions ? rolePermissions[tabName] : false;
    
    // Hide/show navigation items based on permission to make UI cleaner
    state.users.forEach(() => {
        const navId = `nav-${tabName}`;
        const navEl = document.getElementById(navId);
        if (navEl) {
            if (allowed) {
                navEl.style.display = 'flex';
            } else {
                navEl.style.display = 'none';
            }
        }
    });

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
        });
    });
}

function renderPermissionCheckbox(role, section, val) {
    // Disable editing rights for HOST so we don't break simulation controls easily, and ADMIN must always access 'opravneni' to prevent lockouts
    const isDisabled = (role === 'ADMIN' && section === 'opravneni');
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
    document.getElementById('stat-events').textContent = state.events.filter(e => {
        // Active event means end date has not passed or it's scheduled
        const end = new Date(e.datum_kon);
        return end >= new Date();
    }).length;
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

        state.map = L.map('map').setView([49.8153, 15.4730], 7);
        
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

        // Custom HTML popup content
        const popupContent = `
            <div class="map-popup">
                <div class="map-popup-title">${client.nazev}</div>
                <div class="map-popup-text">${client.ulice}, ${client.mesto}</div>
                <div class="map-popup-text">Výroba: ${client.typ_vyroby}</div>
                ${workersHTML}
                <div style="margin-top: 10px; display: flex; gap: 6px;">
                    <button class="btn btn-primary btn-sm" onclick="appDirectLinkEvent('${client.id}', 'client')">+ Nová schůzka</button>
                    <button class="btn btn-secondary btn-sm" onclick="appDirectViewClient('${client.id}')">Zobrazit detail</button>
                </div>
            </div>
        `;
        
        const marker = L.marker([coords[0], coords[1]]).addTo(state.map);
        marker.bindPopup(popupContent);
        
        state.mapMarkers.push(marker);
    });
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
                <button class="btn btn-danger btn-sm btn-delete-user" data-id="${u.id}">Smazat</button>
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

    if (id) {
        // Edit mode
        const index = state.users.findIndex(u => u.id === id);
        if (index !== -1) {
            state.users[index] = { 
                ...state.users[index], 
                jmeno, zkratka, kod_pristup, nastup_datum, vystup_datum, datum_nar, heslo, dny_dovolena, hod_nv 
            };
        }
    } else {
        // Add mode
        const por_cislo = getNextPorCislo(state.users);
        const newId = String(por_cislo);
        state.users.push({
            id: newId, por_cislo, jmeno, zkratka, kod_pristup, nastup_datum, vystup_datum, datum_nar, heslo, dny_dovolena, hod_nv
        });
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
    if (confirm("Opravdu chcete smazat tohoto uživatele? Tato akce je nevratná.")) {
        state.users = state.users.filter(u => u.id !== userId);
        saveData('crm_users', state.users);
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
                <button class="btn btn-danger btn-sm btn-delete-client" data-id="${c.id}">Smazat</button>
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
        }
    } else {
        title.textContent = 'Nový Klient';
        document.getElementById('client-id').value = '';
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

    if (id) {
        const index = state.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            state.clients[index] = { 
                ...state.clients[index], 
                nazev, ulice, psc, mesto, okres, stat, velikost, typ_vyroby, souradnice, spv1, spv2, spv3 
            };
        }
    } else {
        const newId = getNextId('c', state.clients);
        state.clients.push({
            id: newId, nazev, ulice, psc, mesto, okres, stat, velikost, typ_vyroby, souradnice, spv1, spv2, spv3
        });
    }

    saveData('crm_clients', state.clients);
    closeAllModals();
    renderClientsTable();
    renderMapMarkers();
}

function deleteClient(clientId) {
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
        
        renderClientsTable();
        renderMapMarkers();
    }
}

// Simple Geocoding mockup for demonstration
document.getElementById('btn-geocode').addEventListener('click', () => {
    const ulice = document.getElementById('client-ulice').value;
    const mesto = document.getElementById('client-mesto').value;
    
    if (!ulice || !mesto) {
        alert("Prosím vyplňte ulici a město.");
        return;
    }

    // Mock coordinates generation centered around Czech cities so it falls onto the map nicely
    const citiesGps = {
        'praha': [50.0833, 14.4253],
        'brno': [49.1915, 16.6212],
        'plzeň': [49.7384, 13.3736],
        'liberec': [50.7512, 15.0298],
        'ostrava': [49.8209, 18.2625],
        'olomouc': [49.5937, 17.2508],
        'české budějovice': [48.9744, 14.4743]
    };

    const searchKey = mesto.trim().toLowerCase();
    let coords = citiesGps[searchKey];
    
    if (!coords) {
        // Random slight deviation from Prague center to simulate lookup success
        const randomLat = 49.8 + (Math.random() - 0.5) * 1.5;
        const randomLng = 14.5 + (Math.random() - 0.5) * 2.5;
        coords = [randomLat.toFixed(4), randomLng.toFixed(4)];
    }

    document.getElementById('client-souradnice').value = `${coords[0]}, ${coords[1]}`;
    alert(`GPS Souřadnice nalezeny: ${coords[0]}, ${coords[1]}`);
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
                <button class="btn btn-danger btn-sm btn-delete-worker" data-id="${w.id}">Smazat</button>
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

    if (id) {
        const index = state.workers.findIndex(w => w.id === id);
        if (index !== -1) {
            state.workers[index] = { 
                ...state.workers[index], 
                jmeno, klient_id, funkce, mobil, email, enews 
            };
        }
    } else {
        const newId = getNextId('w', state.workers);
        state.workers.push({
            id: newId, jmeno, klient_id, funkce, mobil, email, enews
        });
    }

    saveData('crm_workers', state.workers);
    closeAllModals();
    renderWorkersTable();
}

function deleteWorker(workerId) {
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
        if (filterType !== 'all' && e.typ !== filterType) return false;
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
        
        eventsHTML += `
            <div class="calendar-event ${e.typ === 'úkol' ? 'task-type' : 'meeting-type'} ${traceClass}" 
                 data-id="${e.id}" title="${e.nazev} (${e.uzivatel})">
                ${pad(new Date(e.datum_plan).getHours())}:${pad(new Date(e.datum_plan).getMinutes())} ${e.nazev}
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
    filterUserSelect.innerHTML = '<option value="all">Všichni uživatelé</option>';
    
    state.users.forEach(u => {
        const option = document.createElement('option');
        option.value = u.id;
        option.textContent = u.jmeno;
        filterUserSelect.appendChild(option);
    });
    filterUserSelect.value = val;
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
    banner.classList.add('hidden');
    banner.innerHTML = '';

    // Populate Users dropdown
    const userSelect = document.getElementById('event-uzivatel-id');
    userSelect.innerHTML = '';
    state.users.forEach(u => {
        const option = document.createElement('option');
        option.value = u.id;
        option.textContent = u.jmeno;
        userSelect.appendChild(option);
    });
    // Default to current simulated user
    userSelect.value = state.currentUser.id;

    // Populate Clients linking dropdown
    const clientSelect = document.getElementById('event-link-client');
    clientSelect.innerHTML = '<option value="">-- Nepropojovat s klientem --</option>';
    state.clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.nazev;
        clientSelect.appendChild(option);
    });

    // Populate Workers linking dropdown
    const workerSelect = document.getElementById('event-link-worker');
    workerSelect.innerHTML = '<option value="">-- Nepropojovat s pracovníkem --</option>';
    state.workers.forEach(w => {
        const client = state.clients.find(c => c.id === w.klient_id);
        const option = document.createElement('option');
        option.value = w.id;
        option.textContent = `${w.jmeno} (${client ? client.nazev : 'Bez firmy'})`;
        workerSelect.appendChild(option);
    });

    if (eventId) {
        // Edit mode
        title.textContent = 'Detail / Upravit Událost';
        deleteBtn.classList.remove('hidden');
        
        const event = state.events.find(e => e.id === eventId);
        if (event) {
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-nazev').value = event.nazev;
            document.getElementById('event-typ').value = event.typ;
            document.getElementById('event-uzivatel-id').value = event.uzivatel_id;
            document.getElementById('event-datum-plan').value = event.datum_plan;
            document.getElementById('event-datum-kon').value = event.datum_kon;
            document.getElementById('event-link-client').value = event.link_client_id;
            document.getElementById('event-link-worker').value = event.link_worker_id;
            document.getElementById('event-poznamka').value = event.poznámka;

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
            
            // Auto link first worker of client if available
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
            }
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
        document.getElementById('event-datum-kon').value = formatDateToISO(defaultEnd);
        
        // Save origin context on form dataset
        form.dataset.origin = origin;
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

    if (id) {
        // Edit mode
        const index = state.events.findIndex(e => e.id === id);
        if (index !== -1) {
            // Keep original origin if it exists
            const existingOrigin = state.events[index].origin || 'direct';
            
            state.events[index] = { 
                ...state.events[index], 
                nazev, typ, uzivatel_id, uzivatel, datum_plan, datum_kon, link_client_id, link_worker_id, poznámka,
                origin: existingOrigin
            };
        }
    } else {
        // Create mode
        const por_cislo = getNextPorCislo(state.events);
        const newId = getNextId('e', state.events);
        
        // Read origin context
        const origin = document.getElementById('form-event').dataset.origin || 'direct';

        state.events.push({
            id: newId, por_cislo, typ, datum_zal: formatDateToISO(new Date()), datum_plan, datum_kon, 
            nazev, poznámka, uzivatel_id, uzivatel, link_client_id, link_worker_id, origin
        });
    }

    saveData('crm_events', state.events);
    closeAllModals();
    renderCalendar();
    renderDashboard();
}

function deleteEventAction() {
    const id = document.getElementById('event-id').value;
    if (id && confirm("Opravdu chcete smazat tuto událost?")) {
        state.events = state.events.filter(e => e.id !== id);
        saveData('crm_events', state.events);
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
