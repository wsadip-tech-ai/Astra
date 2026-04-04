"""
Vedic astrology interpretation lookup tables.

Pure data module — no AI, no external dependencies.
All meanings are based on traditional Jyotish (Vedic astrology) principles.
"""

# ---------------------------------------------------------------------------
# Sign lords
# ---------------------------------------------------------------------------

SIGN_LORDS: dict[str, str] = {
    "Mesha": "Mars",
    "Vrishabha": "Venus",
    "Mithuna": "Mercury",
    "Karka": "Moon",
    "Simha": "Sun",
    "Kanya": "Mercury",
    "Tula": "Venus",
    "Vrishchika": "Mars",
    "Dhanu": "Jupiter",
    "Makara": "Saturn",
    "Kumbha": "Saturn",
    "Meena": "Jupiter",
}

# ---------------------------------------------------------------------------
# Planet-in-sign lookup  (9 grahas × 12 signs = 108 entries)
# ---------------------------------------------------------------------------

_PLANET_IN_SIGN: dict[str, dict[str, str]] = {
    "Sun": {
        "Mesha": "Sun is exalted in Mesha, bestowing exceptional vitality, leadership, and courage. The native shines brightly and commands authority wherever they go.",
        "Vrishabha": "Sun in Vrishabha creates a tension between solar ego and Venusian comfort, producing a determined yet pleasure-loving personality. Finances and status are strongly linked in the native's mind.",
        "Mithuna": "Sun in Mithuna brightens the intellect and sharpens communicative ability. The native is curious, articulate, and excels in roles that require wit and information-sharing.",
        "Karka": "Sun in Karka is in its friendly sign ruled by the Moon, fostering emotional warmth and a strong connection to home and family. The native may struggle to balance personal pride with nurturing instincts.",
        "Simha": "Sun in own sign Simha is powerful and dignified, granting charisma, generosity, and a natural ability to lead. The native radiates confidence and is drawn to creative or royal pursuits.",
        "Kanya": "Sun in Kanya is in the sign of analysis and service, making the native detail-oriented, hardworking, and critical. Health and professional refinement become key life themes.",
        "Tula": "Sun is debilitated in Tula, weakening self-assertion and making the native overly dependent on others' approval. Partnerships dominate the life, sometimes at the expense of personal identity.",
        "Vrishchika": "Sun in Vrishchika gives intensity, investigative drive, and an interest in hidden or occult matters. The native is resilient but must guard against secretiveness and power struggles.",
        "Dhanu": "Sun in Dhanu is well-placed in the sign of philosophy and wisdom, elevating the native's moral stature and bestowing a love of higher learning, travel, and righteousness.",
        "Makara": "Sun in Makara gives ambition, discipline, and a slow but steady rise to positions of authority. The native is practical and earns respect through sustained effort.",
        "Kumbha": "Sun in Kumbha creates an independent, humanitarian personality who values ideals over personal glory. There can be friction between ego and collective causes.",
        "Meena": "Sun in Meena softens the solar ego, making the native spiritual, compassionate, and sometimes escapist. Creative gifts flourish, but self-discipline may be lacking.",
    },
    "Moon": {
        "Mesha": "Moon in Mesha gives an impulsive, energetic emotional nature and a quick temper that passes just as swiftly. The native craves independence and reacts spontaneously to life's challenges.",
        "Vrishabha": "Moon is exalted in Vrishabha, bringing emotional stability, sensory richness, and a deep appreciation for beauty and comfort. The native has a calm, loyal, and steadfast heart.",
        "Mithuna": "Moon in Mithuna makes the mind restless and versatile, with a constant hunger for new information and social interaction. The native is witty but may lack emotional depth.",
        "Karka": "Moon in own sign Karka is very strong, heightening intuition, emotional sensitivity, and maternal instincts. The native is deeply connected to family, roots, and tradition.",
        "Simha": "Moon in Simha gives emotional pride, generosity, and a need for recognition and love. The native is warm-hearted and gravitates toward creative self-expression.",
        "Kanya": "Moon in Kanya creates an analytical, service-oriented emotional temperament. The native worries easily but channels anxiety into meticulous care for others' well-being.",
        "Tula": "Moon in Tula confers charm, diplomacy, and an innate need for harmonious relationships. The native is aesthetically sensitive and seeks balance in all emotional matters.",
        "Vrishchika": "Moon is debilitated in Vrishchika, intensifying emotions to the point of turbulence and hidden jealousy. The native experiences powerful psychological transformations throughout life.",
        "Dhanu": "Moon in Dhanu gives an optimistic, expansive emotional nature and a love of freedom, philosophy, and travel. The native's mood lifts when engaged in learning or adventure.",
        "Makara": "Moon in Makara creates emotional restraint, ambition, and a tendency to suppress feelings for the sake of duty. The native may find emotional fulfilment through achievement.",
        "Kumbha": "Moon in Kumbha gives a detached, idealistic emotional nature with strong humanitarian impulses. The native values friendship and social causes over personal emotional ties.",
        "Meena": "Moon in Meena is sensitive, empathetic, and highly intuitive, often bordering on psychic. The native absorbs the emotions of those around them and needs time alone to recharge.",
    },
    "Mercury": {
        "Mesha": "Mercury in Mesha makes the mind quick, direct, and assertive in communication. The native speaks with confidence but may lack patience for detail.",
        "Vrishabha": "Mercury in Vrishabha gives a practical, methodical mind with an affinity for music, art, and finance. Thinking is slow but thorough and reliable.",
        "Mithuna": "Mercury in own sign Mithuna is highly intellectual, versatile, and communicative. The native excels at language, trade, and any field requiring rapid information processing.",
        "Karka": "Mercury in Karka blends logic with intuition, giving an imaginative and emotionally coloured thought process. The native is a good storyteller and sensitive communicator.",
        "Simha": "Mercury in Simha gives a creative, dramatic intellect with strong leadership in communication. The native speaks authoritatively and has talent for performance.",
        "Kanya": "Mercury is exalted and in own sign in Kanya, producing the finest analytical mind in the zodiac. The native excels in medicine, accounting, writing, and any precision-based profession.",
        "Tula": "Mercury in Tula gives a balanced, diplomatic mind that weighs all sides before speaking. The native is skilled in negotiation and values fairness in discourse.",
        "Vrishchika": "Mercury in Vrishchika gives a probing, investigative intellect that excels at uncovering secrets. The native is sharp, strategic, and can be psychologically perceptive.",
        "Dhanu": "Mercury in Dhanu broadens the mind toward philosophy, law, and higher education. The native is visionary but may overlook finer details in favour of grand ideas.",
        "Makara": "Mercury in Makara gives a structured, disciplined, and practical intellect suited for business, administration, and engineering.",
        "Kumbha": "Mercury in Kumbha fosters original, unconventional thinking with a flair for technology and social reform. The native is inventive and ahead of their time.",
        "Meena": "Mercury is debilitated in Meena, where the analytical faculty is weakened by imagination and emotion. The native may be creative and intuitive but struggles with logical precision.",
    },
    "Venus": {
        "Mesha": "Venus in Mesha creates passionate, impulsive romantic inclinations and a love of adventure in relationships. The native is direct in expressing affection but may tire quickly.",
        "Vrishabha": "Venus in own sign Vrishabha is luxurious, sensual, and deeply appreciative of beauty, comfort, and material pleasures. The native has a refined aesthetic sense.",
        "Mithuna": "Venus in Mithuna gives charm through wit and conversation, attracting love through intellectual connection. The native is flirtatious and seeks a mentally stimulating partner.",
        "Karka": "Venus in Karka is nurturing and emotionally sensitive in love, craving security and domesticity. The native is devoted but can be overly possessive.",
        "Simha": "Venus in Simha loves with great passion, generosity, and drama. The native seeks a grand romantic story and enjoys lavishing gifts and attention on loved ones.",
        "Kanya": "Venus is debilitated in Kanya, where critical analysis undermines natural affection. The native may be excessively particular about partners and find it hard to relax into love.",
        "Tula": "Venus in own sign Tula is at its most graceful — refined, diplomatic, and idealistic about partnerships. The native has a keen sense of justice and extraordinary aesthetic ability.",
        "Vrishchika": "Venus in Vrishchika intensifies desire and creates deep, transformative romantic bonds. The native is magnetically attractive but relationships carry themes of jealousy and power.",
        "Dhanu": "Venus in Dhanu loves freedom, adventure, and philosophical companionship. The native is generous and seeks a partner who shares their ideals and love of travel.",
        "Makara": "Venus in Makara is practical and loyal in love, preferring stable, long-term partnerships over whirlwind romances. The native may marry for social standing.",
        "Kumbha": "Venus in Kumbha is unconventional in relationships, valuing friendship and intellectual connection equally with romance. The native may prefer open or non-traditional partnerships.",
        "Meena": "Venus is exalted in Meena, giving the purest, most selfless and spiritual form of love. The native is deeply compassionate, creative, and capable of great artistic beauty.",
    },
    "Mars": {
        "Mesha": "Mars in own sign Mesha is fierce, courageous, and enterprising. The native is a natural leader with tremendous drive and the ability to initiate bold action.",
        "Vrishabha": "Mars in Vrishabha channels energy into acquiring wealth and comfort, making the native persistent and financially ambitious. Stubbornness can be a challenge.",
        "Mithuna": "Mars in Mithuna gives sharp debate skills and mental agility in conflict. The native argues effectively but may scatter energy across too many intellectual pursuits.",
        "Karka": "Mars is debilitated in Karka, weakening will and direction. Energy is coloured by emotion, leading to passive-aggressive patterns or misdirected action in family matters.",
        "Simha": "Mars in Simha is regal and authoritative, bestowing leadership, physical vitality, and a competitive spirit. The native commands respect but must temper arrogance.",
        "Kanya": "Mars in Kanya channels energy into meticulous work, service, and problem-solving. The native is a skilled technician or surgeon but may be overly critical of others.",
        "Vrishchika": "Mars in own sign Vrishchika is deeply strategic, tenacious, and intensely focused on transformation. The native has phenomenal endurance and is formidable in any contest.",
        "Dhanu": "Mars in Dhanu gives crusading energy in pursuit of ideals, religion, or justice. The native is passionate about righteous causes and willing to fight for beliefs.",
        "Makara": "Mars is exalted in Makara, giving disciplined, strategic ambition and the ability to achieve great things through sustained effort. The native is a born executive.",
        "Kumbha": "Mars in Kumbha channels drive toward social reform, technology, and group endeavours. The native is motivated by humanitarian or revolutionary ideals.",
        "Tula": "Mars in Tula is uncomfortable in Venus's airy domain, producing vacillation in action and conflict in relationships. The native may find it hard to assert themselves directly.",
        "Meena": "Mars in Meena gives spiritual motivation for action, but energy can dissipate into daydreaming. The native may excel in creative, charitable, or meditative disciplines.",
    },
    "Jupiter": {
        "Mesha": "Jupiter in Mesha gives bold, pioneering wisdom and an enthusiastic philosophical outlook. The native is a natural teacher and inspires others through courageous idealism.",
        "Vrishabha": "Jupiter in Vrishabha expands wealth, sensual pleasures, and material prosperity. The native is generous, enjoys luxury, and has a talent for accumulating assets.",
        "Mithuna": "Jupiter in Mithuna gives intellectual breadth, multilingualism, and success in communication-based professions. The native may spread knowledge across many subjects.",
        "Karka": "Jupiter is exalted in Karka, producing deep wisdom, emotional generosity, and spiritual sensitivity. The native is blessed in matters of family, home, and spiritual growth.",
        "Simha": "Jupiter in Simha confers royal dignity, leadership, and a magnanimous character. The native earns respect through creative and educational achievements.",
        "Kanya": "Jupiter in Kanya expands the capacity for analysis, healing, and selfless service. The native may pursue medicine, law, or scholarship with great dedication.",
        "Tula": "Jupiter in Tula bestows justice, fairness, and skill in legal or diplomatic fields. The native has a well-developed sense of dharma in relationships.",
        "Vrishchika": "Jupiter in Vrishchika gives depth of esoteric knowledge and the ability to transform others through wisdom. The native is attracted to occult sciences and hidden truths.",
        "Dhanu": "Jupiter in own sign Dhanu is highly auspicious, conferring great wisdom, righteousness, and fortune. The native is a natural philosopher, teacher, or spiritual guide.",
        "Makara": "Jupiter is debilitated in Makara, where expansive optimism clashes with Saturn's restraint. Wisdom may be delayed or materialised only through practical, worldly effort.",
        "Kumbha": "Jupiter in Kumbha gives a broad, humanitarian vision and the ability to benefit society through knowledge and reform. The native thinks in large, systemic terms.",
        "Meena": "Jupiter in own sign Meena radiates compassion, spiritual grace, and deep inner wisdom. The native is intuitive, giving, and often draws blessings in a seemingly effortless way.",
    },
    "Saturn": {
        "Mesha": "Saturn is debilitated in Mesha, where its slow deliberation conflicts with Mars's fiery urgency. The native may experience chronic frustration and delayed results in areas ruled by the 1st house.",
        "Vrishabha": "Saturn in Vrishabha brings patient, systematic accumulation of wealth and resources. The native works hard for material security and may experience financial gains later in life.",
        "Mithuna": "Saturn in Mithuna disciplines the mind, producing serious, methodical thinking. The native may excel in academic research, technical writing, or structured communication.",
        "Karka": "Saturn in Karka restricts emotional expression and creates distance from family and mother. The native learns emotional maturity through hardship and must consciously cultivate warmth.",
        "Simha": "Saturn in Simha suppresses the need for recognition and creative self-expression. The native earns authority through sustained effort rather than natural brilliance.",
        "Kanya": "Saturn in Kanya is well-suited to meticulous service and disciplined analysis. The native thrives in medicine, engineering, or administrative roles requiring precision and endurance.",
        "Tula": "Saturn is exalted in Tula, granting exceptional fairness, judicial authority, and the ability to administer justice with discipline and wisdom. A supremely strong Saturn placement.",
        "Vrishchika": "Saturn in Vrishchika creates intense, karmic challenges in areas of transformation, inheritance, and shared resources. The native develops resilience through crisis.",
        "Dhanu": "Saturn in Dhanu disciplines philosophical beliefs and demands proof before faith. The native may struggle with religious dogma but ultimately builds a mature, tested worldview.",
        "Makara": "Saturn in own sign Makara is highly dignified, giving tremendous ambition, discipline, and the capacity for long-term achievement. The native is a tireless builder.",
        "Kumbha": "Saturn in own sign Kumbha is powerful and socially oriented, driving the native toward systemic reform and the disciplined pursuit of humanitarian ideals.",
        "Meena": "Saturn in Meena creates karmic obligations in spiritual or charitable matters. The native may carry burdens from past lives but finds liberation through surrender and service.",
    },
    "Rahu": {
        "Mesha": "Rahu in Mesha drives an insatiable desire for individuality, action, and pioneering achievement. The native is magnetically bold but may be reckless in pursuit of ambition.",
        "Vrishabha": "Rahu is exalted in Vrishabha, amplifying desires for wealth, beauty, and sensory pleasure to extraordinary levels. The native can accumulate great material prosperity.",
        "Mithuna": "Rahu in Mithuna creates an obsession with communication, technology, and information. The native is gifted at blending multiple cultures or fields of knowledge.",
        "Karka": "Rahu in Karka intensifies emotional needs and cravings for security and belonging. Family matters and the mother may be sources of unusual or destabilising experiences.",
        "Simha": "Rahu in Simha craves fame, power, and the spotlight. The native is drawn to politics, entertainment, or any field where public recognition is the primary reward.",
        "Kanya": "Rahu in Kanya gives an obsessive focus on perfection, analytical detail, and practical problem-solving. The native may rise through unconventional expertise in technical fields.",
        "Tula": "Rahu in Tula amplifies the desire for ideal partnerships and social prestige. The native navigates relationships with great intensity and may attract unusual or foreign partners.",
        "Vrishchika": "Rahu in Vrishchika is deeply intense, driving the native toward hidden knowledge, occult practices, and transformative power. Past-life karmas surface prominently.",
        "Dhanu": "Rahu in Dhanu creates an obsession with foreign cultures, higher knowledge, and expanding belief systems. The native may overreach ideologically.",
        "Makara": "Rahu in Makara greatly amplifies ambition and the drive for worldly status and authority. The native can achieve remarkable material success through unconventional means.",
        "Kumbha": "Rahu in Kumbha gives a maverick spirit, technological genius, and a desire to revolutionise society. The native thrives in cutting-edge, group-oriented fields.",
        "Meena": "Rahu in Meena can create confusion between spirituality and illusion. The native is drawn to mysticism, foreign lands, and transcendent experiences, sometimes unwisely.",
    },
    "Ketu": {
        "Mesha": "Ketu in Mesha brings detachment from personal ambition and identity. The native has mastered self-assertion in past lives and now seeks deeper, less ego-driven paths.",
        "Vrishabha": "Ketu in Vrishabha creates disinterest in accumulating wealth or possessions despite natural skill. The native may renounce material comforts in favour of spiritual simplicity.",
        "Mithuna": "Ketu in Mithuna gives intuitive rather than analytical intelligence, and the native may speak rarely but with great insight. Routine communication feels hollow.",
        "Karka": "Ketu in Karka produces detachment from family ties and domestic life. Past-life emotional karmas surface here, requiring resolution through forgiveness and release.",
        "Simha": "Ketu in Simha creates detachment from ego, fame, and recognition. The native is spiritually inclined and may shun the spotlight despite having real leadership qualities.",
        "Kanya": "Ketu in Kanya gives an intuitive approach to analysis, bypassing linear logic. The native is perceptive in healing arts but may be disorganised or indifferent to details.",
        "Tula": "Ketu in Tula produces disenchantment with partnerships and social niceties. The native has deep past-life experience with relationships and now seeks inner balance.",
        "Vrishchika": "Ketu is exalted in Vrishchika, giving extraordinary psychic ability, mastery of occult sciences, and the capacity to transcend the ego through deep transformation.",
        "Dhanu": "Ketu in Dhanu gives past-life wisdom in philosophy and religion, but the native may feel spiritually restless or disenchanted with formal belief systems.",
        "Makara": "Ketu in Makara brings detachment from career, social status, and worldly ambitions. The native may inexplicably walk away from success in pursuit of inner meaning.",
        "Kumbha": "Ketu in Kumbha gives unconventional, rebellious detachment from social norms. The native may have prophetic insights but struggles to stay grounded in practical reality.",
        "Meena": "Ketu in Meena deepens spiritual sensitivity and compassion, often producing a mystic or renunciant. The native naturally dissolves ego boundaries and seeks moksha.",
    },
}


