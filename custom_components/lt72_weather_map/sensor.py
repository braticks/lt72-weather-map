"""Aggregated HA sensor backing the LT72 Weather Map."""

from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import COLOR_STATES, CONF_REGION, COUNTIES, DEFAULT_REGION, DOMAIN
from .coordinator import LT72WeatherCoordinator


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([
        LT72WeatherSensor(hass.data[DOMAIN][entry.entry_id], entry)
    ])


class LT72WeatherSensor(CoordinatorEntity[LT72WeatherCoordinator], SensorEntity):
    _attr_unique_id = "lt72_weather_map_counties"
    _attr_name = "LT72 oro pavojus ir orų radaras"
    _attr_icon = "mdi:weather-windy-variant"

    def __init__(self, coordinator, entry):
        super().__init__(coordinator)
        self._region = entry.options.get(
            CONF_REGION, entry.data.get(CONF_REGION, DEFAULT_REGION)
        )

    @property
    def native_value(self) -> str:
        payload = self.coordinator.data
        if not payload["alerts_available"]:
            return "Neprieinama"
        record = payload["alerts"].get(self._region)
        return COLOR_STATES.get(record["code"], "Nežinoma") if record else "Nepaskelbta"

    @property
    def extra_state_attributes(self) -> dict:
        payload = self.coordinator.data
        return {
            "apskritis": COUNTIES[self._region][0],
            "apskritys": {
                key: {
                    "kodas": record.get("code"),
                    "paskelbta": record.get("published_at"),
                }
                for key, record in payload["alerts"].items()
                if key in COUNTIES
            },
            "alerts_available": payload["alerts_available"],
            "weather_samples": payload["weather"],
            "weather_available": payload["weather_available"],
            "radar": payload["radar"],
            "radar_available": payload["radar_available"],
            "atnaujinta": payload["refreshed_at"],
            "klaidos": payload["errors"],
            "saltinis": "LT72 Weather Map",
        }
