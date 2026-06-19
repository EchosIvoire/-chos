import { Trade } from './types'

export const TRADES: Record<
  Trade,
  {
    label: string
    icon: string
    specialty: string
    taux: number
    cat: {
      MO: { label: string; unit: string; price: number }[]
      Four: { label: string; unit: string; price: number }[]
      Forf: { label: string; unit: string; price: number }[]
    }
  }
> = {
  plombier: {
    label: 'Plombier',
    icon: '🔧',
    specialty: 'Plomberie · Chauffage',
    taux: 65,
    cat: {
      MO: [
        { label: "Main d'œuvre", unit: 'h', price: 65 },
        { label: 'Déplacement', unit: 'forfait', price: 35 },
        { label: 'Mise en service chaudière', unit: 'forfait', price: 85 },
        { label: 'Soudure brasure', unit: 'h', price: 75 },
      ],
      Four: [
        { label: 'Joint sphérique 1/2"', unit: 'unité', price: 2.5 },
        { label: 'Tube PER 16mm', unit: 'm', price: 3.8 },
        { label: "Robinet d'arrêt 1/2\"", unit: 'unité', price: 18 },
        { label: 'Vanne à bille 3/4"', unit: 'unité', price: 28 },
        { label: 'Siphon douche', unit: 'unité', price: 12 },
        { label: "Ballon d'eau chaude 100L", unit: 'unité', price: 280 },
        { label: 'Chaudière Vaillant 24kW', unit: 'unité', price: 820 },
      ],
      Forf: [
        { label: 'Réparation fuite', unit: 'forfait', price: 75 },
        { label: 'Remplacement robinet', unit: 'forfait', price: 85 },
        { label: 'Débouchage colonne', unit: 'forfait', price: 120 },
        { label: 'Détartrage chauffe-eau', unit: 'forfait', price: 95 },
        { label: 'Installation chaudière', unit: 'forfait', price: 450 },
      ],
    },
  },
  electricien: {
    label: 'Électricien',
    icon: '⚡',
    specialty: 'Électricité · Domotique',
    taux: 70,
    cat: {
      MO: [
        { label: "Main d'œuvre", unit: 'h', price: 70 },
        { label: 'Déplacement', unit: 'forfait', price: 35 },
        { label: 'Câblage tableau', unit: 'forfait', price: 95 },
        { label: 'Mise en service', unit: 'forfait', price: 55 },
      ],
      Four: [
        { label: 'Câble 1.5mm² (100m)', unit: 'rouleau', price: 45 },
        { label: 'Câble 2.5mm² (100m)', unit: 'rouleau', price: 68 },
        { label: 'Prise 2P+T', unit: 'unité', price: 12 },
        { label: 'Interrupteur simple', unit: 'unité', price: 8 },
        { label: 'Disjoncteur 20A', unit: 'unité', price: 18 },
        { label: 'Disj. différentiel 40A', unit: 'unité', price: 65 },
        { label: 'Tableau 13 modules', unit: 'unité', price: 85 },
        { label: 'Spot LED encastré', unit: 'unité', price: 25 },
      ],
      Forf: [
        { label: 'Pose prise électrique', unit: 'forfait', price: 45 },
        { label: 'Pose interrupteur', unit: 'forfait', price: 40 },
        { label: 'Dépannage urgence', unit: 'forfait', price: 120 },
        { label: 'Tableau complet', unit: 'forfait', price: 380 },
        { label: 'Mise en conformité', unit: 'forfait', price: 250 },
      ],
    },
  },
  menuisier: {
    label: 'Menuisier',
    icon: '🪚',
    specialty: 'Menuiserie · Parquet',
    taux: 55,
    cat: {
      MO: [
        { label: "Main d'œuvre", unit: 'h', price: 55 },
        { label: 'Déplacement', unit: 'forfait', price: 30 },
        { label: 'Ajustage finition', unit: 'h', price: 45 },
      ],
      Four: [
        { label: 'Parquet stratifié', unit: 'm²', price: 22 },
        { label: 'Parquet massif chêne', unit: 'm²', price: 65 },
        { label: 'Porte intérieure iso', unit: 'unité', price: 180 },
        { label: 'Porte blindée A2P', unit: 'unité', price: 650 },
        { label: 'Plinthes MDF 70mm', unit: 'ml', price: 4 },
        { label: 'Serrure 3 points', unit: 'unité', price: 45 },
      ],
      Forf: [
        { label: 'Pose parquet flottant', unit: 'm²', price: 35 },
        { label: 'Pose porte intérieure', unit: 'forfait', price: 85 },
        { label: 'Pose fenêtre double vitrage', unit: 'forfait', price: 120 },
        { label: 'Remplacement vitrage', unit: 'forfait', price: 95 },
        { label: 'Ponçage parquet', unit: 'm²', price: 12 },
      ],
    },
  },
  peintre: {
    label: 'Peintre',
    icon: '🖌️',
    specialty: 'Peinture · Revêtements',
    taux: 45,
    cat: {
      MO: [
        { label: "Main d'œuvre", unit: 'h', price: 45 },
        { label: 'Déplacement', unit: 'forfait', price: 25 },
        { label: 'Préparation support', unit: 'h', price: 38 },
      ],
      Four: [
        { label: 'Peinture blanche mat 10L', unit: 'pot', price: 45 },
        { label: 'Peinture teintée 10L', unit: 'pot', price: 55 },
        { label: 'Sous-couche acrylique 5L', unit: 'pot', price: 28 },
        { label: 'Enduit de lissage 15kg', unit: 'sac', price: 18 },
        { label: 'Toile de verre standard', unit: 'rouleau', price: 24 },
        { label: 'Ruban masquage 50m', unit: 'rouleau', price: 4 },
      ],
      Forf: [
        { label: 'Peinture murs (2 couches)', unit: 'm²', price: 18 },
        { label: 'Peinture plafond', unit: 'm²', price: 22 },
        { label: 'Ravalement façade', unit: 'm²', price: 45 },
        { label: 'Pose papier peint', unit: 'm²', price: 25 },
      ],
    },
  },
  carreleur: {
    label: 'Carreleur',
    icon: '◼',
    specialty: 'Carrelage · Faïence',
    taux: 55,
    cat: {
      MO: [
        { label: "Main d'œuvre", unit: 'h', price: 55 },
        { label: 'Déplacement', unit: 'forfait', price: 30 },
        { label: 'Découpe sur mesure', unit: 'h', price: 40 },
      ],
      Four: [
        { label: 'Carrelage sol 60×60', unit: 'm²', price: 28 },
        { label: 'Carrelage mural 30×60', unit: 'm²', price: 32 },
        { label: 'Faïence salle de bain', unit: 'm²', price: 35 },
        { label: 'Colle flexible C2', unit: 'sac 25kg', price: 22 },
        { label: 'Joint époxy', unit: 'kg', price: 12 },
        { label: 'Profilé finition alu', unit: 'ml', price: 6 },
      ],
      Forf: [
        { label: 'Pose carrelage sol', unit: 'm²', price: 35 },
        { label: 'Pose carrelage mural', unit: 'm²', price: 42 },
        { label: 'Dépose ancien carrelage', unit: 'm²', price: 20 },
        { label: 'Chape autonivelante', unit: 'm²', price: 28 },
        { label: 'Plinthes carrelage', unit: 'ml', price: 15 },
      ],
    },
  },
  macon: {
    label: 'Maçon',
    icon: '🧱',
    specialty: 'Maçonnerie · Gros œuvre',
    taux: 50,
    cat: {
      MO: [
        { label: "Main d'œuvre", unit: 'h', price: 50 },
        { label: 'Déplacement', unit: 'forfait', price: 35 },
        { label: 'Ferraillage', unit: 'h', price: 60 },
      ],
      Four: [
        { label: 'Parpaing 20cm', unit: 'unité', price: 1.8 },
        { label: 'Béton prêt (m³)', unit: 'm³', price: 120 },
        { label: 'Ciment CEM II 35kg', unit: 'sac', price: 12 },
        { label: 'Sable 0/4 (tonne)', unit: 'tonne', price: 85 },
        { label: 'Linteau béton 2.4m', unit: 'unité', price: 45 },
        { label: 'Armature HA (barre 6m)', unit: 'barre', price: 18 },
      ],
      Forf: [
        { label: 'Mur en parpaing', unit: 'm²', price: 95 },
        { label: 'Dalle béton', unit: 'm²', price: 65 },
        { label: 'Enduit façade monocouche', unit: 'm²', price: 35 },
        { label: 'Démolition cloison', unit: 'm²', price: 25 },
        { label: 'Reprise fissure injection', unit: 'ml', price: 85 },
      ],
    },
  },
}
