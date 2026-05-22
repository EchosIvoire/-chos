import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TabBar from '@/components/layout/TabBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cr)' }}>
      <main className="flex-1 pb-16 overflow-hidden">
        {children}
      </main>
      <TabBar />
    </div>
  )
}
