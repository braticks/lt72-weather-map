"""Validate weather-provider payload decoders without importing Home Assistant."""

import ast
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
    and node.name in {"parse_meteo", "parse_radar"}
]
scope = {
    "re": re,
    "math": math,
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
