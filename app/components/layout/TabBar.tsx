'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Settings } from 'lucide-react'

const tabs = [
  { href: '/tableau-de-bord', label: 'Accueil', icon: Home },
  { href: '/historique', label: 'Historique', icon: FileText },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
]

export default function TabBar() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex h-16 border-t z-40"
      style={{ background: 'white', borderColor: 'var(--s100)' }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = path === href || (href !== '/tableau-de-bord' && path.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors"
            style={{ color: active ? 'var(--ink)' : 'var(--mu)' }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
