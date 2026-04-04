from app.services.vaastu.vaastu_grid import (
    ZONES, PLANET_DIRECTIONS,
    get_zone_for_planet, get_zone_for_direction,
    get_devtas_for_zone, map_afflictions,
)


def test_zones_has_16_entries():
    assert len(ZONES) == 16


def test_each_zone_has_required_fields():
    for zone in ZONES:
        assert "name" in zone
        assert "start_degree" in zone
        assert "end_degree" in zone
        assert "ruling_planet" in zone


def test_zones_cover_360_degrees():
    total = sum(z["end_degree"] - z["start_degree"] if z["end_degree"] > z["start_degree"]
                else (360 - z["start_degree"] + z["end_degree"])
                for z in ZONES)
    assert abs(total - 360.0) < 0.1


def test_planet_directions_has_9_planets():
    assert len(PLANET_DIRECTIONS) == 9
    for planet in ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]:
        assert planet in PLANET_DIRECTIONS


def test_get_zone_for_planet_sun():
    zone = get_zone_for_planet("Sun")
    assert zone["name"] == "E"


def test_get_zone_for_planet_saturn():
    zone = get_zone_for_planet("Saturn")
    assert zone["name"] == "W"


def test_get_zone_for_planet_jupiter():
    zone = get_zone_for_planet("Jupiter")
    assert zone["name"] == "NE"


def test_get_zone_for_direction():
    zone = get_zone_for_direction("SE")
    assert zone["ruling_planet"] == "Venus"


def test_get_zone_for_direction_north():
    zone = get_zone_for_direction("N")
    assert zone["ruling_planet"] == "Mercury"


def test_get_devtas_for_zone_returns_list():
    devtas = get_devtas_for_zone("N")
    assert isinstance(devtas, list)
    assert len(devtas) >= 1
    for d in devtas:
        assert "name" in d
        assert "domain" in d


def test_get_devtas_for_zone_east():
    devtas = get_devtas_for_zone("E")
    names = [d["name"] for d in devtas]
    assert "Surya" in names


def test_map_afflictions_returns_zone_info():
    hits = [
        {"attacker": "Saturn", "victim": "Moon", "angle": 90.5, "type": "dangerous"}
    ]
    result = map_afflictions(hits)
    assert len(result) >= 1
    assert result[0]["zone"] == "W"
    assert result[0]["hit_type"] == "dangerous"
    assert "devtas" in result[0]


def test_map_afflictions_empty_hits():
    result = map_afflictions([])
    assert result == []
