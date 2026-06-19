import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(n: number): string {
  return n.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  })
}

export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('fr-FR')
}

export function calcHT(lignes: { price_ht: number; qty: number; remise: number }[]): number {
  return lignes.reduce((s, l) => {
    const base = l.price_ht * l.qty
    return s + base - base * (l.remise / 100)
  }, 0)
}

export function calcTTC(ht: number, tvaRate: number): number {
  return ht * (1 + tvaRate / 100)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function nextDocNumber(existing: string[]): string {
  const year = new Date().getFullYear()
  const nums = existing
    .map((n) => parseInt(n.split('-')[1] || '0'))
    .filter(Boolean)
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${year}-${String(next).padStart(2, '0')}`
}
