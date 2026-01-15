const api = 'http://127.0.0.1:5000/';

window.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const rooms = await get('rooms');
        renderRooms(rooms);
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

    for (var i in rooms) {
        var room = rooms[i];
        var name = (room && room.name) ? room.name : (room.id || String(room));
        var div = document.createElement('div');
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
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
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

    // Vider le contenu précédent
    content.innerHTML = '';

    // Titre avec le nom de la salle
    const title = document.querySelector('.modal-content h3');
    title.textContent = roomData.name || 'Salle inconnue';

    // Ajouter la capacité
    if (roomData.capacity !== undefined) {
        const pCapacity = document.createElement('p');
        pCapacity.innerHTML = `<strong>Capacité:</strong> ${roomData.capacity}`;
        content.appendChild(pCapacity);
    }

    // Ajouter les features
    if (roomData.features && Array.isArray(roomData.features)) {
        const pFeatures = document.createElement('p');
        pFeatures.innerHTML = `<strong>Équipements:</strong> ${roomData.features.map(f => f.name || f.code).join(', ')}`;
        content.appendChild(pFeatures);
    }

    // Ajouter le statut d'ouverture avec un rond coloré
    if (roomData.is_open !== undefined) {
        const pStatus = document.createElement('p');
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'status-indicator ' + (roomData.is_open ? 'open' : 'closed');
        pStatus.innerHTML = `<strong>Statut:</strong> `;
        pStatus.appendChild(statusIndicator);
        pStatus.innerHTML += roomData.is_open ? ' Ouvert' : ' Fermé';
        content.appendChild(pStatus);
    }

    // Afficher la modale
    modal.style.display = 'block';
}

function closeRoomDetails() {
    const modal = document.getElementById('room-details-modal');
    modal.style.display = 'none';
}