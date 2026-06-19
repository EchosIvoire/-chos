import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TradePickerAndProfile from './TradePickerAndProfile'
import type { Artisan } from '@/lib/types'

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: artisan } = await supabase
    .from('artisans')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!artisan) redirect('/onboarding')

  return <TradePickerAndProfile artisan={artisan as Artisan} />
}
