"""Serve the bundled map and register the Lovelace module automatically."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import lovelace
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_call_later

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
FRONTEND_URL = f"/{DOMAIN}"
MODULE_URL = f"{FRONTEND_URL}/lt72-weather-map.js"
MODULE_VERSION = "0.5.3"
ASSETS = Path(__file__).parent / "www"


async def async_setup_frontend(hass: HomeAssistant) -> None:
    state = hass.data.setdefault(DOMAIN, {})
    if not state.get("_frontend_static_registered"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(FRONTEND_URL, str(ASSETS), cache_headers=False)]
        )
        state["_frontend_static_registered"] = True

    if not await _async_register_resource(hass):
        if not state.get("_resource_retry"):
            state["_resource_retry"] = True

            async def _retry(_now) -> None:
                state["_resource_retry"] = False
                if not await _async_register_resource(hass):
                    _LOGGER.warning("Add Lovelace module manually: %s", MODULE_URL)

            async_call_later(hass, 10, _retry)


async def _async_register_resource(hass: HomeAssistant) -> bool:
    data = hass.data.get(lovelace.LOVELACE_DATA)
    if data is None:
        return False
    resources = data.resources
    if not isinstance(resources, lovelace.resources.ResourceStorageCollection):
        _LOGGER.warning("Lovelace YAML resource mode: add %s manually", MODULE_URL)
        return True
    try:
        await resources.async_get_info()
        url = f"{MODULE_URL}?v={MODULE_VERSION}"
        for item in resources.async_items():
            if str(item.get("url", "")).split("?", 1)[0].lower() == MODULE_URL.lower():
                if item.get("url") != url:
                    await resources.async_update_item(
                        item["id"], {"res_type": "module", "url": url}
                    )
                return True
        await resources.async_create_item({"res_type": "module", "url": url})
        return True
    except (KeyError, ValueError) as exc:
        _LOGGER.warning("Could not register weather map resource: %s", exc)
        return False