def get_planet_in_sign(planet: str, sign: str) -> str:
    """Return a traditional Vedic interpretation of a planet placed in a sign."""
    entry = _PLANET_IN_SIGN.get(planet, {}).get(sign)
    if entry is None:
        return f"Interpretation not available for {planet} in {sign}."
    return entry


# ---------------------------------------------------------------------------
# Planet-in-house lookup  (9 grahas × 12 houses = 108 entries)
# ---------------------------------------------------------------------------

_PLANET_IN_HOUSE: dict[str, dict[int, str]] = {
    "Sun": {
        1: "Sun in the 1st house (Tanu) bestows a radiant, authoritative personality with strong vitality and natural leadership. The native is proud, self-reliant, and draws attention effortlessly.",
        2: "Sun in the 2nd house (Dhana) places identity and ego around wealth and family legacy. The native speaks with authority and may earn through government or leadership roles.",
        3: "Sun in the 3rd house strengthens courage, communication, and the relationship with siblings. The native is bold in self-expression and excels in media, writing, or performing arts.",
        4: "Sun in the 4th house (Matru) can create tension with the mother or dominant father figures at home. The native seeks recognition within the domestic sphere and may own property.",
        5: "Sun in the 5th house is highly auspicious for creativity, children, and intelligence. The native is inspired in artistic pursuits and leadership, earning esteem through original thought.",
        6: "Sun in the 6th house (Shatru) gives the strength to overcome enemies, disease, and competition. The native excels in service, law, or medicine and has a resilient constitution.",
        7: "Sun in the 7th house (Kalatra) can create ego clashes in marriage and business partnerships. The native seeks a powerful, prominent partner but must cultivate compromise.",
        8: "Sun in the 8th house challenges ego through crises, secrecy, and sudden reversals. The native is drawn to research, inheritance, and occult knowledge, gaining wisdom through suffering.",
        9: "Sun in the 9th house (Bhagya) is highly fortunate, bestowing good karma, righteous conduct, and the grace of the father or guru. The native thrives in law, philosophy, and higher education.",
        10: "Sun in the 10th house (Karma) is one of the most powerful career placements, granting authority, recognition, and the potential for public prominence. The native is born to lead.",
        11: "Sun in the 11th house (Labha) brings gains through networks, elder siblings, and influential friends. The native achieves social goals and may accumulate wealth through leadership.",
        12: "Sun in the 12th house (Vyaya) can drain vitality and create isolation or foreign-land residence. The native may excel in spiritual pursuits, hospitals, or behind-the-scenes roles.",
    },
    "Moon": {
        1: "Moon in the 1st house (Tanu) gives a highly sensitive, empathic, and emotionally expressive personality. The native is receptive, nurturing, and strongly influenced by the public.",
        2: "Moon in the 2nd house (Dhana) brings fluctuating finances and a strong emotional attachment to family wealth and speech. The native has a melodious voice and fertile imagination.",
        3: "Moon in the 3rd house gives an imaginative mind, emotional bonds with siblings, and skill in writing or storytelling. Travel and communication are coloured by mood swings.",
        4: "Moon in the 4th house (Matru) is its favourite placement, conferring deep happiness at home, a loving mother, and strong real-estate fortune. Emotional security is paramount.",
        5: "Moon in the 5th house blesses the native with creative children, a fertile mind, and genuine joy in romance. Intuition guides artistic and speculative ventures successfully.",
        6: "Moon in the 6th house (Shatru) can cause health fluctuations, emotional conflict with colleagues, and a susceptibility to digestive complaints. Serving others heals the native.",
        7: "Moon in the 7th house (Kalatra) creates a loving, emotionally expressive partner and strong public appeal. Relationships are nurturing but the native may become emotionally dependent.",
        8: "Moon in the 8th house intensifies psychological depth, intuition, and interest in mysteries. The native may experience emotional upheavals but develops powerful healing abilities.",
        9: "Moon in the 9th house (Bhagya) gives devotion to the guru, love of philosophy, and fortunate long-distance travel. The native has an instinctive understanding of higher truths.",
        10: "Moon in the 10th house (Karma) gives public fame, popularity with the masses, and a career connected to service, nurturing, or the public. The native's career waxes and wanes like the Moon.",
        11: "Moon in the 11th house (Labha) brings financial gains through fluctuating but ultimately beneficial social networks. The native fulfils wishes through emotional intelligence.",
        12: "Moon in the 12th house (Vyaya) creates a reclusive, introspective emotional nature. The native may feel exiled from mainstream life but possesses deep spiritual intuition.",
    },
    "Mercury": {
        1: "Mercury in the 1st house (Tanu) gives a quick, curious, and youthful personality with exceptional verbal and written intelligence. The native appears younger than their age.",
        2: "Mercury in the 2nd house (Dhana) gives eloquence, business acumen, and financial gains through communication and trade. The native earns through the power of the spoken or written word.",
        3: "Mercury in the 3rd house is highly comfortable, greatly enhancing writing, journalism, teaching, and sibling relationships. The native has a razor-sharp, versatile mind.",
        4: "Mercury in the 4th house (Matru) gives an intellectual approach to domestic life and a mentally stimulating home environment. The native may work from home or deal in real estate.",
        5: "Mercury in the 5th house bestows intellectual creativity, skill in teaching and counselling children, and talent for strategic games. The native has a playful, inventive mind.",
        6: "Mercury in the 6th house (Shatru) gives analytical skill in health, law, and conflict resolution. The native is adept at defeating opponents through clever argument.",
        7: "Mercury in the 7th house (Kalatra) attracts an intellectual, communicative partner and success in trade and negotiation. Business partnerships formed through wit flourish.",
        8: "Mercury in the 8th house gives a penetrating, research-oriented intellect drawn to occult sciences, investigation, and hidden knowledge. Inheritance may come through paperwork.",
        9: "Mercury in the 9th house (Bhagya) gives a philosophical and learned mind with skill in teaching, law, and sacred texts. The native may write influential religious or academic works.",
        10: "Mercury in the 10th house (Karma) is excellent for careers in communication, technology, commerce, and education. The native's sharp intellect drives professional success.",
        11: "Mercury in the 11th house (Labha) brings gains through intellectual networks, trade, and skilled friends. The native fulfils ambitions through clever communication and strategy.",
        12: "Mercury in the 12th house (Vyaya) can scatter mental energy into worry, hidden schemes, or foreign correspondence. The native may excel in writing, research, or spiritual study in seclusion.",
    },
    "Venus": {
        1: "Venus in the 1st house (Tanu) bestows physical beauty, charm, artistic talent, and a naturally pleasing manner. The native is magnetically attractive and socially graceful.",
        2: "Venus in the 2nd house (Dhana) brings wealth through luxury goods, arts, and beauty-related trades. The native has a melodious voice and enjoys fine food and family pleasures.",
        3: "Venus in the 3rd house gives artistic communicative ability, harmonious sibling relationships, and skill in the fine arts, music, and creative writing.",
        4: "Venus in the 4th house (Matru) creates a beautiful, comfortable home and a loving relationship with the mother. The native has a refined taste for interior decoration and real estate.",
        5: "Venus in the 5th house is highly auspicious for romance, creativity, and children. The native has a gift for the performing arts and draws love naturally into their life.",
        6: "Venus in the 6th house (Shatru) may bring challenges in love through health issues or conflict with colleagues. The native may earn through health, beauty, or service industries.",
        7: "Venus in the 7th house (Kalatra) is among the finest placements for a loving, beautiful, and harmonious marriage. The native naturally attracts gracious, artistic partners.",
        8: "Venus in the 8th house gives a deep, passionate romantic nature and potential gains through a partner's wealth or inheritance. Occult knowledge and sensuality are interwoven.",
        9: "Venus in the 9th house (Bhagya) brings blessings through a refined, cultured guru and foreign travel for pleasure. The native values beauty in philosophy and spiritual practice.",
        10: "Venus in the 10th house (Karma) gives a career in arts, diplomacy, fashion, or any beauty-related field. The native earns public admiration and professional success through charm.",
        11: "Venus in the 11th house (Labha) brings financial gains through artistic networks, influential female friends, and luxury goods. Desires are fulfilled with relative ease.",
        12: "Venus in the 12th house (Vyaya) can indicate secret love affairs, hidden creative talents, or spiritual devotion as a form of love. The native may find fulfilment in foreign lands.",
    },
    "Mars": {
        1: "Mars in the 1st house (Tanu) creates an energetic, assertive, and competitive personality. The native is physically courageous and impulsive; anger must be consciously managed.",
        2: "Mars in the 2nd house (Dhana) drives aggressive earning and can cause harsh speech. The native is resourceful and may accumulate wealth through competitive effort or conflict.",
        3: "Mars in the 3rd house greatly strengthens courage, initiative, and the drive to overcome obstacles. The native is valiant with siblings and excels in sports, writing, or military arts.",
        4: "Mars in the 4th house (Matru) can disturb domestic peace through conflicts with the mother or property disputes. The native's home environment is energetic and sometimes combative.",
        5: "Mars in the 5th house gives competitive intelligence, passion in romance, and a strong-willed approach to children and creative expression. Speculation may be risky.",
        6: "Mars in the 6th house (Shatru) is excellent for overcoming enemies, disease, and competition. The native is a fierce warrior in legal, medical, or athletic arenas.",
        7: "Mars in the 7th house (Kalatra) is a classic Mangal dosha placement, indicating potential conflict or passion in marriage. The native needs a strong, independent partner.",
        8: "Mars in the 8th house gives surgical skill, interest in the occult, and the capacity to penetrate to the root of any crisis. Longevity is tested but resilience is remarkable.",
        9: "Mars in the 9th house (Bhagya) can create conflict with teachers or religious authorities but also drives passionate pursuit of dharma, adventure, and foreign exploration.",
        10: "Mars in the 10th house (Karma) gives tremendous career drive, executive ability, and the capacity to lead boldly. The native is built for positions of authority and military command.",
        11: "Mars in the 11th house (Labha) brings competitive gains through friends, elder siblings, and business ventures. The native earns through courage and enterprise.",
        12: "Mars in the 12th house (Vyaya) can cause loss through impulsiveness, hidden enemies, or reckless expenditure. The native may excel in spiritual combat, foreign service, or research.",
    },
    "Jupiter": {
        1: "Jupiter in the 1st house (Tanu) is a supremely auspicious placement, bestowing wisdom, good health, a generous nature, and a life guided by righteousness and grace.",
        2: "Jupiter in the 2nd house (Dhana) brings abundance of wealth, a blessed family environment, and eloquent, truthful speech. The native is financially fortunate and generous.",
        3: "Jupiter in the 3rd house expands the mind, bestows powerful communication skills, and brings wisdom through travel, writing, and interaction with siblings.",
        4: "Jupiter in the 4th house (Matru) blesses the home with happiness, a wise mother, and spiritual peace. The native enjoys domestic prosperity and may collect land or vehicles.",
        5: "Jupiter in the 5th house is one of the finest indicators of intelligence, creativity, meritorious karma, and blessed children. The native has a naturally inspired mind.",
        6: "Jupiter in the 6th house (Shatru) can expand the number of enemies but also magnifies the native's ability to defeat them. Healing professions are favoured.",
        7: "Jupiter in the 7th house (Kalatra) attracts a wise, virtuous, and spiritually inclined partner. Business partnerships are ethical and prosperous. Marriage is generally fortunate.",
        8: "Jupiter in the 8th house grants longevity, hidden wisdom, and access to esoteric or ancestral knowledge. The native may receive unexpected legacies or spiritual inheritance.",
        9: "Jupiter in the 9th house (Bhagya) is the most auspicious house for the most auspicious planet, bringing great fortune, spiritual grace, an exalted guru, and worldwide wisdom.",
        10: "Jupiter in the 10th house (Karma) grants a prestigious, respected, and dharmic career. The native is seen as an authority in their field and earns honour through wisdom.",
        11: "Jupiter in the 11th house (Labha) brings abundant gains, fulfilled aspirations, and influential, benevolent friends. Financial prosperity flows easily throughout life.",
        12: "Jupiter in the 12th house (Vyaya) grants spiritual liberation, comfort in foreign lands, and generous giving. The native spends freely on charitable or spiritual pursuits.",
    },
    "Saturn": {
        1: "Saturn in the 1st house (Tanu) gives a serious, disciplined, and sometimes heavy personal demeanour. The native faces early hardships but develops extraordinary resilience and authority.",
        2: "Saturn in the 2nd house (Dhana) delays financial prosperity but ensures slow, steady accumulation over time. The native speaks carefully and chooses words with precision.",
        3: "Saturn in the 3rd house disciplines effort, sibling relationships, and communication. The native works with painstaking thoroughness and earns through consistent hard work.",
        4: "Saturn in the 4th house (Matru) creates emotional distance from mother and home, and may delay or restrict domestic happiness. Real estate success comes late but is lasting.",
        5: "Saturn in the 5th house delays children and restricts creative expression but cultivates disciplined intelligence. Speculative ventures should be avoided; structured study is rewarded.",
        6: "Saturn in the 6th house (Shatru) is a powerful placement for defeating chronic enemies and illness through methodical persistence. The native has extraordinary endurance in hardship.",
        7: "Saturn in the 7th house (Kalatra) delays or restricts marriage and may bring a serious, older, or reserved partner. Business partnerships require careful due diligence.",
        8: "Saturn in the 8th house grants exceptional longevity and interest in mysticism, but can bring chronic health challenges, inheritance disputes, or karmic burdens from past lives.",
        9: "Saturn in the 9th house (Bhagya) creates a disciplined, formal approach to religion and philosophy. The native may feel spiritually isolated but ultimately builds a tested faith.",
        10: "Saturn in the 10th house (Karma) is one of the most powerful career placements, driving the native to achieve lasting authority through decades of disciplined effort.",
        11: "Saturn in the 11th house (Labha) brings gains slowly and through sustained networking. Friendships are few but loyal; material prosperity increases significantly after middle age.",
        12: "Saturn in the 12th house (Vyaya) creates karmic debts, expenses, and the need for spiritual atonement. The native may excel in solitary, charitable, or contemplative environments.",
    },
    "Rahu": {
        1: "Rahu in the 1st house (Tanu) creates an unusual, magnetic, and unconventional personality. The native is driven by intense ambition and may reinvent their identity multiple times.",
        2: "Rahu in the 2nd house (Dhana) amplifies hunger for wealth and family prestige, sometimes through unconventional or foreign means. Speech can be deceptive or hypnotic.",
        3: "Rahu in the 3rd house gives bold, boundary-breaking communication skills and insatiable curiosity. The native may excel in media, technology, or cross-cultural ventures.",
        4: "Rahu in the 4th house (Matru) creates instability in home, property, and the relationship with the mother. Foreign residence or unconventional living situations are common.",
        5: "Rahu in the 5th house intensifies desire for fame, creative expression, and speculative gain. Children may be few or unusual; past-life karmas manifest through romance.",
        6: "Rahu in the 6th house (Shatru) is a powerful destroyer of enemies through unconventional means. The native excels at defeating opposition and may work in healing or investigative fields.",
        7: "Rahu in the 7th house (Kalatra) attracts foreign, unconventional, or karmically charged partnerships. Business dealings may be complex or cross-cultural.",
        8: "Rahu in the 8th house creates extreme fascination with occult sciences, mysteries, and hidden wealth. Sudden transformations and unexpected inheritances are possible.",
        9: "Rahu in the 9th house (Bhagya) drives obsessive pursuit of foreign philosophies, unconventional gurus, and non-traditional religious paths. Fortune comes through foreign connections.",
        10: "Rahu in the 10th house (Karma) is a powerful career amplifier, often leading to sudden fame or prominence. The native may rise to great heights through unconventional methods.",
        11: "Rahu in the 11th house (Labha) brings massive gains through foreign networks, technology, and large-scale ambitions. Desires are intense and often materialise in unexpected ways.",
        12: "Rahu in the 12th house (Vyaya) creates a strong pull toward foreign lands, hidden realms, and moksha-oriented experiences. Expenditure is heavy and often on unusual items.",
    },
    "Ketu": {
        1: "Ketu in the 1st house (Tanu) creates a spiritually oriented, detached personality that may feel disconnected from its physical identity. Past-life wisdom is encoded in the body.",
        2: "Ketu in the 2nd house (Dhana) produces indifference to material wealth and family speech patterns. The native may have unusual eating habits and a disinterest in accumulation.",
        3: "Ketu in the 3rd house gives introspective, non-verbal intelligence and a reserved relationship with siblings. The native communicates through action or silence more than words.",
        4: "Ketu in the 4th house (Matru) creates detachment from domestic life and the mother. The native may prefer solitude and can find it difficult to feel truly at home anywhere.",
        5: "Ketu in the 5th house gives past-life creative karma and unusual or deeply spiritual children. The native may have prophetic intelligence but disregards conventional education.",
        6: "Ketu in the 6th house (Shatru) gives strong immunity and the mystical ability to dissolve enemies without overt conflict. The native has deep healing or shamanic gifts.",
        7: "Ketu in the 7th house (Kalatra) produces karmic partnerships that feel fated yet incomplete. The native may feel spiritually isolated within marriage or partnerships.",
        8: "Ketu in the 8th house gives extraordinary psychic ability, mastery of occult sciences, and profound acceptance of death and transformation. This is a deeply karmic placement.",
        9: "Ketu in the 9th house (Bhagya) creates disillusionment with formal religion and inherited belief systems. The native is drawn to direct spiritual experience over dogma.",
        10: "Ketu in the 10th house (Karma) produces detachment from career and worldly status despite talent. The native may renounce professional life in pursuit of spiritual vocation.",
        11: "Ketu in the 11th house (Labha) gives disinterest in social networks and material gain. The native fulfils spiritual rather than worldly aspirations, often benefiting others in the process.",
        12: "Ketu in the 12th house (Vyaya) is extremely auspicious for moksha, as Ketu feels at home in the house of liberation. The native is a natural renunciant with deep spiritual gifts.",
    },
}


