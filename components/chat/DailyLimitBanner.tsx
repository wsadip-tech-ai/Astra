'use client'

import Link from 'next/link'

export default function DailyLimitBanner() {
  return (
    <div className="p-4 border-t border-white/5">
      <div className="bg-violet/10 border border-violet/30 rounded-xl p-5 text-center">
        <p className="text-star text-sm font-medium mb-1">Daily message limit reached</p>
        <p className="text-muted text-xs mb-4">Free users get 3 messages per day. Upgrade for unlimited conversations with Astra.</p>
        <Link
          href="/pricing"
          className="inline-block bg-gradient-to-r from-violet to-rose text-white rounded-full px-6 py-2.5 font-semibold text-sm hover:shadow-lg hover:shadow-violet/30 transition-all"
        >
          Upgrade to Premium
        </Link>
      </div>
    </div>
  )
}
