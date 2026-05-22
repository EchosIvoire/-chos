export type Trade =
  | 'plombier'
  | 'electricien'
  | 'menuisier'
  | 'peintre'
  | 'carreleur'
  | 'macon'

export type DocumentStatus =
  | 'draft'
  | 'sent'
  | 'signed'
  | 'paid'
  | 'late'
  | 'cancelled'

export type DocumentType = 'devis' | 'facture'

export interface Artisan {
  id: string
  name: string
  siret: string
  phone: string
  email: string
  trade: Trade
  address?: string
  tva_intra?: string
  created_at: string
}

export interface Client {
  id: string
  artisan_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  created_at: string
}

export interface LigneDevis {
  id: string
  document_id: string
  label: string
  unit: string
  price_ht: number
  qty: number
  remise: number
  cat: 'MO' | 'Four' | 'Forf' | 'Custom'
  is_mo: boolean
  position: number
}

export interface Document {
  id: string
  artisan_id: string
  client_id: string
  type: DocumentType
  status: DocumentStatus
  number: string
  tva_rate: number
  acompte_pct: number
  urgence: boolean
  note?: string
  signed_at?: string
  sent_at?: string
  paid_at?: string
  created_at: string
  updated_at: string
  client?: Client
  lignes?: LigneDevis[]
}

export interface CatalogueItem {
  id: string
  artisan_id: string
  label: string
  unit: string
  price_ht: number
  cat: 'MO' | 'Four' | 'Forf'
  trade: Trade
}

export type TvaMode = 10 | 20 | 5.5
