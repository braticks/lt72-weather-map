"""Fetch independent LT72, Open-Meteo and RainViewer datasets.

Alert status failures must NOT be interpreted as an all-clear.
Model forecast gaps must NOT be interpreted as zero rain/snow/wind.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import logging
import math
import re
from urllib.parse import urlparse

from aiohttp import ClientError, ClientTimeout
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import COUNTIES, DOMAIN, SOURCE_LT72, SOURCE_METEO, SOURCE_RADAR
from .parser import parse_air_alerts

_LOGGER = logging.getLogger(__name__)
RADAR_PATH = re.compile(r"^/v2/radar/(?:[0-9]{9,12}|[0-9a-f]{12})$")


def parse_meteo(data: object) -> dict:
    """Parse multi-location current forecasts, keyed by Lithuanian county."""
    if not isinstance(data, list) or len(data) != len(COUNTIES):
        raise ValueError("Open-Meteo returned an unexpected number of counties")
    parsed = {}
    required = ("wind_speed_10m", "wind_direction_10m",
                "wind_gusts_10m", "snowfall", "precipitation")
    for county, record in zip(COUNTIES, data):
        current = record.get("current") if isinstance(record, dict) else None
        if not isinstance(current, dict):
            raise ValueError("Open-Meteo current data is missing")
        if not all(isinstance(current.get(key), (int, float)) for key in required):
            raise ValueError("Open-Meteo current values are incomplete")
        weather_code = current.get("weather_code")
        # WMO code is optional for graceful upgrades / inconsistent providers.
        weather_code = int(weather_code) if (
            isinstance(weather_code, (int, float))
            and not isinstance(weather_code, bool)
        ) else None
        temperature = current.get("temperature_2m")
        # Temperature is optional so one missing weather field does not hide
        # valid wind, snow or rain. Missing temperature is never shown as 0°C.
        temp_c = round(float(temperature), 1) if (
            isinstance(temperature, (int, float))
            and not isinstance(temperature, bool)
            and math.isfinite(temperature)
        ) else None
        parsed[county] = {
            "temperature_c": temp_c,
            "weather_code": weather_code,
            "wind_kmh": round(float(current["wind_speed_10m"]), 1),
            "wind_from_deg": round(float(current["wind_direction_10m"]), 0),
            "gust_kmh": round(float(current["wind_gusts_10m"]), 1),
            "snow_cm": round(float(current["snowfall"]), 2),
            "precip_mm": round(float(current["precipitation"]), 1),
            "valid_at": current.get("time"),
        }
    return parsed


def parse_radar(data: object) -> dict:
    """Accept only official RainViewer HTTPS tile domain and radar paths."""
    if not isinstance(data, dict):
        raise ValueError("Invalid RainViewer response")
    host = str(data.get("host", "")).rstrip("/")
    parts = urlparse(host)
    if (parts.scheme != "https"
            or parts.hostname != "tilecache.rainviewer.com"
            or parts.path not in ("", "/")
            or parts.query or parts.fragment or parts.username):
        raise ValueError("Unexpected RainViewer tile server")
    frames = data.get("radar", {}).get("past", [])
    if not isinstance(frames, list):
        raise ValueError("RainViewer radar frames are missing")
    result = []
    for frame in frames[-12:]:
        if not isinstance(frame, dict):
            continue
        path = str(frame.get("path", ""))
        timestamp = frame.get("time")
        if RADAR_PATH.fullmatch(path) and isinstance(timestamp, int):
            result.append({"time": timestamp, "path": path})
    if not result:
        raise ValueError("RainViewer has no usable past radar frame")
    return {"host": host, "frames": result}


class LT72WeatherCoordinator(DataUpdateCoordinator[dict]):
    """One minute status, 10 min forecasts, 5 min radar metadata."""

    def __init__(self, hass) -> None:
        super().__init__(
            hass, _LOGGER, name=DOMAIN, update_interval=timedelta(seconds=60)
        )
        self._weather: dict = {}
        self._radar: dict = {}
        self._weather_time: datetime | None = None
        self._radar_time: datetime | None = None

    async def _async_update_data(self) -> dict:
        session = async_get_clientsession(self.hass)
        now = datetime.now(timezone.utc)
        statuses = {}
        alerts_available = False
        errors = []
        try:
            async with session.get(
                SOURCE_LT72, timeout=ClientTimeout(total=15),
                headers={"Cache-Control": "no-cache"},
            ) as response:
                response.raise_for_status()
                page = await response.text()
            statuses = parse_air_alerts(page)
            alerts_available = True
        except (ClientError, TimeoutError, ValueError) as exc:
            errors.append("LT72: " + str(exc))
            _LOGGER.warning("LT72 alerts unavailable: %s", exc)

        if (self._weather_time is None
                or now - self._weather_time >= timedelta(minutes=10)):
            self._weather_time = now
            try:
                rows = list(COUNTIES.values())
                params = {
                    "latitude": ",".join(str(x[1]) for x in rows),
                    "longitude": ",".join(str(x[2]) for x in rows),
                    "current": "wind_speed_10m,wind_direction_10m,"
                               "wind_gusts_10m,snowfall,precipitation,weather_code,temperature_2m",
                    "forecast_days": 1,
                    "wind_speed_unit": "kmh",
                    "timezone": "Europe/Vilnius",
                }
                async with session.get(
                    SOURCE_METEO, params=params, timeout=ClientTimeout(total=22)
                ) as response:
                    response.raise_for_status()
                    payload = await response.json()
                self._weather = parse_meteo(payload)
            except (ClientError, TimeoutError, ValueError) as exc:
                # No stale forecast is presented as current.
                self._weather = {}
                errors.append("Open-Meteo: " + str(exc))
                _LOGGER.warning("Open-Meteo forecast unavailable: %s", exc)

        if (self._radar_time is None
                or now - self._radar_time >= timedelta(minutes=5)):
            self._radar_time = now
            try:
                async with session.get(
                    SOURCE_RADAR, timeout=ClientTimeout(total=15)
                ) as response:
                    response.raise_for_status()
                    payload = await response.json()
                self._radar = parse_radar(payload)
            except (ClientError, TimeoutError, ValueError) as exc:
                self._radar = {}
                errors.append("RainViewer: " + str(exc))
                _LOGGER.warning("RainViewer radar unavailable: %s", exc)

        return {
            "alerts": statuses,
            "alerts_available": alerts_available,
            "weather": self._weather,
            "weather_available": bool(self._weather),
            "radar": self._radar,
            "radar_available": bool(self._radar.get("frames")),
            "refreshed_at": now.isoformat(),
            "errors": errors,
        }
