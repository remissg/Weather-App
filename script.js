// API configuration - now using local server
const API_BASE_URL = window.location.origin; // Use same origin as the page
const USE_LOCAL_SERVER = true; // Set to false for direct API calls (not recommended)

let isCelsius = true;
let currentData = null;
let currentChartType = 'temperature';
let hourlyData = null;

// DOM Elements
const cityInput = document.getElementById("cityInput");
const currentWeather = document.getElementById("currentWeather");
const forecastEl = document.getElementById("forecast");
const searchHistory = document.getElementById("searchHistory");
const savedLocationsEl = document.getElementById("savedLocations");
const environmentalInfo = document.getElementById("environmentalInfo");
const sunInfo = document.getElementById("sunInfo");

// Local Storage Keys
const STORAGE_KEYS = {
    theme: 'weather_theme',
    unit: 'weather_unit',
    lastCity: 'weather_last_city',
    searchHistory: 'weather_search_history',
    savedLocations: 'weather_saved_locations'
};

// Initialize App
window.addEventListener("load", () => {
    loadPreferences();
    initParticleEffect();
    loadSavedLocations();

    const lastCity = localStorage.getItem(STORAGE_KEYS.lastCity) || "London";
    getWeatherByCity(lastCity);
});

// Event Listeners
document.getElementById("searchBtn").onclick = () => getWeatherByCity(cityInput.value);
document.getElementById("locationBtn").onclick = getLocationWeather;
document.getElementById("toggleTheme").onclick = toggleTheme;
document.getElementById("toggleUnit").onclick = toggleUnit;
document.getElementById("voiceBtn").onclick = startVoiceSearch;
document.getElementById("compareBtn").onclick = showComparison;
document.getElementById("closeComparison").onclick = hideComparison;

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        getWeatherByCity(cityInput.value);
    }
});

cityInput.addEventListener("focus", () => {
    showSearchHistory();
});

cityInput.addEventListener("blur", () => {
    setTimeout(() => hideSearchHistory(), 200);
});

// Chart type selector
document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentChartType = e.currentTarget.dataset.type;
        if (hourlyData) {
            updateChart(hourlyData);
        }
    });
});

// View type selector (chart vs cards)
document.querySelectorAll('.view-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.view-type-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const viewType = e.currentTarget.dataset.view;

        const chartContainer = document.getElementById('chartContainer');
        const cardsContainer = document.getElementById('hourlyCardsContainer');

        if (viewType === 'chart') {
            chartContainer.style.display = 'block';
            cardsContainer.style.display = 'none';
        } else {
            chartContainer.style.display = 'none';
            cardsContainer.style.display = 'grid';
            if (hourlyData) {
                displayHourlyCards(hourlyData);
            }
        }
    });
});

// Load Preferences
function loadPreferences() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const savedUnit = localStorage.getItem(STORAGE_KEYS.unit);

    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.querySelector("#toggleTheme i").className = "fa-solid fa-sun";
    }

    if (savedUnit === 'fahrenheit') {
        isCelsius = false;
        document.getElementById("toggleUnit").innerText = "°C";
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark");
    const icon = document.querySelector("#toggleTheme i");
    const isDark = document.body.classList.contains("dark");
    icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";

    localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');

    // Update chart colors
    if (hourlyData) {
        updateChart(hourlyData);
    }
}

function toggleUnit() {
    isCelsius = !isCelsius;
    document.getElementById("toggleUnit").innerText = isCelsius ? "°F" : "°C";
    localStorage.setItem(STORAGE_KEYS.unit, isCelsius ? 'celsius' : 'fahrenheit');

    if (currentData) {
        displayCurrent(currentData);
        if (currentData.coord) {
            getForecast(currentData.coord.lat, currentData.coord.lon);
        }
    }

    if (hourlyData) {
        updateChart(hourlyData);
    }

    updateSavedLocationsDisplay();
}

async function getWeatherByCity(city) {
    if (!city) {
        showError("Please enter a city name");
        return;
    }

    showLoading();
    try {
        const url = `${API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`;
        const data = await fetchData(url);
        currentData = data;

        displayCurrent(data);
        getForecast(data.coord.lat, data.coord.lon);
        getHourly(data.coord.lat, data.coord.lon);
        getAirQuality(data.coord.lat, data.coord.lon);
        displaySunInfo(data);
        getWeatherAlerts(data.coord.lat, data.coord.lon);

        addToSearchHistory(data.name);
        localStorage.setItem(STORAGE_KEYS.lastCity, data.name);
        cityInput.value = "";
    } catch (error) {
        showError("City not found. Please try again.");
    }
}

