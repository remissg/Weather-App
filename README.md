# 🌤️ Weather App - Real-time Weather Forecast

A modern, feature-rich weather application built with vanilla JavaScript, HTML, and CSS. Get accurate real-time weather forecasts with beautiful animations, interactive charts, and comprehensive weather data.

![Weather App](https://img.shields.io/badge/Version-2.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

## ✨ Features

### 🌡️ Current Weather
- Real-time temperature, feels-like, and weather conditions
- Comprehensive weather details (humidity, wind speed, pressure, visibility, cloudiness, dew point)
- Dynamic weather-based background gradients
- Animated weather icons with condition-specific effects
- Air Quality Index (AQI) with color-coded levels
- UV Index with health recommendations
- Sunrise/Sunset timeline with animated sun position

### 📊 Forecasts
- **Hourly Forecast**: Interactive charts and detailed card view
  - Temperature, precipitation, and wind speed charts
  - 12-hour forecast cards with detailed weather info
  - Click-to-expand for comprehensive hourly details
  - Day labels (Now/Today/Tomorrow)
  - Feels-like temperature, wind speed, humidity
- **5-Day Forecast**: Extended weather predictions
  - Daily high/low temperatures
  - Weather conditions and icons
  - Average temperature display

### 🎨 Advanced Features
- **Weather Alerts**: Smart alerts based on weather conditions
  - Temperature extremes (heat/cold advisories)
  - High wind warnings
  - Low visibility alerts
  - Storm and precipitation notifications
- **Voice Search**: Hands-free city search using Web Speech API
- **City Comparison**: Compare weather across multiple saved locations
- **Saved Locations**: Quick access to up to 5 favorite cities
- **Search History**: Recent searches with one-click access
- **Share Weather**: Share current conditions via Web Share API or clipboard
- **Dark/Light Mode**: Toggle between themes with smooth transitions
- **Temperature Units**: Switch between Celsius and Fahrenheit
- **Particle Effects**: Animated rain and snow particles

### ♿ Accessibility
- Full keyboard navigation support
- ARIA labels and semantic HTML
- Screen reader compatible
- Reduced motion support for users with motion sensitivity
- High contrast mode support
- Focus indicators for all interactive elements

### 📱 Responsive Design
- Fully responsive across all devices (desktop, tablet, mobile)
- Touch-optimized for mobile devices
- Adaptive layouts and font sizes
- Mobile-first approach

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- OpenWeatherMap API key (free tier available)

### Installation

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd weather-app
   ```

2. **Get your API key**
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Generate an API key

3. **Configure the API key**
   - Open `script.js`
   - Replace the API key on line 1:
     ```javascript
     const API_KEY = "your_api_key_here";
     ```

4. **Run the application**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx http-server
     ```

## 📁 Project Structure

```
weather-app/
├── index.html          # Main HTML structure
├── style.css           # Complete styling (1,779 lines)
├── script.js           # Application logic (1,378 lines)
└── README.md           # Documentation
```

## 🎯 Usage

### Search for a City
1. Type a city name in the search bar
2. Click the search button or press Enter
3. Or use voice search by clicking the microphone icon

### Use Current Location
- Click the location crosshairs button to get weather for your current location

### View Hourly Forecast
- Toggle between chart view (line graphs) and cards view (detailed cards)
- Switch between temperature, precipitation, and wind speed charts
- Click any hourly card for comprehensive details

### Save Locations
1. Search for a city
2. Click "Save Location" button
3. Access saved locations from the horizontal scroll bar at the top
4. Remove locations by hovering and clicking the X button

### Compare Weather
1. Save at least 2 locations
2. Click the comparison button in the header
3. View side-by-side weather comparison

### Share Weather
- Click "Share Weather" to share current conditions
- Uses native share on mobile devices
- Copies to clipboard on desktop

## 🛠️ Technologies Used

- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with custom properties, animations, and responsive design
- **JavaScript (ES6+)**: Modular code with async/await
- **Chart.js**: Interactive weather charts
- **OpenWeatherMap API**: Real-time weather data
- **Web Speech API**: Voice recognition
- **Web Share API**: Native sharing functionality
- **LocalStorage API**: Data persistence
- **Canvas API**: Particle effects

## 🎨 Design Features

### Visual Elements
- **Glassmorphism**: Frosted glass effect with backdrop blur
- **Gradient Backgrounds**: Dynamic colors based on weather conditions
- **Smooth Animations**: Micro-interactions throughout the interface
- **Custom Scrollbars**: Styled to match the theme
- **Premium Typography**: Poppins font family

### Weather-Specific Animations
- **Clear/Sunny**: Rotating sun rays
- **Rain**: Shaking animation with particle effects
- **Snow**: Gentle snowfall with rotation
- **Thunderstorm**: Lightning flash effect
- **Clouds**: Drifting cloud animation
- **Mist/Fog**: Fading opacity effect

## 🔧 Configuration

### Theme Customization
Edit CSS variables in `style.css`:
```css
:root {
    --bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --card: rgba(255, 255, 255, 0.15);
    --text: #ffffff;
    --accent: #ffd700;
    /* ... more variables */
}
```

### API Endpoints
The app uses the following OpenWeatherMap endpoints:
- Current Weather: `/data/2.5/weather`
- 5-Day Forecast: `/data/2.5/forecast`
- Air Quality: `/data/2.5/air_pollution`
- One Call API: `/data/2.5/onecall` (for UV index)

## 📊 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ Voice search requires Chrome or Edge

## 🐛 Known Limitations

- Free OpenWeatherMap API provides 5-day forecast (not 7-day)
- Voice search not supported in all browsers
- UV Index may use mock data if One Call API is unavailable
- Weather alerts are generated based on current conditions (not official alerts)

## 🚀 Performance Optimizations

- GPU-accelerated animations
- Lazy loading for images
- Smooth scrolling optimization
- Efficient rendering with `will-change` property
- Debounced API calls
- LocalStorage for data persistence

## 📝 License

This project is licensed under the MIT License - feel free to use it for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 👨‍💻 Author

Created with ❤️ by Joydip Maiti

## 🙏 Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Icons from [Font Awesome](https://fontawesome.com/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Fonts from [Google Fonts](https://fonts.google.com/)

## 📞 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Verify your API key is valid
3. Ensure you have an active internet connection
4. Check browser compatibility

---

**Enjoy your weather forecasting! 🌈**
# Weather-App
