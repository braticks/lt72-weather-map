"""Choose a Lithuanian county from the UI and change it later."""

from __future__ import annotations

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .const import CONF_REGION, COUNTIES, DEFAULT_REGION, DOMAIN


def _schema(selected: str) -> vol.Schema:
    return vol.Schema(
        {vol.Required(CONF_REGION, default=selected):
            vol.In({key: value[0] for key, value in COUNTIES.items()})}
    )


class LT72WeatherMapConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if user_input is not None:
            await self.async_set_unique_id(DOMAIN)
            self._abort_if_unique_id_configured()
            return self.async_create_entry(title="LT72 Weather Map", data=user_input)
        return self.async_show_form(step_id="user", data_schema=_schema(DEFAULT_REGION))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return LT72WeatherMapOptionsFlow()


class LT72WeatherMapOptionsFlow(config_entries.OptionsFlowWithReload):
    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)
        current = self.config_entry.options.get(
            CONF_REGION, self.config_entry.data.get(CONF_REGION, DEFAULT_REGION)
        )
        return self.async_show_form(step_id="init", data_schema=_schema(current))
