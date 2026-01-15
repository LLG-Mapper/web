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
