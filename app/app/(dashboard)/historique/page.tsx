import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { fmt, fmtDate } from '@/lib/utils'
import { TRADES } from '@/lib/trades'
import type { Document, Trade } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyé', signed: 'Signé', paid: 'Payé ✓', late: 'Impayé ⚠', cancelled: 'Annulé',
}
const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-[var(--s50)] text-[var(--mu)]',
  sent: 'bg-blue-50 text-blue-700',
  signed: 'bg-blue-50 text-blue-800',
  paid: 'bg-green-50 text-green-700',
  late: 'bg-red-50 text-red-700',
  cancelled: 'bg-[var(--s50)] text-[var(--mu)]',
}

export default async function HistoriquePage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { f: filter = 'all' } = await searchParams

  const { data: artisan } = await supabase.from('artisans').select('trade').eq('user_id', user.id).single()
  const { data: docs } = await supabase
    .from('documents')
    .select('*, client:clients(name)')
    .order('created_at', { ascending: false })

  const filtered = (docs ?? []).filter((d: Document) => {
    if (filter === 'devis') return d.type === 'devis'
    if (filter === 'fact') return d.type === 'facture'
    if (filter === 'wait') return d.status === 'sent'
    if (filter === 'late') return d.status === 'late'
    if (filter === 'paid') return d.status === 'paid'
    return true
  })

  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'devis', label: 'Devis' },
    { key: 'fact', label: 'Factures' },
    { key: 'wait', label: 'En attente' },
    { key: 'late', label: 'Impayés' },
    { key: 'paid', label: 'Payés' },
  ]

  const trade = TRADES[(artisan?.trade as Trade) ?? 'plombier']

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center px-5 h-13 bg-white border-b flex-shrink-0" style={{ borderColor: 'var(--s100)' }}>
        <p className="text-base font-semibold flex-1">Historique</p>
        <button className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--s50)', color: 'var(--ink)' }}>
          Exporter
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 py-2.5 border-b bg-white overflow-x-auto no-scrollbar flex-shrink-0" style={{ borderColor: 'var(--s100)' }}>
        {filters.map(({ key, label }) => (
          <Link
            key={key}
            href={`/historique?f=${key}`}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{
              background: filter === key ? 'var(--ink)' : 'var(--s50)',
              color: filter === key ? 'white' : 'var(--mu)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <p className="text-sm" style={{ color: 'var(--mu)' }}>Aucun document</p>
          </div>
        ) : (
          filtered.map((doc: Document & { client: { name: string } | null }, i: number) => (
            <Link
              key={doc.id}
              href={`/devis/${doc.id}`}
              className="flex items-center gap-3 px-4 py-3 border-b transition-colors hover:bg-[var(--s50)]"
              style={{ borderColor: 'var(--s100)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: 'var(--s50)' }}
              >
                {trade.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">
                    {doc.type === 'facture' ? 'Facture' : 'Devis'} {doc.number}
                  </span>
                  <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CLASS[doc.status]}`}>
                    {STATUS_LABEL[doc.status]}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--mu)' }}>
                  {doc.client?.name} · {fmtDate(doc.created_at)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold">{doc.tva_rate}%</p>
                <p className="text-[11px]" style={{ color: 'var(--mu)' }}>TVA</p>
              </div>
              <ChevronRight size={14} color="var(--s200)" />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
