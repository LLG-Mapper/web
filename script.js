const api = 'http://127.0.0.1:5000/';

let allRooms = [];
let allBuildings = [];
let allFeatures = [];
let currentFilters = {
    building: '',
    features: [],
    search: ''
};
let filteredRooms = [];
let filtersVisible = false;

let now = new Date();

window.addEventListener('DOMContentLoaded', init);

async function updateAll() {
    try {
        const [rooms, buildings, features] = await Promise.all([
            get('rooms', { availability_at: now.toISOString(), floor: selectedFloor }),
            get('buildings'),
            get('features')
        ]);
        allRooms = rooms.rooms || [];
        allBuildings = buildings || [];
        allFeatures = features || [];

        setupFilters();
        filteredRooms = allRooms.slice(); // Copie initiale
        renderRooms(filteredRooms);
        renderRoomPaths(filteredRooms);
        setupSearch();
        setupFiltersToggle();
    } catch (err) {
        console.error('Failed to load data:', err);
    }
}


let selectedFloor = 0;
const selector = document.getElementById('selector');

const floorPositions = {
    0: 81.74,
    1: 64.35,
    2: 46.96,
    3: 29.57,
    4: 12.17
};

function selectFloor(floor) {
    selectedFloor = floor;
    const buttons = document.querySelectorAll('.floor-button');
    buttons.forEach(button => {
        if (parseInt(button.dataset.floor) === floor) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });
    if (selector && floorPositions.hasOwnProperty(floor)) {
        selector.style.top = floorPositions[floor] + '%';
        selector.classList.add('visible');
    }
    updateAll();
}

async function updateCurrentTime() {
    now = new Date(`${date.value}T${time.value}`);
    console.log('Current time updated to:', now);
    updateAll();
}

async function init() {
    var time = document.getElementById('time');
    var date = document.getElementById('date');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    time.value = `${hours}:${minutes}`;
    date.value = now.toISOString().split('T')[0];

    selectFloor(selectedFloor);
    updateAll();
}

function renderRooms(rooms) {
    const container = document.getElementById('rooms-list');
    if (!container) return;
    container.innerHTML = '';
    if (!rooms || rooms.length === 0) {
        container.textContent = 'Aucune salle trouvée.';
        return;
    }
    for (let room of rooms) {
        const name = room && room.name ? room.name : (room.id || String(room));
        const div = document.createElement('div');
        div.className = 'room-item';
        div.dataset.roomId = room.id;
        div.textContent = name;
        div.onclick = () => clickHandler(room.id);
        container.appendChild(div);
    }
}

async function get(path = '', params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = api + path + (queryString ? '?' + queryString : '');
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
    return await response.json();
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        applyFilters(); // Re-appliquer les filtres avec la recherche
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const searchQuery = searchInput.value.trim().toLowerCase();
            if (searchQuery) {
                // Trouver les salles qui correspondent exactement au nom ou à l'ID
                const exactMatches = allRooms.filter(room => {
                    const roomName = room.name ? room.name.toLowerCase() : '';
                    const roomId = String(room.id).toLowerCase();
                    return roomName === searchQuery || roomId === searchQuery;
                });
                if (exactMatches.length === 1) {
                    clickHandler(exactMatches[0].id);
                } else if (exactMatches.length > 1) {
                    // Si plusieurs correspondances, afficher la première
                    clickHandler(exactMatches[0].id);
                } else {
                    // Si aucune correspondance exacte, chercher dans les résultats filtrés
                    const filteredMatches = filteredRooms.filter(room => {
                        const roomName = room.name ? room.name.toLowerCase() : '';
                        const roomId = String(room.id).toLowerCase();
                        return roomName.includes(searchQuery) || roomId.includes(searchQuery);
                    });
                    if (filteredMatches.length > 0) {
                        clickHandler(filteredMatches[0].id);
                    }
                }
            }
        }
    });
}

function setupFiltersToggle() {
    const toggleButton = document.getElementById('filters-toggle');
    if (!toggleButton) return;

    toggleButton.addEventListener('click', () => {
        const filtersContainer = document.getElementById('filters-container');
        filtersVisible = !filtersVisible;
        filtersContainer.style.display = filtersVisible ? 'block' : 'none';
        toggleButton.textContent = filtersVisible ? 'Filtres ▲' : 'Filtres ▼';
    });
}

function setupFilters() {
    // Building filter
    const buildingSelect = document.getElementById('building-filter');
    allBuildings.forEach(building => {
        const option = document.createElement('option');
        option.value = building.id;
        option.textContent = building.name;
        buildingSelect.appendChild(option);
    });

    // Features checkboxes
    const featuresContainer = document.getElementById('features-checkboxes');
    allFeatures.forEach(feature => {
        const label = document.createElement('label');
        label.className = 'feature-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = feature.code;
        checkbox.dataset.featureId = feature.id;
        checkbox.addEventListener('change', applyFilters); // Ajouter directement sur la checkbox

        const span = document.createElement('span');
        span.textContent = feature.name;

        label.appendChild(checkbox);
        label.appendChild(span);
        featuresContainer.appendChild(label);
    });

    // Event listeners for filters
    buildingSelect.addEventListener('change', applyFilters);

    // Reset button
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }
}

