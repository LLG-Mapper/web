function randomInt() {
    return Math.random();
}
const api = 'http://127.0.0.1:5000/';

let allRooms = [];
let allBuildings = [];
let allFeatures = [];
let currentFilters = {
    building: '',
    floor: '',
    features: [],
    search: ''
};
let filteredRooms = [];
let filtersVisible = false;

window.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const [rooms, buildings, features] = await Promise.all([
            get('rooms'),
            get('buildings'),
            get('features')
        ]);
        allRooms = rooms || [];
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
    const url = api + path;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        ...params
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
    
    // Floor filter - extraire les étages uniques des salles
    const floorSelect = document.getElementById('floor-filter');
    const floors = [...new Set(allRooms.map(room => room.floor))].sort();
    floors.forEach(floor => {
        const option = document.createElement('option');
        option.value = floor;
        option.textContent = `Étage ${floor}`;
        floorSelect.appendChild(option);
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
    floorSelect.addEventListener('change', applyFilters);
    
    // Reset button
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }
}

function resetFilters() {
    // Reset building filter
    document.getElementById('building-filter').value = '';
    
    // Reset floor filter
    document.getElementById('floor-filter').value = '';
    
    // Reset features checkboxes
    document.querySelectorAll('#features-checkboxes input:checked').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset search
    document.getElementById('search-input').value = '';
    
    // Reset current filters
    currentFilters = {
        building: '',
        floor: '',
        features: [],
        search: ''
    };
    
    // Re-apply filters (which will show all rooms)
    applyFilters();
}

function applyFilters() {
    const buildingFilter = document.getElementById('building-filter').value;
    const floorFilter = document.getElementById('floor-filter').value;
    const selectedFeatures = Array.from(document.querySelectorAll('#features-checkboxes input:checked')).map(cb => cb.value);
    const searchQuery = document.getElementById('search-input').value.trim().toLowerCase();
    
    currentFilters.building = buildingFilter;
    currentFilters.floor = floorFilter;
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
        
        // Floor filter
        if (floorFilter && room.floor != floorFilter) return false;
        
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
            pathEl.style.fill = 'rgba(0, 255, 0, 0.5)';
            if (randomInt() > 0.8) pathEl.style.fill = 'rgba(255, 0, 0, 0.5)'; // Couleur de surbrillance

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