import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NouveauDevisClient from './NouveauDevisClient'

export default async function NouveauDevisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: artisan }, { data: clients }] = await Promise.all([
    supabase.from('artisans').select('*').eq('user_id', user.id).single(),
    supabase.from('clients').select('*').order('name'),
  ])

  if (!artisan) redirect('/onboarding')

  return <NouveauDevisClient artisan={artisan} clients={clients ?? []} />
}