function getLocationWeather() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser");
        return;
    }

    showLoading();
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                const url = `${API_BASE_URL}/api/weather?lat=${latitude}&lon=${longitude}`;
                const data = await fetchData(url);
                currentData = data;

                displayCurrent(data);
                getForecast(latitude, longitude);
                getHourly(latitude, longitude);
                getAirQuality(latitude, longitude);
                displaySunInfo(data);
                getWeatherAlerts(latitude, longitude);

                addToSearchHistory(data.name);
                localStorage.setItem(STORAGE_KEYS.lastCity, data.name);
            } catch (error) {
                showError("Unable to fetch weather for your location");
            }
        },
        () => {
            showError("Unable to retrieve your location");
        }
    );
}

async function getForecast(lat, lon) {
    try {
        const url = `${API_BASE_URL}/api/forecast?lat=${lat}&lon=${lon}`;
        const data = await fetchData(url);

        forecastEl.innerHTML = "";

        // Group forecast data by day
        const dailyData = {};

        data.list.forEach(item => {
            const date = new Date(item.dt_txt);
            const dateKey = date.toDateString();

            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    date: date,
                    temps: [],
                    weather: item.weather[0],
                    dt_txt: item.dt_txt
                };
            }
            dailyData[dateKey].temps.push(item.main.temp);
        });

        // Convert to array and get up to 5 days
        const days = Object.values(dailyData).slice(0, 5);

        days.forEach(day => {
            const maxTemp = Math.max(...day.temps);
            const minTemp = Math.min(...day.temps);
            const avgTemp = day.temps.reduce((a, b) => a + b, 0) / day.temps.length;

            forecastEl.innerHTML += `
                <div class="day" tabindex="0" role="article" aria-label="Weather forecast for ${day.date.toLocaleDateString("en-US", { weekday: "long" })}: ${convertTemp(avgTemp)} degrees">
                    <p class="day-name">${day.date.toLocaleDateString("en-US", { weekday: "short" })}</p>
                    <img src="https://openweathermap.org/img/wn/${day.weather.icon}@2x.png" alt="${day.weather.description}" loading="lazy">
                    <p class="day-temp">${convertTemp(avgTemp)}°</p>
                    <p class="day-desc">${day.weather.main}</p>
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 5px;">
                        H: ${convertTemp(maxTemp)}° L: ${convertTemp(minTemp)}°
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error fetching forecast:", error);
    }
}

function displayCurrent(data) {
    const feelsLike = convertTemp(data.main.feels_like);
    const pressure = data.main.pressure;
    const visibility = (data.visibility / 1000).toFixed(1);
    const dewPoint = calculateDewPoint(data.main.temp, data.main.humidity);

    currentWeather.innerHTML = `
        <div class="location-info">
            <h2><i class="fa-solid fa-location-dot"></i> ${data.name}, ${data.sys.country}</h2>
            <p class="date">${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    })}</p>
            <button class="share-btn" onclick="shareWeather()">
                <i class="fa-solid fa-share-nodes"></i> Share Weather
            </button>
        </div>
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png" alt="${data.weather[0].description}">
        <div class="temp">${convertTemp(data.main.temp)}°</div>
        <div class="description">${data.weather[0].description}</div>
        <div class="hi-low">H: ${convertTemp(data.main.temp_max)}° L: ${convertTemp(data.main.temp_min)}°</div>
        
        <div class="weather-details">
            <div class="detail-item">
                <i class="fa-solid fa-temperature-half"></i>
                <div>
                    <p class="detail-label">Feels Like</p>
                    <p class="detail-value">${feelsLike}°</p>
                </div>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-droplet"></i>
                <div>
                    <p class="detail-label">Humidity</p>
                    <p class="detail-value">${data.main.humidity}%</p>
                </div>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-wind"></i>
                <div>
                    <p class="detail-label">Wind Speed</p>
                    <p class="detail-value">${data.wind.speed} m/s</p>
                </div>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-gauge"></i>
                <div>
                    <p class="detail-label">Pressure</p>
                    <p class="detail-value">${pressure} hPa</p>
                </div>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-eye"></i>
                <div>
                    <p class="detail-label">Visibility</p>
                    <p class="detail-value">${visibility} km</p>
                </div>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-compass"></i>
                <div>
                    <p class="detail-label">Wind Direction</p>
                    <p class="detail-value">${data.wind.deg}°</p>
                </div>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-cloud"></i>
                <div>
                    <p class="detail-label">Cloudiness</p>
                    <p class="detail-value">${data.clouds.all}%</p>
                </div>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-water"></i>
                <div>
                    <p class="detail-label">Dew Point</p>
                    <p class="detail-value">${convertTemp(dewPoint)}°</p>
                </div>
            </div>
        </div>
    `;

    setWeatherBackground(data.weather[0].main.toLowerCase());
    updateParticles(data.weather[0].main.toLowerCase());

    // Add save location button
    addSaveLocationButton(data);
}

function addSaveLocationButton(data) {
    const locationInfo = document.querySelector('.location-info');
    const existingBtn = document.getElementById('saveLocationBtn');

    if (existingBtn) {
        existingBtn.remove();
    }

    const savedLocs = getSavedLocations();
    const isAlreadySaved = savedLocs.some(loc => loc.name === data.name);

    if (!isAlreadySaved && savedLocs.length < 5) {
        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveLocationBtn';
        saveBtn.className = 'controls button';
        saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Save Location';
        saveBtn.style.cssText = `
            margin-top: 10px;
            padding: 10px 20px;
            background: var(--accent);
            color: #000;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        `;
        saveBtn.onclick = () => saveLocation(data);
        locationInfo.appendChild(saveBtn);
    }
}

