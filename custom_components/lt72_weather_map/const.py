"""LT72 Weather Map constants and administrative regions."""

DOMAIN = "lt72_weather_map"
SOURCE_LT72 = "https://lt72.lt/"
SOURCE_METEO = "https://api.open-meteo.com/v1/forecast"
SOURCE_RADAR = "https://api.rainviewer.com/public/weather-maps.json"
CONF_REGION = "region"
DEFAULT_REGION = "kauno"

# Representative county locations (not precise county centroid locations).
# Tuples are latitude, longitude.
COUNTIES = {
    "alytaus": ("Alytaus apskritis", 54.42, 24.05),
    "kauno": ("Kauno apskritis", 54.93, 23.90),
    "klaipedos": ("Klaipėdos apskritis", 55.74, 21.60),
    "marijampoles": ("Marijampolės apskritis", 54.55, 23.50),
    "panevezio": ("Panevėžio apskritis", 55.75, 24.36),
    "siauliu": ("Šiaulių apskritis", 55.97, 23.31),
    "taurages": ("Tauragės apskritis", 55.30, 22.28),
    "telsiu": ("Telšių apskritis", 56.02, 22.25),
    "utenos": ("Utenos apskritis", 55.49, 25.60),
    "vilniaus": ("Vilniaus apskritis", 54.80, 25.30),
}

COLOR_STATES = {
    "red": "Raudona",
    "yellow": "Geltona",
    "yellow_after_red": "Geltona po raudonos",
    "white": "Balta",
}
