# Quiz Application

Quiz Application is a modern quiz platform built with HTML, CSS, and Vanilla JavaScript.
It includes a separate landing/login experience, a dashboard-style quiz workspace, dynamic
question loading, timers, lifelines, leaderboard tracking, bookmarks, analytics, and
certificate generation.

## Features

- Username-based login using `localStorage`
- Separate front page and quiz dashboard
- Multiple quiz categories and difficulty levels
- Dynamic question loading from JSON
- Randomized questions and options
- 30-second timer with auto-submit
- Lifelines: `50-50`, `Skip Question`, `Extra Time`
- Score tracking with bonus points
- Review mode with explanations
- Local leaderboard
- Bookmarks and retry-incorrect flow
- Chart.js analytics
- PDF certificate download
- Light mode and dark mode

## Project Structure

```text
project 1/
|-- .gitignore
|-- index.html
|-- login.html
|-- README.md
|-- vercel.json
|-- scripts/
|   |-- serve.bat
|   `-- serve.ps1
`-- src/
    |-- data/
    |   `-- questions.json
    |-- scripts/
    |   |-- app.js
    |   |-- login.js
    |   `-- questions.js
    `-- styles/
        `-- style.css
```

### Structure Overview

- `login.html` - public front page and username login flow
- `index.html` - main quiz dashboard and results workspace
- `src/data/questions.json` - question bank used by the quiz engine
- `src/scripts/app.js` - quiz engine, dashboard logic, leaderboard, analytics, certificate flow
- `src/scripts/login.js` - landing page interactions and login handling
- `src/scripts/questions.js` - question loading, filtering, shuffling, and session preparation helpers
- `src/styles/style.css` - full UI styling for landing page and quiz dashboard
- `scripts/serve.ps1` - PowerShell local server runner
- `scripts/serve.bat` - batch file local server runner
- `vercel.json` - Vercel deployment configuration
- `.gitignore` - Git ignore rules for local-only files

## How To Run

### Option 1: PowerShell script

```powershell
cd "D:\github\project 1"
.\scripts\serve.ps1
```

### Option 2: Batch file

```powershell
.\scripts\serve.bat
```

### Option 3: Manual Python server

```powershell
cd "D:\github\project 1"
python -m http.server 8090
```

Open in browser:

```text
http://127.0.0.1:8090/login.html
```

You can also open the dashboard directly:

```text
http://127.0.0.1:8090/index.html
```

## Usage Flow

1. Open `login.html`
2. Enter any username
3. Continue to the dashboard
4. Select categories, difficulty, and question count
5. Start the quiz
6. Review results, analytics, bookmarks, and leaderboard

## Data Storage

This project uses browser `localStorage` for:

- Current logged-in user
- User profiles
- Score history
- Bookmarks
- Leaderboard data
- Theme preference

## Notes

- Do not open the project using `file://`
- Use a local server so `src/data/questions.json` can load correctly
- Internet may be needed for CDN-loaded libraries such as Chart.js and jsPDF

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js
- jsPDF

## License

This project is for learning and personal project use.
