import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ChevronRight } from 'lucide-react'
import { fmt, fmtDate, getInitials } from '@/lib/utils'
import { TRADES } from '@/lib/trades'
import type { Document, Artisan } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  signed: 'Signé',
  paid: 'Payé ✓',
  late: 'Impayé ⚠',
  cancelled: 'Annulé',
}

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-[var(--s50)] text-[var(--mu)]',
  sent: 'bg-blue-50 text-blue-700',
  signed: 'bg-blue-50 text-blue-800',
  paid: 'bg-green-50 text-green-700',
  late: 'bg-red-50 text-red-700',
  cancelled: 'bg-[var(--s50)] text-[var(--mu)]',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: artisan }, { data: docs }] = await Promise.all([
    supabase.from('artisans').select('*').eq('user_id', user.id).single(),
    supabase
      .from('documents')
      .select('*, client:clients(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (!artisan) redirect('/onboarding')

  const trade = TRADES[artisan.trade as keyof typeof TRADES]

  const thisMonth = docs?.filter((d: Document) => {
    const created = new Date(d.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }) ?? []

  const lateCount = docs?.filter((d: Document) => d.status === 'late').length ?? 0

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 bg-white border-b" style={{ borderColor: 'var(--s100)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs" style={{ color: 'var(--mu)' }}>Bonjour 👋</p>
            <p className="text-xl font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
              {artisan.name}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold text-white"
            style={{ background: 'var(--ink)', fontFamily: 'Playfair Display, serif' }}
          >
            {getInitials(artisan.name)}
          </div>
        </div>
        <Link
          href="/parametres"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity"
          style={{ background: 'var(--s50)', border: '1px solid var(--s100)' }}
        >
          <span>{trade?.icon}</span>
          <span>{trade?.label}</span>
          <ChevronRight size={11} color="var(--mu)" />
        </Link>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-3 gap-px"
        style={{ background: 'var(--s100)' }}
      >
        {[
          { label: 'Ce mois', value: fmt(thisMonth.reduce(() => 0, 0)), sub: `${thisMonth.length} docs` },
          { label: 'Impayés', value: lateCount > 0 ? `${lateCount}` : '0', sub: lateCount > 0 ? 'à relancer' : 'Tout ok ✓', warn: lateCount > 0 },
          { label: 'Taux MO', value: `${trade?.taux ?? 0}€`, sub: 'par heure' },
        ].map(({ label, value, sub, warn }) => (
          <div key={label} className="py-3 px-3" style={{ background: 'var(--cr)' }}>
            <p
              className="text-lg font-semibold leading-none mb-1"
              style={{ fontFamily: 'Playfair Display, serif', color: warn ? 'var(--or)' : 'var(--ink)' }}
            >
              {value}
            </p>
            <p className="text-[9.5px] uppercase tracking-wider" style={{ color: 'var(--mu)' }}>{label}</p>
            <p className="text-[10px] mt-0.5 font-medium" style={{ color: warn ? 'var(--or)' : '#6DAB8A' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="flex-1 px-4 pt-3 pb-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--mu)' }}>
          Récents
        </p>
        <div className="bg-white rounded-xl border" style={{ borderColor: 'var(--s100)' }}>
          {docs && docs.length > 0 ? (
            docs.map((doc: Document & { client: { name: string } | null }, i: number) => (
              <Link
                key={doc.id}
                href={`/devis/${doc.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--s50)]"
                style={{ borderBottom: i < docs.length - 1 ? '1px solid var(--s100)' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold">
                      {doc.type === 'facture' ? 'Facture' : 'Devis'} {doc.number}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CLASS[doc.status]}`}>
                      {STATUS_LABEL[doc.status]}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--mu)' }}>
                    {doc.client?.name} · {fmtDate(doc.created_at)}
                  </p>
                </div>
                <ChevronRight size={14} color="var(--s200)" />
              </Link>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--mu)' }}>Aucun document</p>
              <p className="text-xs mt-1" style={{ color: 'var(--s300)' }}>Créez votre premier devis</p>
            </div>
          )}
        </div>

        {(docs?.length ?? 0) > 0 && (
          <Link
            href="/historique"
            className="block w-full text-center py-2.5 mt-2 rounded-xl text-sm border transition-colors"
            style={{ borderColor: 'var(--s200)', color: 'var(--ink)' }}
          >
            Voir tout l'historique →
          </Link>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Link
          href="/devis/nouveau"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--ink)' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Nouveau devis
        </Link>
      </div>
    </div>
  )
}
