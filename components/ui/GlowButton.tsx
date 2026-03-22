// components/ui/GlowButton.tsx
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface GlowButtonProps {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
  disabled?: boolean
}

export default function GlowButton({
  href, onClick, children, variant = 'primary', className = '', disabled
}: GlowButtonProps) {
  const base = 'inline-flex items-center justify-center px-6 py-3 rounded-full font-body font-semibold text-sm transition-all duration-200 cursor-pointer'
  const variants = {
    primary: 'bg-gradient-to-r from-violet to-rose text-white shadow-lg shadow-violet/30 hover:shadow-violet/50 hover:scale-105',
    secondary: 'border border-violet/50 text-violet-light hover:border-violet hover:bg-violet/10',
  }
  const classes = `${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`

  if (href) {
    return (
      <Link href={href}>
        <motion.span
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
          className={classes}
        >
          {children}
        </motion.span>
      </Link>
    )
  }

  return (
    <motion.button
      type="button"
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={classes}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}
