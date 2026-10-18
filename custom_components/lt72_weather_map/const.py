"""LT72 Weather Map constants and administrative regions."""

DOMAIN = "lt72_weather_map"
SOURCE_LT72 = "https://lt72.lt/"
SOURCE_METEO = "https://api.open-meteo.com/v1/forecast"
SOURCE_RADAR = "https://api.rainviewer.com/public/weather-maps.json"
CONF_REGION = "region"
DEFAULT_REGION = "kauno"

# Representative county forecasts sampled at the county capital city center.
# These Open-Meteo points also drive the city temperature labels.
# Tuples are latitude, longitude.
COUNTIES = {
    "alytaus": ("Alytaus apskritis", 54.3960, 24.0410),
    "kauno": ("Kauno apskritis", 54.8985, 23.9036),
    "klaipedos": ("Klaipėdos apskritis", 55.7033, 21.1443),
    "marijampoles": ("Marijampolės apskritis", 54.5590, 23.3541),
    "panevezio": ("Panevėžio apskritis", 55.7348, 24.3575),
    "siauliu": ("Šiaulių apskritis", 55.9349, 23.3137),
    "taurages": ("Tauragės apskritis", 55.2522, 22.2897),
    "telsiu": ("Telšių apskritis", 55.9861, 22.2492),
    "utenos": ("Utenos apskritis", 55.4976, 25.5992),
    "vilniaus": ("Vilniaus apskritis", 54.6872, 25.2797),
}

# One extra location beyond the ten LT72 counties.
EXTRA_CITIES = {
    "birzai": ("Biržai", 56.2045, 24.7567),
}

# Stable order used for request lat/lon lists and parsing their response.
METEO_POINTS = {**COUNTIES, **EXTRA_CITIES}


COLOR_STATES = {
    "red": "Raudona",
    "yellow": "Geltona",
    "yellow_after_red": "Geltona po raudonos",
    "white": "Balta",
}
