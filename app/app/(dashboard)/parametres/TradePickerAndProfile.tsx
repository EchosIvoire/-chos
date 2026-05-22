'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TRADES } from '@/lib/trades'
import { getInitials } from '@/lib/utils'
import type { Artisan, Trade } from '@/lib/types'
import { LogOut, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TradePickerAndProfile({ artisan }: { artisan: Artisan }) {
  const [trade, setTrade] = useState<Trade>(artisan.trade)
  const [name, setName] = useState(artisan.name)
  const [siret, setSiret] = useState(artisan.siret ?? '')
  const [phone, setPhone] = useState(artisan.phone ?? '')
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function save() {
    await supabase.from('artisans').update({ trade, name, siret, phone }).eq('id', artisan.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/connexion')
  }

  return (
    <div className="flex flex-col h-screen overflow-y-auto no-scrollbar">
      <div className="flex items-center px-5 h-13 bg-white border-b flex-shrink-0" style={{ borderColor: 'var(--s100)' }}>
        <p className="text-base font-semibold">Paramètres</p>
      </div>

      {/* Profile card */}
      <div className="mx-4 mt-4 bg-white rounded-xl border p-4" style={{ borderColor: 'var(--s100)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-13 h-13 rounded-xl flex items-center justify-center text-lg font-semibold text-white"
            style={{ background: 'var(--ink)', fontFamily: 'Playfair Display, serif', width: 52, height: 52 }}
          >
            {getInitials(name)}
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs" style={{ color: 'var(--mu)' }}>{TRADES[trade]?.specialty}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--s300)' }}>SIRET {siret}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {[
            { label: 'Nom & Prénom', value: name, set: setName },
            { label: 'SIRET', value: siret, set: setSiret },
            { label: 'Téléphone', value: phone, set: setPhone },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--mu)' }}>{label}</label>
              <input
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                style={{ border: '1.5px solid var(--s100)' }}
                value={value}
                onChange={(e) => set(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = 'var(--s300)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--s100)')}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Trade picker */}
      <div className="px-4 mt-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--mu)' }}>Corps de métier</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(TRADES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setTrade(key as Trade)}
              className="p-3 rounded-xl border-2 text-left transition-all"
              style={{
                borderColor: trade === key ? 'var(--ink)' : 'var(--s100)',
                background: trade === key ? 'var(--ink)' : 'white',
              }}
            >
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-sm font-semibold" style={{ color: trade === key ? 'white' : 'var(--ink)' }}>{t.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: trade === key ? 'rgba(255,255,255,.55)' : 'var(--mu)' }}>{t.specialty}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Prefs */}
      <div className="px-4 mt-4 mb-2">
        <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--mu)' }}>Préférences</p>
        <div className="bg-white rounded-xl border" style={{ borderColor: 'var(--s100)' }}>
          {[
            { icon: '💶', label: 'TVA par défaut', value: 'Rénovation 10%' },
            { icon: '🤝', label: 'Acompte par défaut', value: '30%' },
            { icon: '📅', label: 'Validité devis', value: '30 jours' },
            { icon: '⚡', label: 'Majoration urgence', value: '+25% MO' },
          ].map(({ icon, label, value }, i, arr) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--s100)' : 'none' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--s50)' }}>{icon}</div>
                <span className="text-sm">{label}</span>
              </div>
              <span className="text-sm" style={{ color: 'var(--mu)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-6 mt-2 flex flex-col gap-2">
        <button
          onClick={save}
          className="w-full h-12 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
          style={{ background: saved ? 'var(--gr)' : 'var(--ink)' }}
        >
          {saved ? <><Check size={15} /> Sauvegardé</> : 'Sauvegarder'}
        </button>
        <button
          onClick={logout}
          className="w-full h-12 rounded-xl text-sm font-medium border flex items-center justify-center gap-2"
          style={{ borderColor: 'var(--s200)', color: 'var(--mu)' }}
        >
          <LogOut size={15} />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