async function getAirQuality(lat, lon) {
    try {
        const url = `${API_BASE_URL}/api/air-pollution?lat=${lat}&lon=${lon}`;
        const data = await fetchData(url);

        const qualityIndex = data.list[0].main.aqi;
        const components = data.list[0].components;

        // Calculate actual AQI from PM2.5 concentration
        const pm25 = components.pm2_5 || 0;
        const actualAQI = calculateAQI(pm25);

        // Get UV Index (using onecall API would be better, but requires different endpoint)
        const uvUrl = `${API_BASE_URL}/api/onecall?lat=${lat}&lon=${lon}`;
        let uvIndex = 0;
        try {
            const uvData = await fetchData(uvUrl);
            uvIndex = uvData.current.uvi || 0;
        } catch (e) {
            // UV data not available, use mock data based on time
            const hour = new Date().getHours();
            uvIndex = (hour >= 10 && hour <= 16) ? Math.floor(Math.random() * 8) + 3 : Math.floor(Math.random() * 3);
        }

        displayEnvironmentalInfo(actualAQI, uvIndex, components);
    } catch (error) {
        console.error("Error fetching air quality:", error);
        // Display with default values
        displayEnvironmentalInfo(50, 0, {});
    }
}

// Calculate AQI from PM2.5 concentration (US EPA standard)
function calculateAQI(pm25) {
    // PM2.5 breakpoints and corresponding AQI values
    const breakpoints = [
        { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },      // Good
        { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },   // Moderate
        { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },  // Unhealthy for Sensitive Groups
        { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 }, // Unhealthy
        { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },// Very Unhealthy
        { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 } // Hazardous
    ];

    for (let bp of breakpoints) {
        if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
            const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow;
            return Math.round(aqi);
        }
    }

    // If PM2.5 is above 500.4, return 500
    return pm25 > 500.4 ? 500 : 0;
}

function displayEnvironmentalInfo(aqi, uvIndex, components) {
    // AQI categories based on value
    let aqiLabel, aqiClass;
    if (aqi <= 50) {
        aqiLabel = 'Good';
        aqiClass = 'aqi-good';
    } else if (aqi <= 100) {
        aqiLabel = 'Moderate';
        aqiClass = 'aqi-fair';
    } else if (aqi <= 150) {
        aqiLabel = 'Unhealthy for Sensitive';
        aqiClass = 'aqi-moderate';
    } else if (aqi <= 200) {
        aqiLabel = 'Unhealthy';
        aqiClass = 'aqi-poor';
    } else if (aqi <= 300) {
        aqiLabel = 'Very Unhealthy';
        aqiClass = 'aqi-very-poor';
    } else {
        aqiLabel = 'Hazardous';
        aqiClass = 'aqi-very-poor';
    }

    const uvLabels = ['Low', 'Low', 'Low', 'Moderate', 'Moderate', 'Moderate', 'High', 'High', 'Very High', 'Very High', 'Very High', 'Extreme'];
    const uvClasses = ['uv-low', 'uv-low', 'uv-low', 'uv-moderate', 'uv-moderate', 'uv-moderate', 'uv-high', 'uv-high', 'uv-very-high', 'uv-very-high', 'uv-very-high', 'uv-extreme'];

    environmentalInfo.innerHTML = `
        <div class="env-card">
            <div class="env-card-header">
                <i class="fa-solid fa-lungs"></i>
                <h4>Air Quality</h4>
            </div>
            <div class="env-value" style="color: var(--text);">${aqi}</div>
            <span class="env-label ${aqiClass}">${aqiLabel}</span>
        </div>
        <div class="env-card">
            <div class="env-card-header">
                <i class="fa-solid fa-sun"></i>
                <h4>UV Index</h4>
            </div>
            <div class="env-value" style="color: var(--text);">${Math.round(uvIndex)}</div>
            <span class="env-label ${uvClasses[Math.min(Math.round(uvIndex), 11)]}">${uvLabels[Math.min(Math.round(uvIndex), 11)]}</span>
        </div>
    `;
}

