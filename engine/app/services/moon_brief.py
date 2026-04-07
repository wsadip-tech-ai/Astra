"""
Daily Moon brief — what the Moon's current position means for daily activities.
"""

MOON_SIGN_BRIEFS: dict[str, dict] = {
    "Mesha": {
        "mood": "Bold and impulsive",
        "best_for": "Starting new projects, physical activity, taking initiative",
        "avoid": "Rushing into arguments, impatient decisions",
        "element": "Fire",
        "mantra": "Channel your fire into action, not reaction",
    },
    "Vrishabha": {
        "mood": "Steady and sensual",
        "best_for": "Financial planning, cooking, enjoying nature, self-care",
        "avoid": "Stubbornness, overspending on luxuries",
        "element": "Earth",
        "mantra": "Build something lasting today",
    },
    "Mithuna": {
        "mood": "Curious and talkative",
        "best_for": "Networking, writing, learning, short trips",
        "avoid": "Gossip, scattered focus, overcommitting",
        "element": "Air",
        "mantra": "Connect, learn, and share — but finish what you start",
    },
    "Karka": {
        "mood": "Nurturing and emotional",
        "best_for": "Family time, home projects, emotional conversations, cooking",
        "avoid": "Taking things too personally, emotional eating",
        "element": "Water",
        "mantra": "Your sensitivity is a strength — nurture yourself first",
    },
    "Simha": {
        "mood": "Confident and creative",
        "best_for": "Presentations, creative work, romance, leadership",
        "avoid": "Ego clashes, demanding attention, drama",
        "element": "Fire",
        "mantra": "Shine bright, but let others shine too",
    },
    "Kanya": {
        "mood": "Analytical and detail-oriented",
        "best_for": "Organizing, health routines, editing, problem-solving",
        "avoid": "Overthinking, criticism of self and others, perfectionism",
        "element": "Earth",
        "mantra": "Progress over perfection",
    },
    "Tula": {
        "mood": "Diplomatic and harmony-seeking",
        "best_for": "Negotiations, relationships, art, social gatherings",
        "avoid": "People-pleasing, indecision, avoiding conflict that needs addressing",
        "element": "Air",
        "mantra": "Balance is not about pleasing everyone — it starts with you",
    },
    "Vrishchika": {
        "mood": "Intense and transformative",
        "best_for": "Deep research, therapy, intimacy, clearing debts, letting go",
        "avoid": "Jealousy, obsessive thinking, power struggles",
        "element": "Water",
        "mantra": "Let go of what no longer serves you",
    },
    "Dhanu": {
        "mood": "Optimistic and adventurous",
        "best_for": "Travel planning, higher learning, philosophy, outdoor activities",
        "avoid": "Overconfidence, blunt remarks, ignoring details",
        "element": "Fire",
        "mantra": "Aim high, but stay grounded in the present",
    },
    "Makara": {
        "mood": "Disciplined and ambitious",
        "best_for": "Career work, long-term planning, authority tasks, structure",
        "avoid": "Being too rigid, neglecting emotions, overworking",
        "element": "Earth",
        "mantra": "Build your empire one disciplined step at a time",
    },
    "Kumbha": {
        "mood": "Innovative and detached",
        "best_for": "Brainstorming, technology, social causes, unconventional ideas",
        "avoid": "Emotional coldness, rebellion for its own sake",
        "element": "Air",
        "mantra": "Your unique vision is needed — share it",
    },
    "Meena": {
        "mood": "Dreamy and intuitive",
        "best_for": "Meditation, creative arts, compassion, spiritual practice",
        "avoid": "Escapism, unclear boundaries, substance use",
        "element": "Water",
        "mantra": "Trust your intuition — it's speaking clearly today",
    },
}

# Daily remedies based on the day of the week (Vedic tradition)
DAY_REMEDIES: dict[str, dict] = {
    "Monday": {"planet": "Moon", "remedy": "Wear white or silver, drink milk or water from a silver vessel", "deity": "Lord Shiva", "mantra": "Om Chandraya Namah"},
    "Tuesday": {"planet": "Mars", "remedy": "Donate red lentils, wear red, practice physical exercise", "deity": "Lord Hanuman", "mantra": "Om Mangalaya Namah"},
    "Wednesday": {"planet": "Mercury", "remedy": "Donate green moong, wear green, practice clear communication", "deity": "Lord Vishnu", "mantra": "Om Budhaya Namah"},
    "Thursday": {"planet": "Jupiter", "remedy": "Donate turmeric, wear yellow, teach or learn something new", "deity": "Lord Brihaspati", "mantra": "Om Gurave Namah"},
    "Friday": {"planet": "Venus", "remedy": "Donate white rice, wear white or pastel colors, appreciate beauty", "deity": "Goddess Lakshmi", "mantra": "Om Shukraya Namah"},
    "Saturday": {"planet": "Saturn", "remedy": "Donate black sesame, serve the elderly, practice discipline", "deity": "Lord Shani", "mantra": "Om Shanaischaraya Namah"},
    "Sunday": {"planet": "Sun", "remedy": "Offer water to the Sun at sunrise, wear ruby red, practice confidence", "deity": "Lord Surya", "mantra": "Om Suryaya Namah"},
}


def get_moon_brief(moon_sign: str, moon_nakshatra: str, day_of_week: str) -> dict:
    """Get today's Moon brief with mood, activities, and daily remedy."""
    brief = MOON_SIGN_BRIEFS.get(moon_sign, MOON_SIGN_BRIEFS["Mesha"])
    remedy = DAY_REMEDIES.get(day_of_week, DAY_REMEDIES["Monday"])

    return {
        "moon_sign": moon_sign,
        "moon_nakshatra": moon_nakshatra,
        "mood": brief["mood"],
        "best_for": brief["best_for"],
        "avoid": brief["avoid"],
        "element": brief["element"],
        "daily_mantra": brief["mantra"],
        "daily_remedy": remedy,
    }
