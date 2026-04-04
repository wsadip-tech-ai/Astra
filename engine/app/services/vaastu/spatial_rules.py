"""
Vaastu Spatial Rules — Room Placement Validation

Checks entrance direction, kitchen/toilet placement, Brahmasthan status,
and slope direction against classical Vaastu Shastra guidelines.
"""

from __future__ import annotations


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ENTRANCE_FAVORABLE = {"N", "NE", "E", "NW"}
ENTRANCE_ACCEPTABLE = {"W", "SE"}
ENTRANCE_UNFAVORABLE = {"S", "SW", "SSW", "SSE"}

VOWEL_INITIALS = {"A", "E", "I", "O", "U"}
VOWEL_ENTRANCE_ZONES = {"N", "NE", "E", "W"}

KITCHEN_FAVORABLE = {"SE"}
KITCHEN_ACCEPTABLE = {"NW", "S"}
KITCHEN_UNFAVORABLE = {"NE", "SW", "N"}

TOILET_STRONGLY_UNFAVORABLE = {"NE"}
TOILET_ACCEPTABLE = {"SW", "S", "W"}

SLOPE_FAVORABLE = {"NE", "N", "E"}
SLOPE_UNFAVORABLE = {"SW", "S", "W"}

PLANT_RECOMMENDATIONS = [
    {
        "plant": "Snake Plant",
        "zone": "N/NE",
        "purpose": "clarity and positive energy flow",
    },
    {
        "plant": "Tulsi",
        "zone": "NE",
        "purpose": "spiritual growth and purification",
    },
    {
        "plant": "Money Plant",
        "zone": "SE",
        "purpose": "financial flow and prosperity",
    },
    {
        "plant": "Neem",
        "zone": "N",
        "purpose": "purification and health",
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _overall_status(findings: list[dict]) -> str:
    """Derive overall status from individual findings."""
    statuses = [f["status"] for f in findings]
    favorable_count = statuses.count("favorable") + statuses.count("acceptable")
    unfavorable_count = statuses.count("unfavorable")
    warning_count = statuses.count("warning")
    total = len(statuses)

    if total == 0:
        return "favorable"

    if unfavorable_count == 0 and warning_count == 0:
        return "favorable"
    if unfavorable_count == 0 and warning_count > 0:
        return "mostly_favorable"
    if unfavorable_count >= total / 2:
        return "unfavorable"
    return "needs_attention"


# ---------------------------------------------------------------------------
# Rule checkers
# ---------------------------------------------------------------------------

def _check_entrance(direction: str, user_name_initial: str | None) -> dict:
    direction_upper = direction.upper()
    initial_upper = user_name_initial.upper() if user_name_initial else None

    if direction_upper in ENTRANCE_FAVORABLE:
        status = "favorable"
        description = (
            f"Entrance facing {direction_upper} is highly auspicious per Vaastu. "
            "It welcomes positive energy (prana) into the dwelling."
        )
        remedy = None

        # Refine for name initial — vowels aligned with specific zones
        if initial_upper and initial_upper in VOWEL_INITIALS:
            if direction_upper in VOWEL_ENTRANCE_ZONES:
                description += (
                    f" Name initial '{initial_upper}' (vowel) aligns well with "
                    f"the {direction_upper} entrance, enhancing personal prosperity."
                )
            # Still favorable even if vowel doesn't specifically align
    elif direction_upper in ENTRANCE_ACCEPTABLE:
        status = "acceptable"
        description = (
            f"Entrance facing {direction_upper} is acceptable but not ideal. "
            "Some remedies can balance the energy."
        )
        remedy = "Place a Vastu pyramid or copper strip at the entrance threshold."
    elif direction_upper in ENTRANCE_UNFAVORABLE:
        status = "unfavorable"
        description = (
            f"Entrance facing {direction_upper} is inauspicious per Vaastu. "
            "This direction may introduce stress, financial strain, or health issues."
        )
        remedy = (
            "Hang a Vaastu swastik symbol above the door; place a lead strip "
            "at the threshold to neutralize negative energy."
        )
    else:
        status = "warning"
        description = (
            f"Entrance direction '{direction_upper}' is not in a standard Vaastu "
            "classification. Consult a Vaastu expert for this sub-direction."
        )
        remedy = "Seek professional Vaastu consultation for sub-directional entrances."

    finding: dict = {
        "rule": "Main Entrance",
        "status": status,
        "zone": direction_upper,
        "description": description,
    }
    if remedy:
        finding["remedy"] = remedy
    return finding


def _check_kitchen(zone: str) -> dict:
    zone_upper = zone.upper()

    if zone_upper in KITCHEN_FAVORABLE:
        status = "favorable"
        description = (
            f"Kitchen in the {zone_upper} (Agneya) zone is ideal — this is the "
            "domain of Agni (fire element), perfectly aligned for cooking."
        )
        remedy = None
    elif zone_upper in KITCHEN_ACCEPTABLE:
        status = "acceptable"
        description = (
            f"Kitchen in the {zone_upper} zone is acceptable. Energy is not "
            "optimal but manageable with minor corrections."
        )
        remedy = "Place a red light bulb in the kitchen to amplify fire energy."
    elif zone_upper in KITCHEN_UNFAVORABLE:
        status = "unfavorable"
        description = (
            f"Kitchen in the {zone_upper} zone is highly inauspicious. "
            "NE is sacred (Ishanya), and SW/N disturb elemental balance."
        )
        remedy = (
            "Relocate the kitchen to SE if possible. If not, use a pyramid "
            "corrector and avoid cooking facing East in this zone."
        )
    else:
        status = "warning"
        description = (
            f"Kitchen zone '{zone_upper}' is non-standard. Verify zone mapping."
        )
        remedy = "Consult a Vaastu expert to properly map the kitchen zone."

    finding: dict = {
        "rule": "Kitchen Placement",
        "status": status,
        "zone": zone_upper,
        "description": description,
    }
    if remedy:
        finding["remedy"] = remedy
    return finding


def _check_toilet(zones: list[str]) -> dict:
    zones_upper = [z.upper() for z in zones]

    has_ne = any(z in TOILET_STRONGLY_UNFAVORABLE for z in zones_upper)
    has_acceptable = all(z in TOILET_ACCEPTABLE for z in zones_upper)

    if has_ne:
        status = "unfavorable"
        description = (
            "Toilet in the NE zone is strongly inauspicious. NE (Ishanya) is the "
            "zone of divine energy and must never hold waste outlets."
        )
        remedy = (
            "Seal the NE toilet if possible. If not, keep the door always closed, "
            "place sea salt in a bowl inside, and use a Vaastu pyramid corrector."
        )
    elif has_acceptable:
        status = "acceptable"
        description = (
            f"Toilet(s) in {', '.join(zones_upper)} zone(s) are in acceptable "
            "positions per Vaastu. SW, S, and W are tolerable for waste zones."
        )
        remedy = "Keep toilet lids closed and use exhaust fans to prevent energy stagnation."
    else:
        status = "warning"
        description = (
            f"Toilet(s) in {', '.join(zones_upper)} zone(s) are in non-standard "
            "positions. Verify alignment with Vaastu guidelines."
        )
        remedy = "Consult a Vaastu expert for toilet placement in non-standard zones."

    finding: dict = {
        "rule": "Toilet Placement",
        "status": status,
        "zone": ", ".join(zones_upper),
        "description": description,
    }
    if remedy:
        finding["remedy"] = remedy
    return finding


def _check_brahmasthan(status_value: str) -> dict:
    status_lower = status_value.lower()

    if status_lower == "open":
        status = "favorable"
        description = (
            "The Brahmasthan (central zone) is open and unobstructed. "
            "This allows free circulation of cosmic energy (prana) throughout the space."
        )
        remedy = None
    elif status_lower == "pillared":
        status = "warning"
        description = (
            "Pillars in the Brahmasthan create partial obstruction. "
            "While structurally common, this can impede energy flow."
        )
        remedy = (
            "Wrap pillars with copper wire or place a crystal ball at the center "
            "to redirect energy flow around obstructions."
        )
    elif status_lower == "walled":
        status = "unfavorable"
        description = (
            "The Brahmasthan is enclosed or walled, blocking the central energy vortex. "
            "This is considered highly inauspicious and may cause stagnation in all life areas."
        )
        remedy = (
            "Place a large crystal or copper pyramid at the Brahmasthan center. "
            "Introduce natural light via skylight if structurally possible."
        )
    else:
        status = "warning"
        description = f"Brahmasthan status '{status_value}' is unrecognized. Expected: open, pillared, or walled."
        remedy = "Assess the Brahmasthan and classify as open, pillared, or walled."

    finding: dict = {
        "rule": "Brahmasthan",
        "status": status,
        "detail": status_value,
        "description": description,
    }
    if remedy:
        finding["remedy"] = remedy
    return finding


def _check_slope(direction: str) -> dict:
    direction_upper = direction.upper()

    if direction_upper in SLOPE_FAVORABLE:
        status = "favorable"
        description = (
            f"Plot slope toward {direction_upper} is auspicious. "
            "Slopes toward NE, N, or E allow energy and water to flow in beneficial directions."
        )
        remedy = None
    elif direction_upper in SLOPE_UNFAVORABLE:
        status = "unfavorable"
        description = (
            f"Plot slope toward {direction_upper} is inauspicious. "
            "Slopes toward SW, S, or W cause energy to drain in unfavorable directions."
        )
        remedy = (
            "Use landscaping to redirect slope or install Vaastu energy correctors "
            "at the SW/S/W corners to counteract energy drain."
        )
    else:
        status = "warning"
        description = (
            f"Plot slope direction '{direction_upper}' is in a neutral or sub-directional zone. "
            "Minor corrections may be needed."
        )
        remedy = "Consult a Vaastu expert to evaluate sub-directional slope impact."

    finding: dict = {
        "rule": "Plot Slope",
        "status": status,
        "zone": direction_upper,
        "description": description,
    }
    if remedy:
        finding["remedy"] = remedy
    return finding


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def check_spatial_rules(
    entrance_direction: str,
    floor_level: str,
    kitchen_zone: str | None = None,
    toilet_zones: list[str] | None = None,
    brahmasthan_status: str | None = None,
    slope_direction: str | None = None,
    user_name_initial: str | None = None,
) -> dict:
    """
    Validate room placement against Vaastu Shastra spatial rules.

    Parameters
    ----------
    entrance_direction : str
        Cardinal or intercardinal direction of the main entrance (e.g. "N", "SW").
    floor_level : str
        Floor level of the unit (e.g. "ground", "first", "second").
    kitchen_zone : str, optional
        Vaastu zone where the kitchen is located (e.g. "SE", "NE").
    toilet_zones : list[str], optional
        List of Vaastu zones containing toilets/bathrooms.
    brahmasthan_status : str, optional
        State of the central zone: "open", "pillared", or "walled".
    slope_direction : str, optional
        Direction toward which the plot slopes (e.g. "NE", "SW").
    user_name_initial : str, optional
        First letter of the primary resident's name for name-initial mapping.

    Returns
    -------
    dict
        findings : list[dict]
            Each finding has rule, status, zone/detail, description, optional remedy.
        plant_recommendations : list[dict]
            Recommended plants with zone and purpose.
        overall_status : str
            One of: "favorable", "mostly_favorable", "needs_attention", "unfavorable".
    """
    findings: list[dict] = []

    # Entrance is always evaluated
    findings.append(_check_entrance(entrance_direction, user_name_initial))

    # Optional rules — only evaluated when data is provided
    if kitchen_zone is not None:
        findings.append(_check_kitchen(kitchen_zone))

    if toilet_zones is not None:
        findings.append(_check_toilet(toilet_zones))

    if brahmasthan_status is not None:
        findings.append(_check_brahmasthan(brahmasthan_status))

    if slope_direction is not None:
        findings.append(_check_slope(slope_direction))

    return {
        "findings": findings,
        "plant_recommendations": PLANT_RECOMMENDATIONS,
        "overall_status": _overall_status(findings),
    }