function displaySunInfo(data) {
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    const now = new Date();

    const sunriseTime = sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Calculate sun position (0-100%)
    const dayLength = sunset - sunrise;
    const timeSinceSunrise = now - sunrise;
    let sunPosition = (timeSinceSunrise / dayLength) * 100;
    sunPosition = Math.max(0, Math.min(100, sunPosition));

    const dayLengthHours = Math.floor(dayLength / 3600000);
    const dayLengthMinutes = Math.floor((dayLength % 3600000) / 60000);

    sunInfo.innerHTML = `
        <h4><i class="fa-solid fa-sun"></i> Sun & Moon</h4>
        <div class="sun-timeline">
            <div class="sun-arc"></div>
            <div class="sun-position" style="left: ${sunPosition}%; bottom: ${Math.sin((sunPosition / 100) * Math.PI) * 50}px;"></div>
        </div>
        <div class="sun-times">
            <div class="sun-time">
                <i class="fa-solid fa-sunrise"></i>
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Sunrise</div>
                    <span>${sunriseTime}</span>
                </div>
            </div>
            <div class="sun-time">
                <i class="fa-solid fa-clock"></i>
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Day Length</div>
                    <span>${dayLengthHours}h ${dayLengthMinutes}m</span>
                </div>
            </div>
            <div class="sun-time">
                <i class="fa-solid fa-sunset"></i>
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Sunset</div>
                    <span>${sunsetTime}</span>
                </div>
            </div>
        </div>
    `;
}

function calculateDewPoint(temp, humidity) {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    return (b * alpha) / (a - alpha);
}

function convertTemp(temp) {
    return isCelsius ? Math.round(temp) : Math.round(temp * 9 / 5 + 32);
}

async function fetchData(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Error fetching weather");
    }
    return res.json();
}

let chart;

async function getHourly(lat, lon) {
    try {
        const url = `${API_BASE_URL}/api/forecast?lat=${lat}&lon=${lon}`;
        const data = await fetchData(url);
        hourlyData = data;
        updateChart(data);
    } catch (error) {
        console.error("Error fetching hourly data:", error);
    }
}

function updateChart(data) {
    const hours = data.list.slice(0, 8);
    const labels = hours.map(h => {
        const date = new Date(h.dt_txt);
        return date.getHours() + ":00";
    });

    let chartData, chartLabel, chartColor, chartBgColor;

    if (currentChartType === 'temperature') {
        chartData = hours.map(h => convertTemp(h.main.temp));
        chartLabel = 'Temperature (°' + (isCelsius ? 'C' : 'F') + ')';
        chartColor = '#4a6cf7';
        chartBgColor = 'rgba(74, 108, 247, 0.1)';
    } else if (currentChartType === 'precipitation') {
        chartData = hours.map(h => (h.pop || 0) * 100);
        chartLabel = 'Precipitation (%)';
        chartColor = '#00bcd4';
        chartBgColor = 'rgba(0, 188, 212, 0.1)';
    } else if (currentChartType === 'wind') {
        chartData = hours.map(h => h.wind.speed);
        chartLabel = 'Wind Speed (m/s)';
        chartColor = '#4caf50';
        chartBgColor = 'rgba(76, 175, 80, 0.1)';
    }

    if (chart) chart.destroy();

    const isDark = document.body.classList.contains("dark");

    chart = new Chart(document.getElementById("hourlyChart"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: chartLabel,
                data: chartData,
                borderColor: chartColor,
                backgroundColor: chartBgColor,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: chartColor,
                pointBorderColor: "#fff",
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    padding: 12,
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    borderColor: chartColor,
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (currentChartType === 'temperature') {
                                label += context.parsed.y + '°';
                            } else if (currentChartType === 'precipitation') {
                                label += context.parsed.y.toFixed(0) + '%';
                            } else {
                                label += context.parsed.y.toFixed(1) + ' m/s';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function (value) {
                            if (currentChartType === 'temperature') {
                                return value + '°';
                            } else if (currentChartType === 'precipitation') {
                                return value + '%';
                            } else {
                                return value + ' m/s';
                            }
                        },
                        color: isDark ? "#f1f1f1" : "#333"
                    },
                    grid: {
                        color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
                    }
                },
                x: {
                    ticks: {
                        color: isDark ? "#f1f1f1" : "#333"
                    },
                    grid: {
                        color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
                    }
                }
            }
        }
    });
}

