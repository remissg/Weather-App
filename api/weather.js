const fetch = require('node-fetch');

// Get API key from environment variables
const API_KEY = process.env.OPENWEATHER_API_KEY;

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { city, lat, lon } = req.query;

        let url;
        if (city) {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
        } else if (lat && lon) {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        } else {
            return res.status(400).json({ error: 'Please provide city name or coordinates' });
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
};
