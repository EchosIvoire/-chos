'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, X, Search, Zap, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fmt, calcHT, calcTTC } from '@/lib/utils'
import { TRADES } from '@/lib/trades'
import type { Artisan, Client, Trade } from '@/lib/types'

type Cat = 'MO' | 'Four' | 'Forf' | 'Custom'

interface Line {
  id: string
  label: string
  unit: string
  price_ht: number
  qty: number
  remise: number
  cat: Cat
  is_mo: boolean
  showRemise: boolean
  basePrice: number
  isUrgMO: boolean
}

type Screen = 'client' | 'builder' | 'preview'

interface Props {
  artisan: Artisan
  clients: Client[]
}

export default function NouveauDevisClient({ artisan, clients: initialClients }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const trade = TRADES[artisan.trade as Trade]

  const [screen, setScreen] = useState<Screen>('client')
  const [client, setClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [tva, setTva] = useState(10)
  const [acompte, setAcompte] = useState(30)
  const [urgence, setUrgence] = useState(false)
  const [note, setNote] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [catFilter, setCatFilter] = useState<Cat | 'all'>('all')
  const [catSearch, setCatSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const ht = calcHT(lines.map((l) => ({ price_ht: l.price_ht, qty: l.qty, remise: l.remise })))
  const ttc = calcTTC(ht, tva)
  const acpAmt = ttc * acompte / 100

  const filteredClients = initialClients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  function selectClient(c: Client) {
    setClient(c)
    setScreen('builder')
  }

  function newClient() {
    setClient({ id: 'new', artisan_id: artisan.id, name: 'Nouveau client', created_at: '' })
    setScreen('builder')
  }

  function toggleUrgence() {
    const next = !urgence
    setUrgence(next)
    setLines((prev) =>
      prev.map((l) => {
        if (!l.is_mo) return l
        const price = next ? Math.round(l.basePrice * 1.25 * 10) / 10 : l.basePrice
        return { ...l, price_ht: price, isUrgMO: next }
      })
    )
  }

  function addCatItem(label: string, unit: string, price: number, cat: Cat, isMO: boolean, id: string) {
    setLines((prev) => {
      const ex = prev.find((l) => l.id === id)
      if (ex) return prev.map((l) => l.id === id ? { ...l, qty: l.qty + 1 } : l)
      const finalPrice = urgence && isMO ? Math.round(price * 1.25 * 10) / 10 : price
      return [...prev, {
        id, label, unit, price_ht: finalPrice, qty: 1, remise: 0,
        cat, is_mo: isMO, showRemise: false, basePrice: price, isUrgMO: urgence && isMO,
      }]
    })
  }

  function updateLine(i: number, update: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...update } : l))
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i))
  }

  function getCatItems() {
    const allItems = [
      ...trade.cat.MO.map((i, idx) => ({ ...i, cat: 'MO' as Cat, id: `MO-${idx}`, isMO: true })),
      ...trade.cat.Four.map((i, idx) => ({ ...i, cat: 'Four' as Cat, id: `Four-${idx}`, isMO: false })),
      ...trade.cat.Forf.map((i, idx) => ({ ...i, cat: 'Forf' as Cat, id: `Forf-${idx}`, isMO: false })),
    ]
    return allItems
      .filter((i) => catFilter === 'all' || i.cat === catFilter)
      .filter((i) => !catSearch || i.label.toLowerCase().includes(catSearch.toLowerCase()))
  }

  async function saveDevis() {
    if (!client || lines.length === 0) return
    setSaving(true)

    let clientId = client.id
    if (client.id === 'new') {
      const { data } = await supabase
        .from('clients')
        .insert({ artisan_id: artisan.id, name: client.name })
        .select()
        .single()
      if (data) clientId = data.id
    }

    const { data: doc } = await supabase
      .from('documents')
      .insert({
        artisan_id: artisan.id,
        client_id: clientId,
        type: 'devis',
        status: 'sent',
        number: `${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        tva_rate: tva,
        acompte_pct: acompte,
        urgence,
        note,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (doc) {
      await supabase.from('lignes').insert(
        lines.map((l, i) => ({
          document_id: doc.id,
          label: l.label,
          unit: l.unit,
          price_ht: l.price_ht,
          qty: l.qty,
          remise: l.remise,
          cat: l.cat,
          is_mo: l.is_mo,
          position: i,
        }))
      )
      router.push(`/devis/${doc.id}?sent=1`)
    }
    setSaving(false)
  }

  const catNames: Record<string, string> = { MO: "Main d'œuvre", Four: 'Fournitures', Forf: 'Forfaits' }

  if (screen === 'client') {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center px-4 h-13 border-b bg-white" style={{ borderColor: 'var(--s100)' }}>
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg" style={{ color: 'var(--ink)' }}>
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-base font-semibold">Nouveau devis</p>
            <p className="text-[11px]" style={{ color: 'var(--mu)' }}>Choisir le client</p>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--mu)" />
            <input
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ border: '1.5px solid var(--s100)' }}
              placeholder="Rechercher un client…"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl border mb-3" style={{ borderColor: 'var(--s100)' }}>
            <button
              onClick={newClient}
              className="flex items-center gap-3 w-full px-4 py-3 text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border-2 border-dashed" style={{ borderColor: 'var(--s200)' }}>
                <Plus size={14} color="var(--mu)" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--mu)' }}>Nouveau client</p>
                <p className="text-xs" style={{ color: 'var(--s300)' }}>Saisir les coordonnées</p>
              </div>
            </button>
          </div>

          <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--mu)' }}>Récents</p>
          <div className="bg-white rounded-xl border" style={{ borderColor: 'var(--s100)' }}>
            {filteredClients.map((c, i) => (
              <button
                key={c.id}
                onClick={() => selectClient(c)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-[var(--s50)]"
                style={{ borderBottom: i < filteredClients.length - 1 ? '1px solid var(--s100)' : 'none' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ background: 'var(--s50)', border: '1px solid var(--s100)', color: 'var(--s500)' }}
                >
                  {c.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.phone && <p className="text-xs" style={{ color: 'var(--mu)' }}>{c.phone}</p>}
                </div>
                <ChevronRight size={14} color="var(--s200)" />
              </button>
            ))}
            {filteredClients.length === 0 && (
              <div className="py-6 text-center text-sm" style={{ color: 'var(--mu)' }}>Aucun client trouvé</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'builder') {
    return (
      <div className="flex flex-col h-screen relative">
        <div className="flex items-center px-4 h-13 border-b bg-white flex-shrink-0" style={{ borderColor: 'var(--s100)' }}>
          <button onClick={() => setScreen('client')} className="p-2 -ml-2"><ChevronLeft size={22} /></button>
          <div className="flex-1 text-center">
            <p className="text-base font-semibold">Devis</p>
            <p className="text-[11px]" style={{ color: 'var(--mu)' }}>{client?.name}</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: 'var(--s50)', color: 'var(--mu)' }}>Brouillon</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Lines */}
          <div className="m-3">
            <div className="bg-white rounded-xl border" style={{ borderColor: 'var(--s100)' }}>
              {lines.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm" style={{ color: 'var(--mu)' }}>Aucune prestation</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--s300)' }}>Tap "Ajouter" ci-dessous</p>
                </div>
              )}
              {lines.map((l, i) => {
                const base = l.price_ht * l.qty
                const rem = base * l.remise / 100
                return (
                  <div key={l.id} className="px-3.5 py-2.5 border-b" style={{ borderColor: 'var(--s100)' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.label}
                          {l.isUrgMO && <span className="ml-1 text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">+25%</span>}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--mu)' }}>{fmt(l.price_ht)} / {l.unit}</p>
                      </div>
                      <button
                        className="w-6 h-6 rounded-lg text-sm flex items-center justify-center"
                        style={{ background: 'var(--s50)', border: '1px solid var(--s100)' }}
                        onClick={() => updateLine(i, { qty: Math.max(1, l.qty - 1) })}
                      >−</button>
                      <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
                      <button
                        className="w-6 h-6 rounded-lg text-sm flex items-center justify-center"
                        style={{ background: 'var(--s50)', border: '1px solid var(--s100)' }}
                        onClick={() => updateLine(i, { qty: l.qty + 1 })}
                      >+</button>
                      <div className="w-12 text-right">
                        <p className="text-sm font-semibold">{fmt(base - rem)}</p>
                        <p className="text-[10px]" style={{ color: 'var(--mu)' }}>HT</p>
                      </div>
                      <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-gray-500">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      {l.showRemise ? (
                        <>
                          <input
                            type="number" min="0" max="50" placeholder="Remise %"
                            value={l.remise || ''}
                            onChange={(e) => updateLine(i, { remise: Math.min(50, Math.max(0, +e.target.value || 0)) })}
                            className="w-20 h-6 px-2 text-xs rounded-md border outline-none"
                            style={{ border: '1px solid var(--s100)', background: 'var(--s50)' }}
                          />
                          <span className="text-[11px]" style={{ color: 'var(--mu)' }}>
                            % remise{l.remise ? ` → −${fmt(rem)}` : ''}
                          </span>
                        </>
                      ) : (
                        <button
                          onClick={() => updateLine(i, { showRemise: true })}
                          className="text-[11px] underline"
                          style={{ color: 'var(--s300)' }}
                        >
                          + Remise
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              <button
                onClick={() => setSheetOpen(true)}
                className="flex items-center justify-center gap-2 w-full h-11 text-sm border-t border-dashed"
                style={{ borderColor: 'var(--s200)', color: 'var(--mu)' }}
              >
                <Plus size={14} strokeWidth={2.5} />
                Ajouter une prestation
              </button>
            </div>
          </div>

          {/* TVA */}
          <div className="px-3.5 pb-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--mu)' }}>Type de travaux (TVA)</p>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 5.5].map((t) => (
                <button
                  key={t}
                  onClick={() => setTva(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: tva === t ? 'var(--ink)' : 'var(--s50)', color: tva === t ? 'white' : 'var(--mu)' }}
                >
                  {t === 5.5 ? 'Énergie 5,5%' : t === 10 ? 'Rénovation 10%' : 'Neuf 20%'}
                </button>
              ))}
            </div>
          </div>

          {/* Acompte */}
          <div className="px-3.5 pb-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--mu)' }}>Acompte demandé</p>
            <div className="flex gap-2">
              {[0, 30, 40, 50].map((p) => (
                <button
                  key={p}
                  onClick={() => setAcompte(p)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    border: acompte === p ? '1.5px solid var(--ink)' : '1.5px solid var(--s100)',
                    background: acompte === p ? 'var(--ink)' : 'transparent',
                    color: acompte === p ? 'white' : 'var(--mu)',
                  }}
                >
                  {p === 0 ? 'Aucun' : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="px-3.5 pb-4">
            <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--mu)' }}>Note chantier</p>
            <textarea
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none"
              style={{ border: '1.5px solid var(--s100)', height: 56 }}
              placeholder="Accès par la porte de garage, code 4521…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Urgence */}
        <div
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ background: '#FBF3E3', borderTop: '1px solid #EED8B0' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: '#8A5A20' }}>⚡ Majoration urgence</p>
            <p className="text-[11px]" style={{ color: '#B08040' }}>+25% sur main d'œuvre</p>
          </div>
          <button
            onClick={toggleUrgence}
            className="w-10 h-6 rounded-full relative transition-colors"
            style={{ background: urgence ? 'var(--gr)' : 'var(--s200)' }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ left: urgence ? 'calc(100% - 22px)' : '2px' }}
            />
          </button>
        </div>

        {/* Totals & CTA */}
        <div className="flex-shrink-0 border-t bg-white" style={{ borderColor: 'var(--s100)' }}>
          <div className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p className="text-xs" style={{ color: 'var(--mu)' }}>HT : {fmt(ht)}</p>
              <p className="text-[11px]" style={{ color: 'var(--mu)' }}>TVA ({tva}%) : {fmt(ht * tva / 100)}</p>
              {acompte > 0 && <p className="text-[11px]" style={{ color: 'var(--s300)' }}>Acompte {acompte}% : {fmt(acpAmt)}</p>}
            </div>
            <p className="text-2xl font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>{fmt(ttc)} TTC</p>
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={() => setScreen('preview')}
              disabled={lines.length === 0}
              className="w-full h-12 rounded-xl text-sm font-medium text-white transition-opacity"
              style={{ background: 'var(--ink)', opacity: lines.length === 0 ? 0.4 : 1 }}
            >
              Aperçu &amp; envoyer →
            </button>
          </div>
        </div>

        {/* Overlay + Sheet */}
        {sheetOpen && (
          <>
            <div
              className="absolute inset-0 z-40"
              style={{ background: 'rgba(0,0,0,.4)' }}
              onClick={() => setSheetOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl flex flex-col" style={{ maxHeight: '82%' }}>
              <div className="w-9 h-1 rounded-full mx-auto mt-2.5 mb-1 flex-shrink-0" style={{ background: '#ddd' }} />
              <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--s100)' }}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-base font-semibold">Ajouter une prestation</p>
                  <button onClick={() => setSheetOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--s50)' }}>
                    <X size={16} color="var(--mu)" />
                  </button>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--mu)" />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ border: '1.5px solid var(--s100)' }}
                    placeholder="Rechercher…"
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2 px-4 py-2 border-b flex-shrink-0 no-scrollbar overflow-x-auto" style={{ borderColor: 'var(--s100)' }}>
                {(['all', 'MO', 'Four', 'Forf'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setCatFilter(f)}
                    className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                    style={{ background: catFilter === f ? 'var(--ink)' : 'var(--s50)', color: catFilter === f ? 'white' : 'var(--mu)' }}
                  >
                    {f === 'all' ? 'Tout' : catNames[f]}
                  </button>
                ))}
              </div>
              <div className="overflow-y-auto flex-1 no-scrollbar">
                {(() => {
                  const items = getCatItems()
                  const groups: Record<string, typeof items> = {}
                  items.forEach((i) => (groups[i.cat] = groups[i.cat] || []).concat(i))
                  return Object.entries(groups).map(([g, its]) => (
                    <div key={g}>
                      <div className="px-4 py-1.5" style={{ background: 'var(--s50)' }}>
                        <p className="text-[9.5px] uppercase tracking-wider font-semibold" style={{ color: 'var(--mu)' }}>{catNames[g] || g}</p>
                      </div>
                      {its.map((it) => {
                        const inLines = lines.some((l) => l.id === it.id)
                        return (
                          <div
                            key={it.id}
                            className="flex items-center gap-2.5 px-4 py-2.5 border-b"
                            style={{ borderColor: 'var(--s100)' }}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{it.label}</p>
                              <p className="text-[11px]" style={{ color: 'var(--mu)' }}>par {it.unit}</p>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: 'var(--s500)' }}>{fmt(it.price)}</span>
                            <button
                              onClick={() => addCatItem(it.label, it.unit, it.price, it.cat, it.isMO, it.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-base transition-colors"
                              style={{ background: inLines ? 'var(--gr)' : 'var(--ink)' }}
                            >
                              {inLines ? '✓' : '+'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ))
                })()}
                {getCatItems().length === 0 && (
                  <div className="py-8 text-center text-sm" style={{ color: 'var(--mu)' }}>Aucun résultat</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Preview screen
  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center px-4 h-13 border-b bg-white flex-shrink-0" style={{ borderColor: 'var(--s100)' }}>
        <button onClick={() => setScreen('builder')} className="p-2 -ml-2"><ChevronLeft size={22} /></button>
        <div className="flex-1 text-center">
          <p className="text-base font-semibold">Aperçu du devis</p>
        </div>
        <button onClick={() => setScreen('builder')} className="text-sm" style={{ color: 'var(--s500)' }}>Modifier</button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* PDF preview */}
        <div className="p-4">
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'var(--s100)' }}>
            <div className="p-4 border-b-2" style={{ borderColor: 'var(--ink)' }}>
              <div className="flex justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>{artisan.name}</p>
                  <p className="text-xs" style={{ color: 'var(--mu)' }}>{TRADES[artisan.trade as Trade]?.specialty}</p>
                  <p className="text-xs" style={{ color: 'var(--mu)' }}>SIRET {artisan.siret}</p>
                  <p className="text-xs" style={{ color: 'var(--mu)' }}>{artisan.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--s500)' }}>DEVIS</p>
                  <p className="text-xs" style={{ color: 'var(--mu)' }}>{new Date().toLocaleDateString('fr-FR')}</p>
                  <p className="text-[10px]" style={{ color: 'var(--s300)' }}>
                    Valide jusqu'au {new Date(Date.now() + 30 * 864e5).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: 'var(--s50)' }}>
                <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--mu)' }}>Client</p>
                <p className="text-sm font-medium">{client?.name}</p>
                {client?.address && <p className="text-xs" style={{ color: 'var(--mu)' }}>{client.address}</p>}
              </div>
            </div>

            {/* Table header */}
            <div className="grid text-[9.5px] font-semibold uppercase tracking-wider px-3 py-1.5" style={{ background: 'var(--s50)', gridTemplateColumns: '1fr 28px 44px 36px 48px', color: 'var(--mu)', gap: 4 }}>
              <span>Désignation</span>
              <span className="text-center">Qté</span>
              <span className="text-right">P.U.</span>
              <span className="text-right">Rem.</span>
              <span className="text-right">Total</span>
            </div>
            {lines.map((l, i) => {
              const base = l.price_ht * l.qty
              const rem = base * l.remise / 100
              return (
                <div
                  key={i}
                  className="grid items-center px-3 py-2 text-xs border-b"
                  style={{ gridTemplateColumns: '1fr 28px 44px 36px 48px', borderColor: 'var(--s100)', gap: 4 }}
                >
                  <span className="truncate">{l.label}</span>
                  <span className="text-center" style={{ color: 'var(--mu)' }}>{l.qty}</span>
                  <span className="text-right">{fmt(l.price_ht)}</span>
                  <span className="text-right" style={{ color: 'var(--or)' }}>{l.remise ? `-${l.remise}%` : ''}</span>
                  <span className="text-right font-medium">{fmt(base - rem)}</span>
                </div>
              )
            })}

            {/* Totals */}
            <div className="p-3">
              <div className="flex justify-between text-xs py-1"><span style={{ color: 'var(--mu)' }}>Sous-total HT</span><span>{fmt(ht)}</span></div>
              <div className="flex justify-between text-xs py-1"><span style={{ color: 'var(--mu)' }}>TVA {tva}%</span><span>{fmt(ht * tva / 100)}</span></div>
              <div className="flex justify-between text-sm font-semibold py-2.5 border-t mt-1" style={{ borderColor: 'var(--ink)' }}>
                <span>TOTAL TTC</span><span>{fmt(ttc)}</span>
              </div>
              {acompte > 0 && (
                <div className="rounded-lg p-2.5 mt-2" style={{ background: '#FBF3E3' }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#8A5A20', fontWeight: 500 }}>Acompte {acompte}%</span>
                    <span className="font-semibold" style={{ color: '#8A5A20' }}>{fmt(acpAmt)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] mt-1"><span style={{ color: 'var(--mu)' }}>Solde à réception</span><span>{fmt(ttc - acpAmt)}</span></div>
                </div>
              )}
              <div className="rounded-lg p-2.5 mt-2 text-[10px] leading-relaxed" style={{ background: 'var(--s50)', color: 'var(--mu)' }}>
                Validité 30 jours · TVA acquittée sur encaissements · Paiement virement ou chèque
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t bg-white flex flex-col gap-2" style={{ borderColor: 'var(--s100)' }}>
        <button
          onClick={saveDevis}
          disabled={saving}
          className="w-full h-12 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--ink)', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Enregistrement…' : '✉ Envoyer le devis'}
        </button>
        <button
          className="w-full h-12 rounded-xl text-sm font-medium border"
          style={{ borderColor: 'var(--s200)', color: 'var(--ink)' }}
          onClick={() => setScreen('builder')}
        >
          Faire signer sur l'écran
        </button>
      </div>
    </div>
  )
}
