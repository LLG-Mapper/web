base = 'http://127.0.0.1:5000/'

window.addEventListener('DOMContentLoaded', init);

function init() {
    document.getElementById('getBtn').addEventListener('click', getHandler);
}

async function getHandler(event) {
    event.preventDefault();
    console.log('Button clicked');
        try {
            const data = await get(document.getElementById('path').value);
            print(data);
        } catch (error) {
            print(error, true);
        }
}

async function get(path) {
    const url = base + path;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return await response.json();
}

function print(data, error = false) {
    const pre = document.getElementById('output');
    pre.style.color = 'black';
    pre.textContent = JSON.stringify(data, null, 2);
    if (error) {
        pre.style.color = 'red';
    }
}