def get_planet_in_house(planet: str, house: int) -> str:
    """Return a traditional Vedic interpretation of a planet placed in a house (1–12)."""
    entry = _PLANET_IN_HOUSE.get(planet, {}).get(house)
    if entry is None:
        return f"Interpretation not available for {planet} in house {house}."
    return entry


# ---------------------------------------------------------------------------
# Nakshatra meanings  (27 nakshatras)
# ---------------------------------------------------------------------------

# Nakshatra lords cycle: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury (×3)
_NAK_LORD_CYCLE = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
]

_NAKSHATRA_DATA: dict[str, dict[str, str]] = {
    "Ashwini": {
        "ruling_planet": "Ketu",
        "deity": "Ashwini Kumaras (divine physicians)",
        "traits": "Energetic, pioneering, quick-healing, impulsive, adventurous, and fond of speed and medicine.",
    },
    "Bharani": {
        "ruling_planet": "Venus",
        "deity": "Yama (god of death and dharma)",
        "traits": "Disciplined, creative, possessive, sensual, courageous in facing extremes, and burdened by responsibility.",
    },
    "Krittika": {
        "ruling_planet": "Sun",
        "deity": "Agni (fire god)",
        "traits": "Sharp, courageous, direct, stubborn, purifying, and capable of cutting through illusion with fiery clarity.",
    },
    "Rohini": {
        "ruling_planet": "Moon",
        "deity": "Brahma (the creator)",
        "traits": "Sensual, creative, fertile, artistic, beauty-loving, and deeply attached to material and romantic pleasures.",
    },
    "Mrigashira": {
        "ruling_planet": "Mars",
        "deity": "Soma (Moon god)",
        "traits": "Curious, gentle, searching, restless, romantic, and endlessly seeking knowledge or perfect beauty.",
    },
    "Ardra": {
        "ruling_planet": "Rahu",
        "deity": "Rudra (the storm god)",
        "traits": "Intense, emotional, destructive-transformative, sharp intellect, empathic, and capable of profound renewal after loss.",
    },
    "Punarvasu": {
        "ruling_planet": "Jupiter",
        "deity": "Aditi (mother of the gods)",
        "traits": "Optimistic, generous, returning after hardship, philosophical, nurturing, and gifted with a reflective wisdom.",
    },
    "Pushya": {
        "ruling_planet": "Saturn",
        "deity": "Brihaspati (Jupiter, teacher of the gods)",
        "traits": "Nourishing, reliable, devoted, disciplined, spiritually inclined, and one of the most auspicious nakshatras for beginnings.",
    },
    "Ashlesha": {
        "ruling_planet": "Mercury",
        "deity": "Naga (serpent deities)",
        "traits": "Perceptive, magnetic, cunning, psychically sensitive, capable of great healing or harm, and deeply intuitive.",
    },
    "Magha": {
        "ruling_planet": "Ketu",
        "deity": "Pitrs (ancestral spirits)",
        "traits": "Regal, ancestral pride, authoritative, traditional, and honoured with natural dignity and a connection to lineage.",
    },
    "Purva Phalguni": {
        "ruling_planet": "Venus",
        "deity": "Bhaga (god of delight and marital bliss)",
        "traits": "Pleasure-loving, creative, romantic, generous, and artistically gifted with a love of luxury and leisure.",
    },
    "Uttara Phalguni": {
        "ruling_planet": "Sun",
        "deity": "Aryaman (god of contracts and patronage)",
        "traits": "Generous, structured, helpful, organised, and capable of sustaining long-term commitments with integrity.",
    },
    "Hasta": {
        "ruling_planet": "Moon",
        "deity": "Savitar (solar deity of skill and craft)",
        "traits": "Skilful with hands, clever, adaptable, industrious, humorous, and naturally gifted in healing or artisan work.",
    },
    "Chitra": {
        "ruling_planet": "Mars",
        "deity": "Vishwakarma (celestial architect)",
        "traits": "Creative, aesthetic, magnetic, individualistic, and drawn to design, architecture, and beautiful self-expression.",
    },
    "Swati": {
        "ruling_planet": "Rahu",
        "deity": "Vayu (wind god)",
        "traits": "Independent, flexible, diplomatic, entrepreneurial, and skilled at moving gracefully through changing social winds.",
    },
    "Vishakha": {
        "ruling_planet": "Jupiter",
        "deity": "Indra and Agni (king of gods and fire)",
        "traits": "Ambitious, goal-oriented, intense, patient in pursuit of purpose, and capable of great spiritual or material achievement.",
    },
    "Anuradha": {
        "ruling_planet": "Saturn",
        "deity": "Mitra (god of friendship and contracts)",
        "traits": "Devoted, loyal, disciplined in friendship, capable of enduring hardship for love, and gifted with organisational leadership.",
    },
    "Jyeshtha": {
        "ruling_planet": "Mercury",
        "deity": "Indra (king of the gods)",
        "traits": "Protective, authoritative, protective of loved ones, inventive, and sometimes arrogant but deeply capable of leadership.",
    },
    "Mula": {
        "ruling_planet": "Ketu",
        "deity": "Nirriti (goddess of dissolution and calamity)",
        "traits": "Investigative, root-seeking, transformative, willing to destroy in order to discover truth at the deepest level.",
    },
    "Purva Ashadha": {
        "ruling_planet": "Venus",
        "deity": "Apas (goddess of water and purification)",
        "traits": "Invincible, courageous, proud, persuasive, and driven by a powerful need to win and to purify through victory.",
    },
    "Uttara Ashadha": {
        "ruling_planet": "Sun",
        "deity": "Vishvadevas (universal gods)",
        "traits": "Righteous, universal, victorious over adversity, steady, and capable of achieving lasting success through integrity.",
    },
    "Shravana": {
        "ruling_planet": "Moon",
        "deity": "Vishnu (the preserver)",
        "traits": "Learned, listening, connecting, perceptive, and gifted at gathering and transmitting wisdom across time and culture.",
    },
    "Dhanishta": {
        "ruling_planet": "Mars",
        "deity": "Ashta Vasus (eight elemental gods)",
        "traits": "Rhythmic, musical, philanthropic, ambitious, and gifted in music, wealth creation, and group endeavours.",
    },
    "Shatabhisha": {
        "ruling_planet": "Rahu",
        "deity": "Varuna (god of cosmic order and the ocean)",
        "traits": "Healing, secretive, meditative, scientifically inclined, and gifted at unlocking mysteries of the body or cosmos.",
    },
    "Purva Bhadrapada": {
        "ruling_planet": "Jupiter",
        "deity": "Aja Ekapad (one-footed serpent or fire dragon)",
        "traits": "Passionate, intense, austere, capable of great sacrifice for ideals, and spiritually powerful once awakened.",
    },
    "Uttara Bhadrapada": {
        "ruling_planet": "Saturn",
        "deity": "Ahir Budhnya (serpent of the depths)",
        "traits": "Wise, patient, compassionate, deeply meditative, and capable of bringing great depth and liberation to others.",
    },
    "Revati": {
        "ruling_planet": "Mercury",
        "deity": "Pushan (god of journeys and nourishment)",
        "traits": "Nurturing, gentle, completeness-seeking, protective of the vulnerable, and gifted with an innate sense of divine timing.",
    },
}


