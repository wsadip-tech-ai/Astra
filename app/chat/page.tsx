import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ChatView from '@/components/chat/ChatView'
import { mapProfile } from '@/lib/profile'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/chat')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile ? mapProfile(rawProfile as Record<string, unknown>) : null

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) redirect('/signup/onboarding')

  const firstName = profile?.name?.split(' ')[0] ?? 'Seeker'
  const isPremium = profile?.subscription_tier === 'premium'
  const messagesUsed = profile?.daily_message_count ?? 0

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
