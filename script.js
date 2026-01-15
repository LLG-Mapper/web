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
    // Supprimer l'encadré existant s'il y en a un
    const existingModal = document.getElementById('room-details-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Créer l'encadré
    const modal = document.createElement('div');
    modal.id = 'room-details-modal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = 'white';
    modal.style.border = '1px solid #ccc';
    modal.style.padding = '20px';
    modal.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    modal.style.zIndex = '1000';
    modal.style.maxWidth = '400px';
    modal.style.borderRadius = '8px';

    // Contenu
    let content = '<h3>Détails de la salle</h3>';
    for (const [key, value] of Object.entries(roomData)) {
        if (key === 'classes' && Array.isArray(value)) {
            content += `<p><strong>${key}:</strong> ${value.map(c => c.name || c.id).join(', ')}</p>`;
        } else if (key === 'features' && Array.isArray(value)) {
            content += `<p><strong>${key}:</strong> ${value.map(f => f.name || f.code).join(', ')}</p>`;
        } else {
            content += `<p><strong>${key}:</strong> ${value}</p>`;
        }
    }
    content += '<button onclick="closeRoomDetails()">Fermer</button>';

    modal.innerHTML = content;

    // Ajouter au body
    document.body.appendChild(modal);

    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeRoomDetails();
        }
    });
}

function closeRoomDetails() {
    const modal = document.getElementById('room-details-modal');
    if (modal) {
        modal.remove();
    }
}
