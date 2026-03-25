# WEB

Single-page application using vanilla JavaScript with a REST API backend.

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Visualization**: SVG for interactive floor plans
- **Styling**: CSS Grid/Flexbox with responsive design
- **API**: REST client (fetch API) communicating with Flask backend
- **Hosting**: GitHub Pages

## Features
- Interactive SVG floor plans with real-time room highlighting
- Availability queries by date/time
- Dynamic filtering (building, floor, features)
- Full-text search with live results
- Responsive design

## Usage
1. Clone the repository
2. Update the API endpoint in `script.js` if needed (default: `http://127.0.0.1:5000/`)
3. Open `index.html` in a browser

**Live Version**: [https://llg-mapper.github.io/](https://llg-mapper.github.io/)

## Files Structure
- `index.html` - Main UI with SVG floor plans
- `script.js` - Application logic and API client
- `style.css` - Layout and component styling
- `tt.css` - Timetable styling