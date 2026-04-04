"""
Master Vaastu Diagnostic — Orchestrator

Combines HIT Calculator, Zone Mapping, Aayadi, and Spatial Rules into
a unified diagnostic report with zone status map, remedies, and summary.
"""

from __future__ import annotations

from typing import Any

from app.services.vaastu.hit_calculator import calculate_hits
from app.services.vaastu.vaastu_grid import ZONES, map_afflictions, get_devtas_for_zone, PLANET_DIRECTIONS
from app.services.vaastu.aayadi import calculate_aayadi
from app.services.vaastu.spatial_rules import check_spatial_rules

DISCLAIMER = (
    "This is traditional Vedic Vaastu guidance — not a substitute for "
    "structural engineering or professional consultation."
)

# Spatial findings that carry a warning for a specific zone
_SPATIAL_WARNING_RULES = {"Kitchen Placement", "Toilet Placement", "Main Entrance"}


def _zone_names_from_spatial(findings: list[dict]) -> set[str]:
    """Collect zone names that carry unfavorable/warning findings from spatial rules."""
    zones: set[str] = set()
    for f in findings:
        if f.get("status") in ("unfavorable", "warning") and "zone" in f:
            # zone field may be a comma-separated list (toilet_zones)
            for part in f["zone"].split(","):
                zones.add(part.strip().upper())
    return zones


def _build_remedy(zone_name: str, hit_type: str, attacker: str, devtas: list[dict], dasha_lord: str) -> dict:
    """Generate a remedy dict for an afflicted or warning zone."""
    devta_name = devtas[0]["name"] if devtas else zone_name

    if hit_type in ("killer", "dangerous"):
        remedy_text = (
            f"Place Copper Pyramid in {zone_name} zone to contain {attacker} energy. "
            f"Activate {devta_name} with appropriate offerings."
        )
        reason = f"{attacker} forms a {hit_type} angle afflicting the {zone_name} zone."
    elif hit_type == "obstacle":
        remedy_text = f"Place a Yantra for {devta_name} in {zone_name} zone to reduce delays."
        reason = f"{attacker} creates an obstacle aspect in the {zone_name} zone."
    else:
        # positive — enhancement suggestion
        remedy_text = (
            f"Enhance {zone_name} zone with {attacker}-related items during {dasha_lord} Dasha period."
        )
        reason = f"{attacker} activates positive energy in the {zone_name} zone during current Dasha."

    hit_category = hit_type if hit_type in ("killer", "dangerous", "obstacle") else "positive"
    return {"zone": zone_name, "type": hit_category, "remedy": remedy_text, "reason": reason}