function resetFilters() {
    // Reset building filter
    document.getElementById('building-filter').value = '';

    // Reset features checkboxes
    document.querySelectorAll('#features-checkboxes input:checked').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Reset search
    document.getElementById('search-input').value = '';

    // Reset current filters
    currentFilters = {
        building: '',
        features: [],
        search: ''
    };

    // Re-apply filters (which will show all rooms)
    applyFilters();
}

function applyFilters() {
    const buildingFilter = document.getElementById('building-filter').value;
    const selectedFeatures = Array.from(document.querySelectorAll('#features-checkboxes input:checked')).map(cb => cb.value);
    const searchQuery = document.getElementById('search-input').value.trim().toLowerCase();

    currentFilters.building = buildingFilter;
    currentFilters.features = selectedFeatures;
    currentFilters.search = searchQuery;

    filteredRooms = allRooms.filter(room => {
        // Search filter
        if (searchQuery) {
            const roomName = room.name ? room.name.toLowerCase() : '';
            const roomId = String(room.id).toLowerCase();
            if (!roomName.includes(searchQuery) && !roomId.includes(searchQuery)) return false;
        }

        // Building filter
        if (buildingFilter && room.building && room.building.id != buildingFilter) return false;

        // Features filter
        if (selectedFeatures.length > 0) {
            const roomFeatures = room.features ? room.features.map(f => f.code) : [];
            if (!selectedFeatures.every(feature => roomFeatures.includes(feature))) return false;
        }

        return true;
    });

    renderRooms(filteredRooms);
    renderRoomPaths(filteredRooms);
}

async function clickHandler(id) {
    try {
        const roomData = await get('rooms/' + id);
        showRoomDetails(roomData);
    } catch (err) {
        console.error('Failed to load room details:', err);
        alert('Erreur lors du chargement des informations de la salle.');
    }
}

function showRoomDetails(roomData) {
    // Masquer la liste, la recherche et les filtres
    document.getElementById('rooms-list').style.display = 'none';
    document.getElementById('search-container').style.display = 'none';
    document.getElementById('filters-container').style.display = 'none';

    // Afficher les détails
    const detailsContainer = document.getElementById('room-details');
    detailsContainer.style.display = 'block';

    // Changer le titre et afficher le bouton retour
    document.getElementById('sidebar-title').textContent = roomData.name || 'Salle inconnue';
    document.getElementById('back-button').style.display = 'block';

    // Générer le contenu des détails
    detailsContainer.innerHTML = '';
    const title = document.createElement('h3');
    title.textContent = roomData.name || 'Salle inconnue';
    detailsContainer.appendChild(title);

    const pCapacity = document.createElement('p');
    pCapacity.innerHTML = `<strong>Capacité:</strong> ${roomData.capacity ?? 'N/A'}`;
    detailsContainer.appendChild(pCapacity);

    const pFeatures = document.createElement('p');
    pFeatures.innerHTML = `<strong>Équipements:</strong> ${roomData.features && Array.isArray(roomData.features) ? roomData.features.map(f => f.name || f.code).join(', ') : 'Aucun'}`;
    detailsContainer.appendChild(pFeatures);

    const pStatus = document.createElement('p');
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator ' + (roomData.is_open ? 'open' : 'closed');
    pStatus.innerHTML = `<strong>Statut:</strong> `;
    pStatus.appendChild(statusIndicator);
    pStatus.innerHTML += roomData.is_open ? ' Ouvert' : ' Fermé';
    detailsContainer.appendChild(pStatus);

    get('classes', { room: roomData.id }).then(classesData => {
        console.log('Classes associées à la salle:', classesData);
        renderTimetable(detailsContainer, classesData);
    }).catch(err => {
        console.error('Erreur lors du chargement des classes associées:', err);
    });
}

function showRoomList() {
    // Masquer les détails
    document.getElementById('room-details').style.display = 'none';

    // Afficher la liste, la recherche et les filtres si ils étaient visibles
    document.getElementById('rooms-list').style.display = 'block';
    document.getElementById('search-container').style.display = 'block';
    if (filtersVisible) {
        document.getElementById('filters-container').style.display = 'block';
    }

    // Remettre le titre et masquer le bouton retour
    document.getElementById('sidebar-title').textContent = 'Rooms';
    document.getElementById('back-button').style.display = 'none';
}

