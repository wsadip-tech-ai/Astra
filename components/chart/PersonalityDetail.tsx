'use client'

import { motion } from 'framer-motion'

export interface PersonalityData {
  personality: {
    core_nature: string
    emotional_nature: string
    outer_expression: string
    strengths: string[]
    challenges: string[]
  }
  family: {
    mother: string
    father: string
    spouse: string
    children: string
  }
  career: {
    direction: string
    strengths: string
    wealth_potential: string
  }
  health: {
    constitution: string
    vulnerabilities: string
    vitality: string
  }
  spiritual: {
    path: string
    past_life_karma: string
    dharma: string
  }
  life_themes: string[]
}

interface PersonalityDetailProps {
  data: PersonalityData
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: 'easeOut' as const },
  }),
}

function SectionCard({
  index,
  children,
}: {
  index: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="bg-nebula border border-white/5 rounded-xl p-6 relative overflow-hidden"
    >
      {children}
    </motion.div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-xl text-star mb-4">{children}</h3>
  )
}

function DescriptionBlock({
  label,
  text,
}: {
  label: string
  text: string
}) {
  return (
    <div>
      <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">
        {label}
      </p>
      <p className="text-star/90 text-sm leading-relaxed">{text}</p>
    </div>
  )
}

function RelationshipCard({
  icon,
  label,
  text,
}: {
  icon: string
  label: string
  text: string
}) {
  return (
    <div className="bg-cosmos/60 border border-white/5 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg" role="img" aria-label={label}>
          {icon}
        </span>
        <p className="text-star text-sm font-semibold">{label}</p>
      </div>
      <p className="text-muted text-xs leading-relaxed">{text}</p>
    </div>
  )
}

export default function PersonalityDetail({ data }: PersonalityDetailProps) {
  const { personality, family, career, health, spiritual, life_themes } = data

  return (
    <div className="space-y-6 mt-8">
      {/* Divider label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase">
          Personality &amp; Life Analysis
        </p>
        <div className="mt-2 mx-auto w-12 h-px bg-violet/40" />
      </motion.div>

      {/* 1. Personality Section */}
      <SectionCard index={0}>
        <SectionHeader>Who You Are</SectionHeader>

        {/* Core / Emotional / Outer as three mini-cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-cosmos/50 rounded-lg p-3">
            <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">
              Core Nature
            </p>
            <p className="text-star/90 text-xs leading-relaxed">
              {personality.core_nature}
            </p>
          </div>
          <div className="bg-cosmos/50 rounded-lg p-3">
            <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">
              Emotional Nature
            </p>
            <p className="text-star/90 text-xs leading-relaxed">
              {personality.emotional_nature}
            </p>
          </div>
          <div className="bg-cosmos/50 rounded-lg p-3">
            <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">
              Outer Expression
            </p>
            <p className="text-star/90 text-xs leading-relaxed">
              {personality.outer_expression}
            </p>
          </div>
        </div>

        {/* Strengths + Challenges */}
        <div className="flex flex-wrap gap-1.5">
          {personality.strengths.map((s) => (
            <span
              key={s}
              className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            >
              {s}
            </span>
          ))}
          {personality.challenges.map((c) => (
            <span
              key={c}
              className="bg-rose/10 text-rose border border-rose/20 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            >
              {c}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* 2. Family & Relationships */}
      <SectionCard index={1}>
        <SectionHeader>Your Relationships</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RelationshipCard icon="👩" label="Mother" text={family.mother} />
          <RelationshipCard icon="👨" label="Father" text={family.father} />
          <RelationshipCard icon="💑" label="Spouse" text={family.spouse} />
          <RelationshipCard icon="👶" label="Children" text={family.children} />
        </div>
      </SectionCard>

      {/* 3. Career & Wealth */}
      <SectionCard index={2}>
        <SectionHeader>Career &amp; Purpose</SectionHeader>
        <div className="space-y-4">
          <DescriptionBlock label="Direction" text={career.direction} />
          <DescriptionBlock label="Professional Strengths" text={career.strengths} />
          <DescriptionBlock label="Wealth Potential" text={career.wealth_potential} />
        </div>
      </SectionCard>

      {/* 4. Health */}
      <SectionCard index={3}>
        <SectionHeader>Health &amp; Vitality</SectionHeader>
        <div className="space-y-4">
          <DescriptionBlock label="Constitution" text={health.constitution} />
          <DescriptionBlock label="Vulnerabilities" text={health.vulnerabilities} />
          <DescriptionBlock label="Vitality" text={health.vitality} />
        </div>
      </SectionCard>

      {/* 5. Spiritual */}
      <SectionCard index={4}>
        <SectionHeader>Spiritual Path</SectionHeader>
        <div className="space-y-4">
          <DescriptionBlock label="Path" text={spiritual.path} />
          <DescriptionBlock label="Dharma" text={spiritual.dharma} />
          <DescriptionBlock label="Past Life Karma" text={spiritual.past_life_karma} />
        </div>
      </SectionCard>

      {/* 6. Life Themes */}
      {life_themes.length > 0 && (
        <SectionCard index={5}>
          <SectionHeader>Life Themes</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {life_themes.map((theme) => (
              <span
                key={theme}
                className="bg-violet/15 text-violet-light border border-violet/20 rounded-full px-4 py-1.5 text-sm font-medium"
              >
                {theme}
              </span>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}
