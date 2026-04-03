import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ChatView from '@/components/chat/ChatView'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/chat')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier, daily_message_count, daily_reset_at')
    .eq('id', user.id)
    .single()

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) redirect('/signup/onboarding')

  // Reset count if new day
  const today = new Date().toISOString().split('T')[0]
  const messagesUsed = profile?.daily_reset_at && profile.daily_reset_at < today
    ? 0
    : (profile?.daily_message_count ?? 0)

  const firstName = profile?.name?.split(' ')[0] ?? 'Seeker'
  const isPremium = profile?.subscription_tier === 'premium'

  return (
    <>
      <Navbar />
      <main className="h-screen bg-void pt-16">
        <ChatView
          userName={firstName}
          messageLimit={3}
          messagesUsed={messagesUsed}
          isPremium={isPremium}
        />
      </main>
    </>
  )
}