function closeRoomDetails() {
    // Cette fonction n'est plus nécessaire, mais gardée pour compatibilité
    showRoomList();
}

// -------------------------
// SVG room path rendering
// -------------------------
function clearRoomPaths() {
    const svg = document.querySelector('.main-svg-container svg.main-background');
    if (!svg) return;
    const existing = svg.querySelector('#rooms-overlay-group');
    if (existing) existing.remove();
}

function renderRoomPaths(rooms) {
    const svg = document.querySelector('.main-svg-container svg.main-background');
    if (!svg) return;

    // Remove previous overlays
    clearRoomPaths();

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', 'rooms-overlay-group');
    svg.appendChild(group);

    if (!rooms || rooms.length === 0) return;

    for (const room of rooms) {
        if (!room || !room.path) continue;
        try {
            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathEl.setAttribute('d', room.path);
            pathEl.classList.add('room-overlay');
            if (room.id) pathEl.dataset.roomId = room.id;
            if (room.name) pathEl.dataset.roomName = room.name;

            pathEl.style.fill = 'rgba(0, 255, 0, 1)';
            if (!room.is_open) pathEl.style.fill = 'rgb(150, 0, 0)';
            if (!room.is_available) pathEl.style.fill = 'rgba(255, 0, 0, 1)';

            // click -> show details
            pathEl.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const id = pathEl.dataset.roomId || room.id;
                if (id) clickHandler(id);
            });

            // hover cue
            pathEl.addEventListener('mouseenter', () => {
                pathEl.classList.add('hover');
            });
            pathEl.addEventListener('mouseleave', () => {
                pathEl.classList.remove('hover');
            });

            group.appendChild(pathEl);
        } catch (e) {
            console.warn('Failed to render room path', room, e);
        }
    }
}

// -------------------------
//  renderTimetable(detailsContainer, classesData)
// -------------------------

const DAY_START = 8;
const DAY_END = 19;
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CONTAINER_H = 300;
const TIME_COL_W = 36;
const HEADER_H = 24;
const BODY_H = CONTAINER_H - HEADER_H;
const PX_PER_MIN = BODY_H / ((DAY_END - DAY_START) * 60); // ~0.418

const COLORS = {
    Mathematics: "#4f86c6", Physics: "#e07b54", Literature: "#6abf69",
    History: "#b97bb0", Chemistry: "#d4a017", Geography: "#5bbcb8",
    Art: "#e06090", Biology: "#4a90d9", Music: "#9b6dd6",
    Sport: "#4caf72",
};

function toMins(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function fmt(t) {
    const [h, m] = t.split(":");
    return `${h}:${m}`;
}

function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
}

function renderTimetable(detailsContainer, classesData) {

    // time column
    const timeCol = el("div", "tt-time-col");
    for (let h = DAY_START; h < DAY_END; h++) {
        const slot = el("div", "tt-time-slot");
        slot.textContent = `${String(h).padStart(2, "0")}h`;
        timeCol.appendChild(slot);
    }

    // day columns
    const daysArea = el("div", "tt-days");

    DAYS.forEach((name, idx) => {
        const col = el("div", "tt-day-col");
        const header = el("div", "tt-day-header");
        header.textContent = name.slice(0, 3); // Mon, Tue…
        col.appendChild(header);

        const body = el("div", "tt-day-body");

        // hour lines
        for (let h = 0; h <= DAY_END - DAY_START; h++) {
            const line = el("div", "tt-hour-line");
            line.style.top = `${Math.round(h * 60 * PX_PER_MIN)}px`;
            body.appendChild(line);
        }

        // events
        classesData
            .filter(e => e.weekday === idx)
            .forEach(ev => {
                const top = Math.round((toMins(ev.start_time) - DAY_START * 60) * PX_PER_MIN);
                const height = Math.max(Math.round((toMins(ev.end_time) - toMins(ev.start_time)) * PX_PER_MIN) - 2, 8);

                const block = el("div", "tt-event");
                block.style.top = `${top}px`;
                block.style.height = `${height}px`;
                block.style.background = COLORS[ev.label] || "#888";

                const nameEl = el("span", "tt-event-name");
                nameEl.textContent = ev.label;
                block.appendChild(nameEl);

                // only show time if block is tall enough
                if (height >= 18) {
                    const timeEl = el("span", "tt-event-time");
                    timeEl.textContent = `${fmt(ev.start_time)} – ${fmt(ev.end_time)}`;
                    block.appendChild(timeEl);
                }

                body.appendChild(block);
            });

        col.appendChild(body);
        daysArea.appendChild(col);
    });

    const grid = el("div", "tt-grid");
    grid.appendChild(timeCol);
    grid.appendChild(daysArea);

    const wrap = el("div", "tt-wrap");
    wrap.appendChild(grid);

    detailsContainer.appendChild(wrap);
}