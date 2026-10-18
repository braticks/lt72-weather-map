"""Validate weather-provider payload decoders without importing Home Assistant."""

import ast
from datetime import datetime
from pathlib import Path
import math
import re
import unittest
from urllib.parse import urlparse

SOURCE = (
    Path(__file__).resolve().parents[1]
    / "custom_components" / "lt72_weather_map" / "coordinator.py"
)
module = ast.parse(SOURCE.read_text(encoding="utf-8"))
functions = [
    node for node in module.body
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
    and node.name in {"parse_meteo", "parse_radar", "wind_15m_model_average"}
]
scope = {
    "re": re,
    "math": math,
    "datetime": datetime,
    "urlparse": urlparse,
    "RADAR_PATH": re.compile(r"^/v2/radar/(?:[0-9]{9,12}|[0-9a-f]{12})$"),
    "METEO_POINTS": {
        **{str(i): (str(i), 55, 24) for i in range(10)},
        "birzai": ("Biržai", 56.2045, 24.7567),
    },
}
exec(compile(ast.Module(body=functions, type_ignores=[]), str(SOURCE), "exec"), scope)
parse_radar = scope["parse_radar"]
parse_meteo = scope["parse_meteo"]
wind_15m_model_average = scope["wind_15m_model_average"]


class Sources(unittest.TestCase):
    def test_rainviewer_new_hex_path(self):
        value = parse_radar({
            "host": "https://tilecache.rainviewer.com",
            "radar": {"past": [
                {"time": 1792342800, "path": "/v2/radar/15f54382b37b"}
            ]},
        })
        self.assertEqual(value["frames"][0]["path"], "/v2/radar/15f54382b37b")

    def test_rainviewer_old_numeric_path(self):
        value = parse_radar({
            "host": "https://tilecache.rainviewer.com",
            "radar": {"past": [
                {"time": 1720000000, "path": "/v2/radar/1720000000"}
            ]},
        })
        self.assertEqual(len(value["frames"]), 1)

    def test_bad_radar_source_fails(self):
        with self.assertRaises(ValueError):
            parse_radar({
                "host": "https://untrusted.example",
                "radar": {"past": [{"time": 1792342800, "path": "/v2/radar/15f54382b37b"}]},
            })

    def test_current_multi_locations(self):
        values = [
            {"current": {
                "wind_speed_10m": 23.5,
                "wind_direction_10m": 300,
                "wind_gusts_10m": 40,
                "snowfall": 0.1,
                "precipitation": 1.4,
                "weather_code": 95,
                "temperature_2m": 12.75,
                "time": "2026-10-18T19:00",
            }} for _ in range(11)
        ]
        parsed = parse_meteo(values)
        self.assertEqual(len(parsed), 11)
        self.assertEqual(parsed['birzai']['temperature_c'], 12.8)
        self.assertEqual(parsed["0"]["wind_kmh"], 23.5)
        self.assertEqual(parsed["0"]["snow_cm"], 0.1)
        self.assertEqual(parsed["0"]["weather_code"], 95)
        self.assertEqual(parsed["0"]["temperature_c"], 12.8)

    def test_weather_code_can_be_missing_without_faking_a_storm(self):
        payload = [{"current": {
            "wind_speed_10m": 5, "wind_direction_10m": 180,
            "wind_gusts_10m": 10, "snowfall": 0,
            "precipitation": 0,
        }} for _ in range(11)]
        parsed = parse_meteo(payload)
        self.assertIsNone(parsed["0"]["weather_code"])
        self.assertIsNone(parsed["0"]["temperature_c"])

    def test_negative_and_zero_city_temperatures(self):
        payload = [{"current": {
            "wind_speed_10m": 5, "wind_direction_10m": 180,
            "wind_gusts_10m": 10, "snowfall": 0,
            "precipitation": 0, "temperature_2m": -3.2,
        }} for _ in range(11)]
        parsed = parse_meteo(payload)
        self.assertEqual(parsed["0"]["temperature_c"], -3.2)
        self.assertTrue(all(item["temperature_c"] == -3.2 for item in parsed.values()))

    def test_zero_temperature_kept_as_real_observation(self):
        payload = [{"current": {
            "wind_speed_10m": 5, "wind_direction_10m": 180,
            "wind_gusts_10m": 10, "snowfall": 0,
            "precipitation": 0, "temperature_2m": 0,
        }} for _ in range(11)]
        parsed = parse_meteo(payload)
        self.assertEqual(parsed["0"]["temperature_c"], 0.0)
        self.assertEqual(parsed["birzai"]["temperature_c"], 0.0)


    def test_missing_meteo_not_zero(self):
        with self.assertRaises(ValueError):
            parse_meteo([{"current": {}} for _ in range(11)])


if __name__ == "__main__":
    unittest.main()


class BirzaiLocationTests(unittest.TestCase):
    def test_birzai_location_is_in_additional_point_not_counties(self):
        const_file = SOURCE.with_name("const.py").read_text(encoding="utf-8")
        self.assertIn('"birzai": ("Biržai", 56.2045, 24.7567)', const_file)
        self.assertIn("METEO_POINTS = {**COUNTIES, **EXTRA_CITIES}", const_file)


class FifteenMinuteWindTests(unittest.TestCase):
    def sample(self):
        return {"current": {"time": "2026-10-18T21:44",
                            "wind_speed_10m": 25, "wind_direction_10m": 180},
                "minutely_15": {
                    "time": ["2026-10-18T21:15", "2026-10-18T21:30", "2026-10-18T21:45"],
                    "wind_speed_10m": [8, 12, 40],
                    "wind_direction_10m": [350, 10, 90]}}

    def test_average_ignores_future_and_handles_north(self):
        speed, direction, stamped = wind_15m_model_average(self.sample())
        self.assertEqual(speed, 10)
        self.assertLess(min(direction,360-direction), 13)
        self.assertEqual(stamped, "2026-10-18T21:30:00")

    def test_current_fallback_without_false_15m_label(self):
        item = self.sample()
        row = {**item["current"], "wind_gusts_10m": 30,
               "snowfall": 0, "precipitation": 0}
        result = parse_meteo([{"current": row} for _ in range(11)])
        self.assertEqual(result["birzai"]["wind_window"], "current")
        self.assertEqual(result["birzai"]["wind_kmh"], 25)

    def test_all_cities_use_model_average_when_available(self):
        item = self.sample()
        row = {**item["current"], "wind_gusts_10m": 30,
               "snowfall": 0, "precipitation": 0}
        result = parse_meteo([{"current": row, "minutely_15": item["minutely_15"]}
                              for _ in range(11)])
        self.assertEqual(result["birzai"]["wind_window"], "15m")
        self.assertEqual(result["birzai"]["wind_kmh"], 10)
        self.assertEqual(result["birzai"]["wind_now_kmh"], 25)

    def test_missing_and_stale_fall_back(self):
        item = self.sample()
        item["minutely_15"]["wind_speed_10m"][1] = None
        self.assertIsNone(wind_15m_model_average(item))
        item = self.sample()
        item["minutely_15"]["time"] = [
            "2026-10-18T20:00","2026-10-18T20:15","2026-10-18T21:45"]
        self.assertIsNone(wind_15m_model_average(item))
