const api = 'http://127.0.0.1:5000/';

let allRooms = [];
let currentSuggestions = [];
let suggestionIndex = -1;

window.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const rooms = await get('rooms');
        allRooms = rooms || [];
        renderRooms(allRooms);
        setupSearch();
    } catch (err) {
        console.error('Failed to load rooms:', err);
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

async function get(path) {
    const url = api + path;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
    return await response.json();
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const suggestionsEl = document.getElementById('suggestions');
    if (!searchInput || !suggestionsEl) return;

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) return clearSuggestions();
        const matches = allRooms.filter(r => (r.name && r.name.toLowerCase().includes(q)) || (String(r.id).toLowerCase().includes(q)));
        currentSuggestions = matches.slice(0, 6);
        suggestionIndex = -1;
        renderSuggestions();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (!currentSuggestions.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            suggestionIndex = Math.min(suggestionIndex + 1, currentSuggestions.length - 1);
            renderSuggestions();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            suggestionIndex = Math.max(suggestionIndex - 1, 0);
            renderSuggestions();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const sel = currentSuggestions[suggestionIndex >= 0 ? suggestionIndex : 0];
            if (sel) selectSuggestion(sel);
        } else if (e.key === 'Escape') {
            clearSuggestions();
        }
    });

    document.addEventListener('click', (ev) => {
        if (!searchInput.contains(ev.target) && !suggestionsEl.contains(ev.target)) clearSuggestions();
    });
}

function renderSuggestions() {
    const suggestionsEl = document.getElementById('suggestions');
    suggestionsEl.innerHTML = '';
    if (!currentSuggestions.length) return;
    currentSuggestions.forEach((room, idx) => {
        const div = document.createElement('div');
        div.className = 'suggestion-item' + (idx === suggestionIndex ? ' active' : '');
        const name = room && room.name ? room.name : (room.id || String(room));
        div.textContent = name;
        div.dataset.roomId = room.id;
        div.addEventListener('click', () => selectSuggestion(room));
        suggestionsEl.appendChild(div);
    });
}

function clearSuggestions() {
    currentSuggestions = [];
    suggestionIndex = -1;
    const suggestionsEl = document.getElementById('suggestions');
    if (suggestionsEl) suggestionsEl.innerHTML = '';
}

function selectSuggestion(room) {
    const searchInput = document.getElementById('search-input');
    searchInput.value = room && room.name ? room.name : (room.id || '');
    clearSuggestions();
    clickHandler(room.id);
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
    const modal = document.getElementById('room-details-modal');
    const content = document.getElementById('room-details-content');
    content.innerHTML = '';
    const title = document.querySelector('.modal-content h3');
    title.textContent = (roomData && roomData.name) ? roomData.name : 'Salle inconnue';
    const pCapacity = document.createElement('p');
    pCapacity.innerHTML = `<strong>Capacité:</strong> ${roomData.capacity ?? 'N/A'}`;
    content.appendChild(pCapacity);
    const pFeatures = document.createElement('p');
    pFeatures.innerHTML = `<strong>Équipements:</strong> ${roomData.features && Array.isArray(roomData.features) ? roomData.features.map(f => f.name || f.code).join(', ') : 'Aucun'}`;
    content.appendChild(pFeatures);
    const pStatus = document.createElement('p');
    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator ' + (roomData.is_open ? 'open' : 'closed');
    pStatus.innerHTML = `<strong>Statut:</strong> `;
    pStatus.appendChild(statusIndicator);
    pStatus.innerHTML += roomData.is_open ? ' Ouvert' : ' Fermé';
    content.appendChild(pStatus);
    modal.style.display = 'block';
}

function closeRoomDetails() {
    const modal = document.getElementById('room-details-modal');
    modal.style.display = 'none';
}