def get_nakshatra_meaning(nakshatra: str) -> dict[str, str]:
    """Return ruling planet, deity, and traits for the given nakshatra.

    Returns a fallback dict if the nakshatra is not found.
    """
    entry = _NAKSHATRA_DATA.get(nakshatra)
    if entry is None:
        return {
            "ruling_planet": "Unknown",
            "deity": "Unknown",
            "traits": f"Nakshatra data not available for {nakshatra}.",
        }
    return dict(entry)


# ---------------------------------------------------------------------------
# Planet remedies  (9 grahas)
# ---------------------------------------------------------------------------

_PLANET_REMEDY: dict[str, dict[str, str]] = {
    "Sun": {
        "gemstone": "Ruby",
        "mantra": "Om Hraam Hreem Hraum Sah Suryaya Namah",
        "charity": "Donate wheat and jaggery on Sundays",
        "deity": "Lord Surya",
    },
    "Moon": {
        "gemstone": "Pearl",
        "mantra": "Om Shraam Shreem Shraum Sah Chandraya Namah",
        "charity": "Donate rice and white items on Mondays",
        "deity": "Lord Shiva",
    },
    "Mars": {
        "gemstone": "Red Coral",
        "mantra": "Om Kraam Kreem Kraum Sah Bhaumaya Namah",
        "charity": "Donate red lentils on Tuesdays",
        "deity": "Lord Hanuman",
    },
    "Mercury": {
        "gemstone": "Emerald",
        "mantra": "Om Braam Breem Braum Sah Budhaya Namah",
        "charity": "Donate green moong dal on Wednesdays",
        "deity": "Lord Vishnu",
    },
    "Jupiter": {
        "gemstone": "Yellow Sapphire",
        "mantra": "Om Graam Greem Graum Sah Gurave Namah",
        "charity": "Donate turmeric and yellow items on Thursdays",
        "deity": "Lord Brihaspati",
    },
    "Venus": {
        "gemstone": "Diamond",
        "mantra": "Om Draam Dreem Draum Sah Shukraya Namah",
        "charity": "Donate white clothes and sugar on Fridays",
        "deity": "Goddess Lakshmi",
    },
    "Saturn": {
        "gemstone": "Blue Sapphire",
        "mantra": "Om Sham Shanicharaya Namah",
        "charity": "Donate black items and mustard oil on Saturdays",
        "deity": "Lord Shani",
    },
    "Rahu": {
        "gemstone": "Hessonite Garnet",
        "mantra": "Om Bhram Bhreem Bhraum Sah Rahave Namah",
        "charity": "Donate blue or black blankets on Saturdays",
        "deity": "Goddess Durga",
    },
    "Ketu": {
        "gemstone": "Cat's Eye",
        "mantra": "Om Stram Streem Straum Sah Ketave Namah",
        "charity": "Donate gray blankets on Tuesdays",
        "deity": "Lord Ganesha",
    },
}


