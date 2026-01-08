api = 'http://127.0.0.1:5000/'

window.addEventListener('DOMContentLoaded', init);

function init() {
    // When the page loads
    console.log(get('rooms')); // get the list of rooms in json
}

async function get(path) {
    const url = api + path;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}