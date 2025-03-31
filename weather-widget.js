// weather-widget.js
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

// Weather icons as SVG strings to avoid external dependencies
const ICONS = {
  Sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`,
  Cloud: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>`,
  CloudRain: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></svg>`,
  CloudSnow: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M8 15h.01"></path><path d="M8 19h.01"></path><path d="M12 17h.01"></path><path d="M12 21h.01"></path><path d="M16 15h.01"></path><path d="M16 19h.01"></path></svg>`,
  CloudLightning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"></path><path d="m13 12-3 5h4l-3 5"></path></svg>`,
  Wind: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"></path><path d="M9.6 4.6A2 2 0 1 1 11 8H2"></path><path d="M12.6 19.4A2 2 0 1 0 14 16H2"></path></svg>`,
};

// The React weather widget component
const WeatherWidget = ({ apiKey, city, units, theme }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      // Reset states
      setLoading(true);
      setError(null);
      setWeather(null);

      // Check if API key is provided
      if (!apiKey || apiKey.trim() === "") {
        setLoading(false);
        setError(
          "No API key provided. Please add a valid OpenWeatherMap API key using the 'api-key' attribute."
        );
        return;
      }

      try {
        // Using OpenWeatherMap API
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${apiKey}`
        );

        // Handle different error cases
        if (!response.ok) {
          const errorData = await response.json();

          // Check for API key errors (usually 401 Unauthorized or specific error codes)
          if (
            response.status === 401 ||
            (errorData.cod &&
              (errorData.cod === 401 || errorData.cod === "401")) ||
            (errorData.message && errorData.message.includes("api key"))
          ) {
            throw new Error(
              "Invalid API key. Please check your OpenWeatherMap API key."
            );
          } else if (
            response.status === 404 ||
            (errorData.cod &&
              (errorData.cod === 404 || errorData.cod === "404"))
          ) {
            throw new Error(
              `City "${city}" not found. Please check the city name.`
            );
          } else {
            throw new Error(errorData.message || "Weather data not available");
          }
        }

        const data = await response.json();

        // Map API response to our internal format
        const weatherData = {
          city: data.name,
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          feelsLike: Math.round(data.main.feels_like),
          high: Math.round(data.main.temp_max),
          low: Math.round(data.main.temp_min),
          icon: mapWeatherToIcon(data.weather[0].main),
        };

        setWeather(weatherData);
      } catch (err) {
        console.error("Error fetching weather:", err);

        // Different error messages based on error type
        if (err.name === "TypeError" && err.message.includes("fetch")) {
          setError("Network error. Please check your internet connection.");
        } else {
          setError(err.message || "Failed to load weather data");
        }
      } finally {
        setLoading(false);
      }
    };

    // Function to map weather conditions to icon names
    const mapWeatherToIcon = (condition) => {
      const conditionMap = {
        Clear: "Sun",
        Clouds: "Cloud",
        Rain: "CloudRain",
        Drizzle: "CloudRain",
        Thunderstorm: "CloudLightning",
        Snow: "CloudSnow",
        Mist: "Cloud",
        Fog: "Cloud",
        Haze: "Cloud",
      };

      return conditionMap[condition] || "Cloud";
    };

    fetchWeather();

    // Refresh every 15 minutes (only if we have valid data)
    const interval = setInterval(() => {
      if (apiKey && apiKey.trim() !== "") {
        fetchWeather();
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [apiKey, city, units]);

  // CSS for the widget (contained within the component)
  const containerStyle = {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: "300px",
    margin: "0 auto",
    padding: "16px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
    color: theme === "dark" ? "#ffffff" : "#1f2937",
  };

  const headerStyle = {
    textAlign: "center",
    fontSize: "1.25rem",
    fontWeight: "bold",
    marginBottom: "4px",
  };

  const iconStyle = {
    display: "flex",
    justifyContent: "center",
    margin: "16px 0",
  };

  const temperatureStyle = {
    textAlign: "center",
    fontSize: "2.5rem",
    fontWeight: "bold",
    margin: "8px 0",
  };

  const conditionStyle = {
    textAlign: "center",
    fontSize: "1.125rem",
    marginBottom: "16px",
  };

  const detailsContainerStyle = {
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: theme === "dark" ? "#374151" : "#f3f4f6",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  };

  const detailLabelStyle = {
    fontSize: "0.875rem",
    opacity: "0.75",
  };

  const leftDetailStyle = {
    textAlign: "left",
  };

  const rightDetailStyle = {
    textAlign: "right",
  };

  const errorContainerStyle = {
    textAlign: "center",
    padding: "20px",
    color: "#ef4444",
    backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    border: "1px solid #ef4444",
  };

  // Handle loading state
  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div>Loading weather data...</div>
        </div>
      </div>
    );
  }

  // Handle error state - always show the error message, never fallback to demo data
  if (error) {
    return (
      <div style={errorContainerStyle}>
        <h2 style={headerStyle}>Error</h2>
        <p style={{ marginBottom: "10px" }}>{error}</p>

        {(!apiKey || apiKey.trim() === "") && (
          <p style={{ fontSize: "0.875rem", opacity: "0.9" }}>
            Add your API key with: <br />
            <code
              style={{
                backgroundColor: theme === "dark" ? "#374151" : "#f3f4f6",
                padding: "2px 4px",
                borderRadius: "4px",
              }}
            >
              &lt;weather-widget
              api-key="YOUR_API_KEY"&gt;&lt;/weather-widget&gt;
            </code>
          </p>
        )}

        {apiKey && apiKey.trim() !== "" && error.includes("API key") && (
          <p style={{ fontSize: "0.875rem", opacity: "0.9" }}>
            Get a free API key at <br />
            <a
              href="https://home.openweathermap.org/users/sign_up"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3b82f6" }}
            >
              OpenWeatherMap.org
            </a>
          </p>
        )}
      </div>
    );
  }

  // If we have weather data and no errors, show the weather
  if (weather) {
    // Render the weather icon based on condition
    const renderIcon = () => {
      const iconName = weather.icon || "Cloud";
      const iconSvg = ICONS[iconName];
      const iconColor = theme === "dark" ? "#ffffff" : "#1f2937";

      const iconWithColor = iconSvg.replace(
        'stroke="currentColor"',
        `stroke="${iconColor}"`
      );

      return (
        <div
          style={iconStyle}
          dangerouslySetInnerHTML={{
            __html: iconWithColor.replace(
              'width="24" height="24"',
              'width="48" height="48"'
            ),
          }}
        />
      );
    };

    // Main widget display
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>{weather.city}</h2>

        {renderIcon()}

        <div style={temperatureStyle}>
          {weather.temperature}°{units === "metric" ? "C" : "F"}
        </div>

        <div style={conditionStyle}>{weather.condition}</div>

        <div style={detailsContainerStyle}>
          <div style={leftDetailStyle}>
            <div style={detailLabelStyle}>Feels like</div>
            <div>{weather.feelsLike}°</div>
          </div>
          <div style={rightDetailStyle}>
            <div style={detailLabelStyle}>Wind</div>
            <div>
              {weather.windSpeed} {units === "metric" ? "m/s" : "mph"}
            </div>
          </div>
          <div style={leftDetailStyle}>
            <div style={detailLabelStyle}>Humidity</div>
            <div>{weather.humidity}%</div>
          </div>
          <div style={rightDetailStyle}>
            <div style={detailLabelStyle}>High / Low</div>
            <div>
              {weather.high}° / {weather.low}°
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This is a fallback in case we have neither weather data nor an error
  // This shouldn't happen in normal operation but is included for safety
  return (
    <div style={errorContainerStyle}>
      <h2 style={headerStyle}>Configuration Error</h2>
      <p>
        The weather widget is not properly configured. Please provide a valid
        API key.
      </p>
    </div>
  );
};

// Create a web component class
class WeatherWidgetElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // Get attributes or use defaults
    const apiKey = this.getAttribute("api-key") || "";
    const city = this.getAttribute("city") || "New York";
    const units = this.getAttribute("units") || "metric";
    const theme = this.getAttribute("theme") || "light";

    // Create a container for React
    const mountPoint = document.createElement("div");
    this.shadowRoot.appendChild(mountPoint);

    // Render React component into shadow DOM
    const root = createRoot(mountPoint);
    root.render(
      <WeatherWidget apiKey={apiKey} city={city} units={units} theme={theme} />
    );
  }

  // React to attribute changes
  static get observedAttributes() {
    return ["api-key", "city", "units", "theme"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.shadowRoot.firstChild) {
      // Re-render component with new attributes
      this.connectedCallback();
    }
  }
}

// Define the custom element
customElements.define("weather-widget", WeatherWidgetElement);

// Package for distribution - IIFE (Immediately Invoked Function Expression)
// This allows it to be included via a simple <script> tag
(function () {
  // Create and append necessary React scripts if not already present
  const requiredScripts = [
    {
      id: "react-script",
      src: "https://unpkg.com/react@18/umd/react.production.min.js",
    },
    {
      id: "react-dom-script",
      src: "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
    },
  ];

  requiredScripts.forEach((scriptInfo) => {
    if (!document.getElementById(scriptInfo.id)) {
      const script = document.createElement("script");
      script.id = scriptInfo.id;
      script.src = scriptInfo.src;
      script.async = false;
      document.head.appendChild(script);
    }
  });
})();
