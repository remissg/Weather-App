# Weather App Setup Guide

## 🌤️ Secure API Key Configuration

This Weather App now uses a **Node.js server** to keep your OpenWeatherMap API key secure and hidden from GitHub.

## 📋 Prerequisites

- Node.js installed (v14 or higher)
- npm (comes with Node.js)
- OpenWeatherMap API key ([Get one here](https://openweathermap.org/api))

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your OpenWeatherMap API key:
   ```
   OPENWEATHER_API_KEY=your_actual_api_key_here
   PORT=3000
   ```

### 3. Run the Server

```bash
npm start
```

The server will start at `http://localhost:3000`

### 4. Open the App

Open your browser and navigate to:
```
http://localhost:3000
```

## 🔧 Development Mode

For auto-restart on file changes:

```bash
npm run dev
```

## 📁 Project Structure

```
Weather App/
├── server.js          # Express server with API endpoints
├── script.js          # Frontend JavaScript (API calls now go through server)
├── index.html         # Main HTML file
├── style.css          # Styles
├── package.json       # Dependencies
├── .env              # Environment variables (NOT committed to Git)
├── .env.example      # Template for environment variables (safe to commit)
└── .gitignore        # Prevents .env from being committed
```

## 🔒 Security Features

✅ **API key hidden in `.env` file** - Never committed to GitHub  
✅ **`.gitignore` configured** - Prevents sensitive files from being tracked  
✅ **Server-side API calls** - API key never exposed to browser  
✅ **`.env.example` template** - Helps other developers set up their environment

## 🌐 API Endpoints

The server provides the following endpoints:

- `GET /api/weather?city={cityName}` - Get weather by city name
- `GET /api/weather?lat={lat}&lon={lon}` - Get weather by coordinates
- `GET /api/forecast?lat={lat}&lon={lon}` - Get 5-day forecast
- `GET /api/air-pollution?lat={lat}&lon={lon}` - Get air quality data
- `GET /api/onecall?lat={lat}&lon={lon}` - Get UV index and other data
- `GET /api/health` - Server health check

## 🐙 Git Workflow

### Initial Commit

```bash
git add .
git commit -m "Add Weather App with secure API key handling"
git push
```

**Note:** The `.env` file is automatically excluded from Git commits due to `.gitignore`.

### For Other Developers

When someone clones your repository, they should:

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Add their own OpenWeatherMap API key to `.env`
4. Run `npm start`

## ❓ Troubleshooting

### Port Already in Use

If port 3000 is already in use, change the `PORT` in `.env`:

```
PORT=3001
```

### API Key Not Working

- Ensure your API key is valid and active
- Check that `.env` file is in the root directory
- Restart the server after changing `.env`

### Module Not Found Errors

Run `npm install` again to ensure all dependencies are installed.

## 📝 License

ISC