def run_vaastu_diagnostic(
    vedic_chart: dict,
    property: dict,
    user_nakshatra: str,
    room_details: dict | None = None,
    user_name_initial: str | None = None,
) -> dict[str, Any]:
    """
    Run a full Vaastu diagnostic combining all sub-services.

    Parameters
    ----------
    vedic_chart : dict
        Must contain ``planets`` (list) and ``dasha`` (dict with
        ``current_mahadasha.planet``).
    property : dict
        Must contain ``length``, ``breadth``, ``entrance_direction``,
        and ``floor_level``.
    user_nakshatra : str
        Occupant's birth nakshatra for Aayadi calculation.
    room_details : dict, optional
        Optional room-level details. Supported keys:
        ``kitchen_zone``, ``toilet_zones``, ``brahmasthan_status``,
        ``slope_direction``.
    user_name_initial : str, optional
        First letter of primary resident's name.

    Returns
    -------
    dict with keys:
        hits, aayadi, zone_map, spatial_findings, plant_recommendations,
        remedies, summary, disclaimer.
    """
    room_details = room_details or {}

    # ------------------------------------------------------------------
    # 1. Extract Dasha lord
    # ------------------------------------------------------------------
    dasha_lord: str = vedic_chart["dasha"]["current_mahadasha"]["planet"]

    # ------------------------------------------------------------------
    # 2. Calculate planetary HITs
    # ------------------------------------------------------------------
    hits = calculate_hits(vedic_chart["planets"], dasha_lord)

    # ------------------------------------------------------------------
    # 3. Map primary afflictions to zones
    # ------------------------------------------------------------------
    affliction_zones = map_afflictions(hits["primary_hits"])

    # Secondary and positive zone mappings
    secondary_affliction_zones = map_afflictions(hits["secondary_hits"])
    positive_zone_data = map_afflictions(hits["positive_hits"])

    # Build quick-lookup dicts: zone_name → affliction data
    primary_by_zone: dict[str, dict] = {}
    for aff in affliction_zones:
        zone_name = aff["zone"]
        if zone_name not in primary_by_zone:
            primary_by_zone[zone_name] = aff

    secondary_by_zone: dict[str, dict] = {}
    for aff in secondary_affliction_zones:
        zone_name = aff["zone"]
        if zone_name not in secondary_by_zone:
            secondary_by_zone[zone_name] = aff

    positive_by_zone: dict[str, dict] = {}
    for pos in positive_zone_data:
        zone_name = pos["zone"]
        if zone_name not in positive_by_zone:
            positive_by_zone[zone_name] = pos

    # ------------------------------------------------------------------
    # 4. Aayadi calculation
    # ------------------------------------------------------------------
    aayadi = calculate_aayadi(
        length_ft=property["length"],
        breadth_ft=property["breadth"],
        user_nakshatra=user_nakshatra,
    )

    # ------------------------------------------------------------------
    # 5. Spatial rules
    # ------------------------------------------------------------------
    spatial_result = check_spatial_rules(
        entrance_direction=property["entrance_direction"],
        floor_level=property["floor_level"],
        kitchen_zone=room_details.get("kitchen_zone"),
        toilet_zones=room_details.get("toilet_zones"),
        brahmasthan_status=room_details.get("brahmasthan_status"),
        slope_direction=room_details.get("slope_direction"),
        user_name_initial=user_name_initial,
    )

    spatial_warning_zones = _zone_names_from_spatial(spatial_result["findings"])

    # ------------------------------------------------------------------
    # 6. Build zone_map — one entry per zone in ZONES (all 16)
    # ------------------------------------------------------------------
    zone_map: list[dict] = []
    remedies: list[dict] = []

    for zone_def in ZONES:
        zone_name = zone_def["name"]
        devtas = get_devtas_for_zone(zone_name)

        if zone_name in primary_by_zone:
            aff = primary_by_zone[zone_name]
            entry = {
                "zone": zone_name,
                "status": "afflicted",
                "planet": aff["attacker"],
                "hit_type": aff["hit_type"],
                "devtas": aff["devtas"],
            }
            remedies.append(
                _build_remedy(zone_name, aff["hit_type"], aff["attacker"], aff["devtas"], dasha_lord)
            )
        elif zone_name in secondary_by_zone or zone_name in spatial_warning_zones:
            # Prefer secondary hit data if available
            if zone_name in secondary_by_zone:
                aff = secondary_by_zone[zone_name]
                planet = aff["attacker"]
                hit_type = aff["hit_type"]
                entry_devtas = aff["devtas"]
            else:
                planet = zone_def.get("ruling_planet")
                hit_type = "spatial_warning"
                entry_devtas = devtas

            entry = {
                "zone": zone_name,
                "status": "warning",
                "planet": planet,
                "hit_type": hit_type,
                "devtas": entry_devtas,
            }
            remedies.append(
                _build_remedy(zone_name, "obstacle", planet or zone_name, entry_devtas, dasha_lord)
            )
        elif zone_name in positive_by_zone:
            pos = positive_by_zone[zone_name]
            entry = {
                "zone": zone_name,
                "status": "positive",
                "planet": pos["attacker"],
                "hit_type": pos["hit_type"],
                "devtas": pos["devtas"],
            }
            # Enhancement remedy for positive zones
            remedies.append(
                _build_remedy(zone_name, pos["hit_type"], pos["attacker"], pos["devtas"], dasha_lord)
            )
        else:
            entry = {
                "zone": zone_name,
                "status": "clear",
                "planet": zone_def.get("ruling_planet"),
                "hit_type": None,
                "devtas": devtas,
            }

        zone_map.append(entry)

    # ------------------------------------------------------------------
    # 7. Summary
    # ------------------------------------------------------------------
    status_counts: dict[str, int] = {"afflicted": 0, "warning": 0, "positive": 0, "clear": 0}
    for z in zone_map:
        status_counts[z["status"]] += 1

    summary = {
        "dasha_lord": dasha_lord,
        "total_zones": len(zone_map),
        "afflicted_zones": status_counts["afflicted"],
        "warning_zones": status_counts["warning"],
        "positive_zones": status_counts["positive"],
        "clear_zones": status_counts["clear"],
        "aayadi_harmony": aayadi["overall_harmony"],
        "spatial_overall_status": spatial_result["overall_status"],
    }

    return {
        "hits": hits,
        "aayadi": aayadi,
        "zone_map": zone_map,
        "spatial_findings": spatial_result["findings"],
        "plant_recommendations": spatial_result["plant_recommendations"],
        "remedies": remedies,
        "summary": summary,
        "disclaimer": DISCLAIMER,
    }