function setWeatherBackground(type) {
    const body = document.body;
    const isDark = body.classList.contains("dark");
    body.className = isDark ? "dark" : "";

    if (type.includes("cloud")) body.classList.add("clouds");
    else if (type.includes("rain") || type.includes("drizzle")) body.classList.add("rain");
    else if (type.includes("snow")) body.classList.add("snow");
    else if (type.includes("thunder")) body.classList.add("thunderstorm");
    else body.classList.add("clear");
}

// Search History Functions
function addToSearchHistory(city) {
    let history = JSON.parse(localStorage.getItem(STORAGE_KEYS.searchHistory) || '[]');

    // Remove if already exists
    history = history.filter(c => c.toLowerCase() !== city.toLowerCase());

    // Add to beginning
    history.unshift(city);

    // Keep only last 5
    history = history.slice(0, 5);

    localStorage.setItem(STORAGE_KEYS.searchHistory, JSON.stringify(history));
}

function showSearchHistory() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.searchHistory) || '[]');

    if (history.length === 0) {
        searchHistory.classList.remove('show');
        return;
    }

    let historyHTML = `
        <div class="search-history-header">
            <h4>Recent Searches</h4>
            <button class="clear-history" onclick="clearSearchHistory()">Clear</button>
        </div>
    `;

    history.forEach(city => {
        historyHTML += `
            <div class="history-item" onclick="getWeatherByCity('${city}')">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>${city}</span>
            </div>
        `;
    });

    searchHistory.innerHTML = historyHTML;
    searchHistory.classList.add('show');
}

function hideSearchHistory() {
    searchHistory.classList.remove('show');
}

function clearSearchHistory() {
    localStorage.removeItem(STORAGE_KEYS.searchHistory);
    hideSearchHistory();
}

// Saved Locations Functions
function getSavedLocations() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.savedLocations) || '[]');
}

function saveLocation(data) {
    let saved = getSavedLocations();

    if (saved.length >= 5) {
        alert('Maximum 5 locations can be saved');
        return;
    }

    const location = {
        name: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon,
        temp: data.main.temp
    };

    saved.push(location);
    localStorage.setItem(STORAGE_KEYS.savedLocations, JSON.stringify(saved));

    loadSavedLocations();

    // Remove save button
    const saveBtn = document.getElementById('saveLocationBtn');
    if (saveBtn) saveBtn.remove();
}

function removeLocation(index) {
    let saved = getSavedLocations();
    saved.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.savedLocations, JSON.stringify(saved));
    loadSavedLocations();
}