def get_planet_remedy(planet: str) -> dict[str, str]:
    """Return the traditional Vedic remedies for the given planet.

    Returns a fallback dict if the planet is not found.
    """
    entry = _PLANET_REMEDY.get(planet)
    if entry is None:
        return {
            "gemstone": "Unknown",
            "mantra": "Unknown",
            "charity": "Unknown",
            "deity": f"Remedy data not available for {planet}.",
        }
    return dict(entry)


# ---------------------------------------------------------------------------
# House lord in house  (12 source houses × 12 target houses = 144 entries)
# ---------------------------------------------------------------------------
# Format: "Lord of house N in house M — brief one-line meaning."

_HOUSE_LORD_IN_HOUSE: dict[int, dict[int, str]] = {
    1: {
        1: "Lord of 1st in 1st — strong self-identity, robust constitution, and a personality that projects naturally with confidence.",
        2: "Lord of 1st in 2nd — personality tied to wealth accumulation; the self is expressed through speech, family, and financial enterprise.",
        3: "Lord of 1st in 3rd — courageous, initiative-driven character who excels in communication, short travel, and sibling bonds.",
        4: "Lord of 1st in 4th — identity rooted in home, heritage, and the mother; domestic life is central to personal fulfilment.",
        5: "Lord of 1st in 5th — creative, intelligent, and charismatic; the native expresses self through art, children, and speculative ventures.",
        6: "Lord of 1st in 6th — the native battles enemies and health challenges as a defining life theme, emerging stronger through service.",
        7: "Lord of 1st in 7th — self is found through partnership; the native is relationship-oriented and gains identity through others.",
        8: "Lord of 1st in 8th — life involves repeated transformation; longevity and the occult become integral to self-discovery.",
        9: "Lord of 1st in 9th — blessed life guided by dharma, fortune, and the influence of a powerful father or guru figure.",
        10: "Lord of 1st in 10th — career-driven personality; the native is built for public life and professional achievement.",
        11: "Lord of 1st in 11th — gains come naturally; the native fulfils aspirations through a network of supportive friendships.",
        12: "Lord of 1st in 12th — introspective or reclusive nature; health and identity may be tested through isolation or foreign living.",
    },
    2: {
        1: "Lord of 2nd in 1st — the native personally generates wealth and is identified with family heritage and eloquent speech.",
        2: "Lord of 2nd in 2nd — strong financial stability; family wealth is well-protected and the native has a gift for accumulation.",
        3: "Lord of 2nd in 3rd — income through communication, writing, and business with siblings; wealth grows through effort and courage.",
        4: "Lord of 2nd in 4th — family wealth tied to property and the mother; the native may inherit or deal in real estate.",
        5: "Lord of 2nd in 5th — wealth through speculation, creative arts, or children; financial intelligence is a native gift.",
        6: "Lord of 2nd in 6th — family resources may be spent on health or legal matters; income through service or medical fields.",
        7: "Lord of 2nd in 7th — wealth through business partnerships or marriage; the partner contributes significantly to family income.",
        8: "Lord of 2nd in 8th — fluctuating wealth; gains may come through inheritance, hidden sources, or the partner's assets.",
        9: "Lord of 2nd in 9th — fortune and family wealth blessed by dharma; income grows through religious, academic, or foreign connections.",
        10: "Lord of 2nd in 10th — earnings through career and public reputation; speech and communication skills drive professional success.",
        11: "Lord of 2nd in 11th — strong financial gains through social networks, elder siblings, and fulfilled ambitions.",
        12: "Lord of 2nd in 12th — wealth is spent on foreign travel, spiritual pursuits, or hospitalisation; a tendency toward financial loss.",
    },
    3: {
        1: "Lord of 3rd in 1st — courageous, communicative, and initiative-driven; the native channels sibling energy into personal branding.",
        2: "Lord of 3rd in 2nd — income and family wealth connected to communication, writing, or sibling enterprise.",
        3: "Lord of 3rd in 3rd — excellent courage, strong sibling ties, and natural talent for communication, arts, and short travel.",
        4: "Lord of 3rd in 4th — intellectual energy directed toward home and property; siblings may live nearby or share the domestic space.",
        5: "Lord of 3rd in 5th — creativity and intellect flourish; the native excels in performing arts, writing, or teaching children.",
        6: "Lord of 3rd in 6th — courage channelled into defeating enemies and overcoming obstacles; possible conflict with siblings.",
        7: "Lord of 3rd in 7th — business partnerships formed through communication and media; the spouse may be a sibling-like companion.",
        8: "Lord of 3rd in 8th — courage tested through occult study, sudden events, or secret communications; writing may be investigative.",
        9: "Lord of 3rd in 9th — short journeys lead to long blessings; the native's courage and communication open doors to wisdom and fortune.",
        10: "Lord of 3rd in 10th — career built on communication, courage, or media; siblings may influence the professional path.",
        11: "Lord of 3rd in 11th — gains through writing, media, and courageous networking; sibling success benefits the native.",
        12: "Lord of 3rd in 12th — communication may be secretive or foreign-directed; travel and writing expenses drain resources.",
    },
    4: {
        1: "Lord of 4th in 1st — the native carries home and mother close to heart; emotional security is foundational to identity.",
        2: "Lord of 4th in 2nd — family wealth rooted in property; domestic comfort and financial stability are deeply intertwined.",
        3: "Lord of 4th in 3rd — communication skills learned at home; mother may be an important influence on writing or media.",
        4: "Lord of 4th in 4th — deep happiness in domestic life; the home is a fortress of peace, tradition, and contentment.",
        5: "Lord of 4th in 5th — emotional fulfilment through children and creative expression; the home becomes a creative sanctuary.",
        6: "Lord of 4th in 6th — domestic challenges or health issues of the mother; property disputes or household conflicts possible.",
        7: "Lord of 4th in 7th — marriage provides emotional security; the spouse becomes a home-like source of comfort and stability.",
        8: "Lord of 4th in 8th — sudden changes in residence, property, or family circumstances; deep ancestral karmas related to home.",
        9: "Lord of 4th in 9th — blessed home environment imbued with philosophical or spiritual values; foreign education is possible.",
        10: "Lord of 4th in 10th — career in real estate, education, or government; the native's public reputation rests on domestic virtues.",
        11: "Lord of 4th in 11th — gains through property and vehicles; the mother's blessings support the native's aspirations.",
        12: "Lord of 4th in 12th — possible loss of ancestral property or distant living from birthplace; the home may be foreign.",
    },
    5: {
        1: "Lord of 5th in 1st — the native's identity is shaped by intelligence, children, and creative gifts; a naturally brilliant personality.",
        2: "Lord of 5th in 2nd — wealth accumulated through intelligent speculation, teaching, or the success of children.",
        3: "Lord of 5th in 3rd — creative and intellectual energy flows into communication; the native excels at writing, teaching, or the arts.",
        4: "Lord of 5th in 4th — joy in the home through children and creative pursuits; the mother may be intellectually brilliant.",
        5: "Lord of 5th in 5th — exceptional intelligence, strong creative expression, and blessed children; past-life merit manifests clearly.",
        6: "Lord of 5th in 6th — intelligence applied to service, health, and defeating opposition; children may face some challenges.",
        7: "Lord of 5th in 7th — romance leads to partnership; the spouse is intellectual and the marriage is creatively stimulating.",
        8: "Lord of 5th in 8th — intelligence drawn toward occult research; children may be few but deep; hidden creative talents emerge.",
        9: "Lord of 5th in 9th — profound wisdom, spiritual intelligence, and meritorious fortune; a highly auspicious combination for dharma.",
        10: "Lord of 5th in 10th — career built on creativity, intelligence, or education; the native earns fame through original work.",
        11: "Lord of 5th in 11th — financial gains through speculation, children, and creative ventures; aspirations are fulfilled with intelligence.",
        12: "Lord of 5th in 12th — children may live abroad; intelligence is spiritually inclined; creative expression may be private or foreign.",
    },
    6: {
        1: "Lord of 6th in 1st — the native personally battles health issues or enemies; a fighter who defines themselves through overcoming adversity.",
        2: "Lord of 6th in 2nd — debts or legal issues may affect family wealth; income through service, medicine, or legal work.",
        3: "Lord of 6th in 3rd — conflicts with siblings are possible; courage and effort are required to overcome communication obstacles.",
        4: "Lord of 6th in 4th — domestic disputes or the mother's health may present ongoing challenges in the home.",
        5: "Lord of 6th in 5th — obstacles in romance, speculation, or with children; intelligence is forged through adversity.",
        6: "Lord of 6th in 6th — strong capacity to defeat all enemies and illness; the native is a resilient warrior in service professions.",
        7: "Lord of 6th in 7th — marriage or business partnerships may involve conflict, health challenges, or legal disputes.",
        8: "Lord of 6th in 8th — karmic debts related to enemies and health; the native faces crises that are ultimately transformative.",
        9: "Lord of 6th in 9th — service to the guru or religious institution; the native's dharma involves healing or overcoming obstacles.",
        10: "Lord of 6th in 10th — career in medicine, law, military, or service; the native gains authority through overcoming challenges.",
        11: "Lord of 6th in 11th — gains through defeating enemies and overcoming obstacles; success in competitive fields brings prosperity.",
        12: "Lord of 6th in 12th — enemies may be hidden or from foreign lands; expenditure on health, litigation, or confinement.",
    },
    7: {
        1: "Lord of 7th in 1st — the native is strongly partnership-oriented; the spouse's qualities directly shape the native's identity.",
        2: "Lord of 7th in 2nd — wealth gained through marriage or business partnerships; the spouse contributes significantly to family income.",
        3: "Lord of 7th in 3rd — the partner is communicative and courageous; business built on media, writing, or sibling collaboration.",
        4: "Lord of 7th in 4th — the spouse brings emotional comfort and may share the native's home; domestic happiness through partnership.",
        5: "Lord of 7th in 5th — a romantic, creative partner; the native finds love through artistic or intellectual pursuits.",
        6: "Lord of 7th in 6th — marriage may involve health challenges, conflict, or service-related sacrifices; partnerships require work.",
        7: "Lord of 7th in 7th — strong, stable marriage and business partnerships; the native naturally attracts a committed, devoted partner.",
        8: "Lord of 7th in 8th — transformative marriage that involves deep karmic bonds; sudden changes through the partner are common.",
        9: "Lord of 7th in 9th — a dharmic, philosophically compatible partner; marriage may be with a foreign or highly educated person.",
        10: "Lord of 7th in 10th — the spouse supports the native's career; business partnerships elevate public status and authority.",
        11: "Lord of 7th in 11th — gains through marriage and business partnerships; the partner fulfils the native's aspirations.",
        12: "Lord of 7th in 12th — the partner may be foreign or spiritually inclined; marriage involves sacrifice, seclusion, or overseas living.",
    },
    8: {
        1: "Lord of 8th in 1st — the native's life is shaped by repeated transformation, hidden challenges, and a powerful investigative instinct.",
        2: "Lord of 8th in 2nd — family wealth may be hidden, inherited, or fluctuate suddenly; speech may deal with taboo subjects.",
        3: "Lord of 8th in 3rd — communication touches on secrets, research, or the occult; courage tested through sudden crises with siblings.",
        4: "Lord of 8th in 4th — ancestral property may be contested; hidden family secrets and the mother's wellbeing require attention.",
        5: "Lord of 8th in 5th — intelligence drawn toward hidden wisdom; children may be born after challenges; speculative losses possible.",
        6: "Lord of 8th in 6th — chronic or hidden health issues require sustained attention; enemies may be concealed but ultimately overcome.",
        7: "Lord of 8th in 7th — transformative partnerships; the spouse may carry hidden burdens or the marriage undergoes deep change.",
        8: "Lord of 8th in 8th — profound occult depth, extraordinary longevity interest, and mastery of hidden knowledge; intense karmic life.",
        9: "Lord of 8th in 9th — spiritual transformation through adversity; the father or guru may pass away or undergo profound change.",
        10: "Lord of 8th in 10th — career involves research, investigation, surgery, or crisis management; sudden changes in professional status.",
        11: "Lord of 8th in 11th — gains may arrive suddenly through inheritance, insurance, or hidden channels; friendships are intensely karmic.",
        12: "Lord of 8th in 12th — deep interest in moksha and spiritual liberation; hidden expenditures on occult or foreign pursuits.",
    },
    9: {
        1: "Lord of 9th in 1st — the native is blessed by fortune, righteousness, and the grace of a powerful father figure or guru.",
        2: "Lord of 9th in 2nd — family wealth blessed by dharma and fortune; the native earns through righteous speech and divine merit.",
        3: "Lord of 9th in 3rd — short journeys lead to great fortune; the native communicates righteousness and inspires others.",
        4: "Lord of 9th in 4th — the home is a sacred, fortunate space; the mother is deeply spiritual and the property is ancestrally blessed.",
        5: "Lord of 9th in 5th — meritorious past life manifests as brilliant children, creative fortune, and inspired intelligence.",
        6: "Lord of 9th in 6th — dharma tested through service and health challenges; fortune earned through defeating adversity righteously.",
        7: "Lord of 9th in 7th — a dharmic, fortunate partner; business partnerships guided by ethical principles bring great blessings.",
        8: "Lord of 9th in 8th — fortune arrives through hidden sources; the father or guru undergoes transformation; spiritual inheritance.",
        9: "Lord of 9th in 9th — the most powerful position for dharma and fortune; the native is deeply blessed, righteous, and well-travelled.",
        10: "Lord of 9th in 10th — career is dharmic and prosperous; the native earns fame through righteous conduct and high moral authority.",
        11: "Lord of 9th in 11th — fortune multiplied through aspirations; gains flow easily and the native benefits from a powerful network.",
        12: "Lord of 9th in 12th — fortune and dharma directed toward spiritual liberation; the native may live abroad and seek moksha.",
    },
    10: {
        1: "Lord of 10th in 1st — career is the native's personal mission; identity and professional life are inseparably merged.",
        2: "Lord of 10th in 2nd — earnings from career are strong; the native's reputation is tied to wealth, family, and eloquent speech.",
        3: "Lord of 10th in 3rd — career in media, communication, or the arts; courage and initiative drive professional success.",
        4: "Lord of 10th in 4th — work from home or in real estate; the mother or homeland is central to the professional journey.",
        5: "Lord of 10th in 5th — career in education, entertainment, or creative fields; children and intelligence enhance public standing.",
        6: "Lord of 10th in 6th — career in medicine, law, military, or service; professional success requires overcoming significant obstacles.",
        7: "Lord of 10th in 7th — career advanced through partnerships and public dealings; business partnerships are professionally central.",
        8: "Lord of 10th in 8th — career involves research, occult knowledge, or crisis work; sudden career changes are recurring themes.",
        9: "Lord of 10th in 9th — career guided by dharma, philosophy, or higher education; the native earns through wisdom and righteous work.",
        10: "Lord of 10th in 10th — exceptional career strength; the native is built for public authority, sustained achievement, and lasting legacy.",
        11: "Lord of 10th in 11th — career brings abundant gains; professional networks open doors to fulfilment of all major aspirations.",
        12: "Lord of 10th in 12th — career may involve foreign countries, hospitals, or spiritual institutions; service and seclusion can be rewarding.",
    },
    11: {
        1: "Lord of 11th in 1st — the native is naturally gain-oriented; income flows toward the self and aspirations are central to identity.",
        2: "Lord of 11th in 2nd — gains feed directly into family wealth; financial aspirations are realised through eloquent communication.",
        3: "Lord of 11th in 3rd — income through communication, media, or collaboration with siblings; social networking drives prosperity.",
        4: "Lord of 11th in 4th — gains enhance the home; property investments are highly favourable and the mother benefits from prosperity.",
        5: "Lord of 11th in 5th — income through speculation, creative arts, or teaching; children contribute to fulfilment of aspirations.",
        6: "Lord of 11th in 6th — gains through service or defeating enemies; income from medical, legal, or competitive fields.",
        7: "Lord of 11th in 7th — gains through marriage and business partnerships; the spouse brings social and financial advancement.",
        8: "Lord of 11th in 8th — gains through sudden inheritance, hidden wealth, or occult knowledge; income arrives unexpectedly.",
        9: "Lord of 11th in 9th — aspirations fulfilled through dharma and fortune; income from foreign sources or higher education.",
        10: "Lord of 11th in 10th — career brings abundant financial gains; professional success continuously fuels social aspirations.",
        11: "Lord of 11th in 11th — exceptional gains, powerful social network, and an abundance of aspirations successfully achieved.",
        12: "Lord of 11th in 12th — gains are spent on foreign travel, spiritual pursuits, or seclusion; income and expenditure balance uneasily.",
    },
    12: {
        1: "Lord of 12th in 1st — the native carries a spiritual or karmic burden in their personality; health expenditures and isolation are recurring themes.",
        2: "Lord of 12th in 2nd — wealth leaks away through hidden expenses or foreign living; family speech may carry hidden burdens.",
        3: "Lord of 12th in 3rd — communication may be secretive or directed toward foreign lands; travel expenses reduce accumulated resources.",
        4: "Lord of 12th in 4th — comfort and home life may be sacrificed for spiritual or foreign commitments; the mother's health requires care.",
        5: "Lord of 12th in 5th — children may live abroad or be spiritually gifted; intelligence is drawn toward meditative or hidden pursuits.",
        6: "Lord of 12th in 6th — hidden enemies from the past surface as health challenges; spiritual service dissolves karmic debts.",
        7: "Lord of 12th in 7th — the spouse or partner may be from abroad or spiritually inclined; marriage involves sacrifice or seclusion.",
        8: "Lord of 12th in 8th — deep karmic release through occult study and transformation; the native seeks liberation from ancestral patterns.",
        9: "Lord of 12th in 9th — the father or guru may be abroad or pass away; spiritual journeys to distant places bring liberation.",
        10: "Lord of 12th in 10th — career may involve foreign lands, institutions, or spiritual service; public expenditure outpaces recognition.",
        11: "Lord of 12th in 11th — gains are drained by hidden expenditures; social aspirations require spiritual detachment to fulfil.",
        12: "Lord of 12th in 12th — powerful position for moksha and spiritual liberation; the native is a natural renunciant drawn to enlightenment.",
    },
}


def get_house_lord_in_house(source_house: int, target_house: int) -> str:
    """Return a traditional Vedic interpretation of the lord of source_house placed in target_house.

    source_house and target_house must be integers 1–12.
    Returns a fallback string if the combination is not found.
    """
    entry = _HOUSE_LORD_IN_HOUSE.get(source_house, {}).get(target_house)
    if entry is None:
        return f"Interpretation not available for lord of house {source_house} in house {target_house}."
    return entry