async function loadSavedLocations() {
    const saved = getSavedLocations();

    if (saved.length === 0) {
        savedLocationsEl.innerHTML = '';
        return;
    }

    savedLocationsEl.innerHTML = '';

    for (let i = 0; i < saved.length; i++) {
        const loc = saved[i];

        // Fetch current temp
        try {
            const url = `${API_BASE_URL}/api/weather?lat=${loc.lat}&lon=${loc.lon}`;
            const data = await fetchData(url);
            loc.temp = data.main.temp;
        } catch (e) {
            // Use cached temp
        }

        const card = document.createElement('div');
        card.className = 'saved-location-card';
        card.innerHTML = `
            <div class="location-name">${loc.name}</div>
            <div class="location-temp">${convertTemp(loc.temp)}°</div>
            <button class="remove-location" onclick="removeLocation(${i})">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        card.onclick = (e) => {
            if (!e.target.closest('.remove-location')) {
                getWeatherByCity(loc.name);
            }
        };
        savedLocationsEl.appendChild(card);
    }
}

function updateSavedLocationsDisplay() {
    const cards = document.querySelectorAll('.saved-location-card .location-temp');
    const saved = getSavedLocations();

    cards.forEach((card, index) => {
        if (saved[index]) {
            card.textContent = convertTemp(saved[index].temp) + '°';
        }
    });
}

function showLoading() {
    currentWeather.innerHTML = `
        <div class="loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading weather data...</p>
        </div>
    `;
}

function showError(message) {
    currentWeather.innerHTML = `
        <div class="error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>${message}</p>
        </div>
    `;
}

// Particle Effect System
let particleCanvas, particleCtx, particles = [];

function initParticleEffect() {
    particleCanvas = document.getElementById('particleCanvas');
    particleCtx = particleCanvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function updateParticles(weatherType) {
    particles = [];

    if (weatherType.includes('rain') || weatherType.includes('drizzle')) {
        createRainParticles();
        animateRain();
    } else if (weatherType.includes('snow')) {
        createSnowParticles();
        animateSnow();
    } else {
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    }
}

function createRainParticles() {
    const numParticles = 100;
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            length: Math.random() * 20 + 10,
            speed: Math.random() * 5 + 5,
            opacity: Math.random() * 0.5 + 0.3
        });
    }
}

function animateRain() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particleCtx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
    particleCtx.lineWidth = 1;

    particles.forEach(p => {
        particleCtx.beginPath();
        particleCtx.moveTo(p.x, p.y);
        particleCtx.lineTo(p.x, p.y + p.length);
        particleCtx.globalAlpha = p.opacity;
        particleCtx.stroke();

        p.y += p.speed;

        if (p.y > particleCanvas.height) {
            p.y = -p.length;
            p.x = Math.random() * particleCanvas.width;
        }
    });

    requestAnimationFrame(animateRain);
}

function createSnowParticles() {
    const numParticles = 80;
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            radius: Math.random() * 3 + 1,
            speed: Math.random() * 1 + 0.5,
            drift: Math.random() * 0.5 - 0.25,
            opacity: Math.random() * 0.6 + 0.4
        });
    }
}

function animateSnow() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particleCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    particles.forEach(p => {
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        particleCtx.globalAlpha = p.opacity;
        particleCtx.fill();

        p.y += p.speed;
        p.x += p.drift;

        if (p.y > particleCanvas.height) {
            p.y = -p.radius;
            p.x = Math.random() * particleCanvas.width;
        }

        if (p.x > particleCanvas.width) {
            p.x = 0;
        } else if (p.x < 0) {
            p.x = particleCanvas.width;
        }
    });

    requestAnimationFrame(animateSnow);
}

// ==================== NEW FEATURES FUNCTIONS ====================

// Weather Alerts System
async function getWeatherAlerts(lat, lon) {
    try {
        // Note: OpenWeatherMap's alerts are available in the OneCall API
        // For this implementation, we'll create smart alerts based on current conditions
        const alertsContainer = document.getElementById('weatherAlerts');
        alertsContainer.innerHTML = '';

        const alerts = [];

        // Check current weather data for alert conditions
        if (currentData) {
            // Temperature extremes
            const temp = currentData.main.temp;
            if (temp > 35) {
                alerts.push({
                    severity: 'warning',
                    icon: 'fa-temperature-high',
                    title: 'Heat Advisory',
                    description: `High temperature of ${convertTemp(temp)}°. Stay hydrated and avoid prolonged sun exposure.`
                });
            } else if (temp < 0) {
                alerts.push({
                    severity: 'warning',
                    icon: 'fa-temperature-low',
                    title: 'Cold Weather Alert',
                    description: `Temperature is ${convertTemp(temp)}°. Dress warmly and protect exposed skin.`
                });
            }

            // Wind alerts
            if (currentData.wind.speed > 10) {
                alerts.push({
                    severity: 'info',
                    icon: 'fa-wind',
                    title: 'High Wind Advisory',
                    description: `Wind speeds of ${currentData.wind.speed} m/s. Secure loose objects outdoors.`
                });
            }

            // Visibility alerts
            if (currentData.visibility < 1000) {
                alerts.push({
                    severity: 'severe',
                    icon: 'fa-eye-slash',
                    title: 'Low Visibility Warning',
                    description: `Visibility reduced to ${(currentData.visibility / 1000).toFixed(1)} km. Drive carefully.`
                });
            }

            // Rain/Storm alerts
            const weather = currentData.weather[0].main.toLowerCase();
            if (weather.includes('thunder')) {
                alerts.push({
                    severity: 'extreme',
                    icon: 'fa-cloud-bolt',
                    title: 'Thunderstorm Warning',
                    description: 'Thunderstorms in the area. Seek shelter indoors and avoid open areas.'
                });
            } else if (weather.includes('rain')) {
                alerts.push({
                    severity: 'info',
                    icon: 'fa-cloud-rain',
                    title: 'Rain Alert',
                    description: 'Rain expected. Carry an umbrella and drive carefully.'
                });
            }
        }

        // Display alerts
        alerts.forEach(alert => {
            const alertEl = document.createElement('div');
            alertEl.className = `weather-alert alert-${alert.severity}`;
            alertEl.innerHTML = `
                <i class="fa-solid ${alert.icon}"></i>
                <div class="weather-alert-content">
                    <div class="weather-alert-title">${alert.title}</div>
                    <div class="weather-alert-description">${alert.description}</div>
                </div>
            `;
            alertsContainer.appendChild(alertEl);
        });
    } catch (error) {
        console.error('Error fetching weather alerts:', error);
    }
}

// Voice Search Functionality
function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Voice search is not supported in your browser. Please try Chrome or Edge.');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const voiceBtn = document.getElementById('voiceBtn');

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        voiceBtn.classList.add('listening');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        cityInput.value = transcript;
        getWeatherByCity(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceBtn.classList.remove('listening');
        if (event.error === 'no-speech') {
            alert('No speech detected. Please try again.');
        } else {
            alert('Voice search error. Please try again.');
        }
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('listening');
    };

    recognition.start();
}

// Hourly Cards Display
function displayHourlyCards(data) {
    const container = document.getElementById('hourlyCardsContainer');
    const hours = data.list.slice(0, 12); // Show 12 hours

    container.innerHTML = '';

    hours.forEach((hour, index) => {
        const date = new Date(hour.dt_txt);
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = convertTemp(hour.main.temp);
        const feelsLike = convertTemp(hour.main.feels_like);
        const icon = hour.weather[0].icon;
        const desc = hour.weather[0].description;
        const pop = Math.round((hour.pop || 0) * 100);
        const windSpeed = hour.wind.speed.toFixed(1);
        const humidity = hour.main.humidity;
        const weatherMain = hour.weather[0].main.toLowerCase();

        // Determine if it's a different day
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

        let dayLabel = '';
        if (index === 0) {
            dayLabel = 'Now';
        } else if (isToday) {
            dayLabel = 'Today';
        } else if (isTomorrow) {
            dayLabel = 'Tomorrow';
        } else {
            dayLabel = dayName;
        }

        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.setAttribute('data-weather', weatherMain);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `Weather at ${time}: ${temp} degrees, ${desc}`);

        card.innerHTML = `
            <div class="hourly-card-header">
                <div class="hourly-card-day">${dayLabel}</div>
                <div class="hourly-card-time">${time}</div>
            </div>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" loading="lazy">
            <div class="hourly-card-temp">${temp}°</div>
            <div class="hourly-card-feels-like">Feels ${feelsLike}°</div>
            <div class="hourly-card-desc">${desc}</div>
            <div class="hourly-card-details">
                ${pop > 0 ? `
                    <div class="hourly-card-detail">
                        <i class="fa-solid fa-droplet"></i>
                        <span>${pop}%</span>
                    </div>
                ` : ''}
                <div class="hourly-card-detail">
                    <i class="fa-solid fa-wind"></i>
                    <span>${windSpeed} m/s</span>
                </div>
                <div class="hourly-card-detail">
                    <i class="fa-solid fa-droplet-percent"></i>
                    <span>${humidity}%</span>
                </div>
            </div>
        `;

        // Add click event for more details
        card.addEventListener('click', () => {
            showHourlyDetails(hour, time, dayLabel);
        });

        container.appendChild(card);
    });
}

// Show detailed hourly weather info
function showHourlyDetails(hour, time, dayLabel) {
    const temp = convertTemp(hour.main.temp);
    const feelsLike = convertTemp(hour.main.feels_like);
    const tempMin = convertTemp(hour.main.temp_min);
    const tempMax = convertTemp(hour.main.temp_max);
    const desc = hour.weather[0].description;
    const icon = hour.weather[0].icon;
    const pop = Math.round((hour.pop || 0) * 100);
    const windSpeed = hour.wind.speed.toFixed(1);
    const windDeg = hour.wind.deg;
    const humidity = hour.main.humidity;
    const pressure = hour.main.pressure;
    const clouds = hour.clouds.all;
    const visibility = hour.visibility ? (hour.visibility / 1000).toFixed(1) : 'N/A';

    // Get wind direction
    const windDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const windDirection = windDirections[Math.round(windDeg / 22.5) % 16];

    const modalHTML = `
        <div class="hourly-detail-modal" id="hourlyDetailModal">
            <div class="hourly-detail-content">
                <div class="hourly-detail-header">
                    <div>
                        <h3>${dayLabel} at ${time}</h3>
                        <p class="hourly-detail-subtitle">${desc}</p>
                    </div>
                    <button class="close-hourly-detail" onclick="closeHourlyDetail()" aria-label="Close details">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="hourly-detail-main">
                    <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${desc}">
                    <div class="hourly-detail-temp">${temp}°</div>
                    <div class="hourly-detail-feels">Feels like ${feelsLike}°</div>
                </div>
                <div class="hourly-detail-grid">
                    <div class="hourly-detail-item">
                        <i class="fa-solid fa-temperature-half"></i>
                        <div>
                            <div class="hourly-detail-label">High / Low</div>
                            <div class="hourly-detail-value">${tempMax}° / ${tempMin}°</div>
                        </div>
                    </div>
                    <div class="hourly-detail-item">
                        <i class="fa-solid fa-droplet"></i>
                        <div>
                            <div class="hourly-detail-label">Precipitation</div>
                            <div class="hourly-detail-value">${pop}%</div>
                        </div>
                    </div>
                    <div class="hourly-detail-item">
                        <i class="fa-solid fa-wind"></i>
                        <div>
                            <div class="hourly-detail-label">Wind</div>
                            <div class="hourly-detail-value">${windSpeed} m/s ${windDirection}</div>
                        </div>
                    </div>
                    <div class="hourly-detail-item">
                        <i class="fa-solid fa-droplet-percent"></i>
                        <div>
                            <div class="hourly-detail-label">Humidity</div>
                            <div class="hourly-detail-value">${humidity}%</div>
                        </div>
                    </div>
                    <div class="hourly-detail-item">
                        <i class="fa-solid fa-gauge"></i>
                        <div>
                            <div class="hourly-detail-label">Pressure</div>
                            <div class="hourly-detail-value">${pressure} hPa</div>
                        </div>
                    </div>
                    <div class="hourly-detail-item">
                        <i class="fa-solid fa-cloud"></i>
                        <div>
                            <div class="hourly-detail-label">Cloudiness</div>
                            <div class="hourly-detail-value">${clouds}%</div>
                        </div>
                    </div>
                    <div class="hourly-detail-item">
                        <i class="fa-solid fa-eye"></i>
                        <div>
                            <div class="hourly-detail-label">Visibility</div>
                            <div class="hourly-detail-value">${visibility} km</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('hourlyDetailModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal with animation
    setTimeout(() => {
        document.getElementById('hourlyDetailModal').classList.add('show');
    }, 10);
}

// Close hourly detail modal
function closeHourlyDetail() {
    const modal = document.getElementById('hourlyDetailModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}


// Comparison Modal Functions
function showComparison() {
    const savedLocations = getSavedLocations();

    if (savedLocations.length < 2) {
        alert('Please save at least 2 locations to compare weather.');
        return;
    }

    const modal = document.getElementById('comparisonModal');
    const grid = document.getElementById('comparisonGrid');

    grid.innerHTML = '';

    savedLocations.forEach(async (loc) => {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&units=metric&appid=${API_KEY}`;
            const data = await fetchData(url);

            const card = document.createElement('div');
            card.className = 'comparison-card';
            card.innerHTML = `
                <div class="comparison-card-header">
                    <div class="comparison-card-city">${data.name}, ${data.sys.country}</div>
                    <div class="comparison-card-date">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                <div class="comparison-card-weather">
                    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}">
                    <div class="comparison-card-temp">${convertTemp(data.main.temp)}°</div>
                    <div class="comparison-card-desc">${data.weather[0].description}</div>
                </div>
                <div class="comparison-card-details">
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Feels Like</div>
                        <div class="comparison-detail-value">${convertTemp(data.main.feels_like)}°</div>
                    </div>
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Humidity</div>
                        <div class="comparison-detail-value">${data.main.humidity}%</div>
                    </div>
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Wind</div>
                        <div class="comparison-detail-value">${data.wind.speed} m/s</div>
                    </div>
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Pressure</div>
                        <div class="comparison-detail-value">${data.main.pressure} hPa</div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        } catch (error) {
            console.error(`Error fetching data for ${loc.name}:`, error);
        }
    });

    modal.classList.add('show');
}

function hideComparison() {
    const modal = document.getElementById('comparisonModal');
    modal.classList.remove('show');
}

// Share Weather Function
async function shareWeather() {
    if (!currentData) {
        alert('No weather data to share');
        return;
    }

    const shareText = `🌤️ Weather in ${currentData.name}, ${currentData.sys.country}
📍 Temperature: ${convertTemp(currentData.main.temp)}°${isCelsius ? 'C' : 'F'}
☁️ Conditions: ${currentData.weather[0].description}
💨 Wind: ${currentData.wind.speed} m/s
💧 Humidity: ${currentData.main.humidity}%

Check the weather at: ${window.location.href}`;

    const shareBtn = document.querySelector('.share-btn');

    // Try Web Share API first (mobile)
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Weather Update',
                text: shareText
            });
            shareBtn.classList.add('success');
            setTimeout(() => shareBtn.classList.remove('success'), 1000);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
            }
        }
    } else {
        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            shareBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            shareBtn.classList.add('success');
            setTimeout(() => {
                shareBtn.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Share Weather';
                shareBtn.classList.remove('success');
            }, 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('Unable to share. Please copy manually:\n\n' + shareText);
        }
    }
}

// Update getHourly to also populate cards view
const originalGetHourly = getHourly;
async function getHourly(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const data = await fetchData(url);
        hourlyData = data;
        updateChart(data);

        // Also update cards if cards view is active
        const cardsContainer = document.getElementById('hourlyCardsContainer');
        if (cardsContainer.style.display === 'grid') {
            displayHourlyCards(data);
        }
    } catch (error) {
        console.error("Error fetching hourly data:", error);
    }
}
