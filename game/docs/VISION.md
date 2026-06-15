# Vision consolidée — L'Échine × live-service coop/économie

Décidé le 2026-06-15. Ce doc relie la **bible** (`GAME_BIBLE.md`) à l'**architecture**
(`ARCHITECTURE.md`) et au modèle éco. En cas de doute narratif → bible. En cas de
doute technique → architecture.

## La décision

L'Échine n'est **pas** un remplacement : c'est l'**univers + le système de 5 Voies +
les mécaniques signature** posés sur le squelette multijoueur/économie d'origine.
On **garde** : Nakama (serveur autoritatif), co-op en instances, arènes PvP,
métiers/craft, **boutique cosmétique F2P zéro-P2W**.

> ⚠️ C'est le périmètre le plus ambitieux. Règle de survie (dev solo) :
> **vertical slice d'abord** — 1 région (Les Crêtes), 1 Voie (Brasier), 1 boss,
> de bout en bout — avant de dérouler les autres Voies/régions/actes.
> La campagne 3 actes et les 5 classes = du contenu qu'on **étale**, pas qu'on
> sort d'un coup. 1 à 2 Voies au lancement, les autres en contenu additionnel.

## Comment chaque pilier d'origine se relit en L'Échine

| Pilier d'origine | Devient, en L'Échine |
|---|---|
| Classes / arbre de skills | **Les 5 Voies** (1 Voie = 1 classe, 5 compétences débloquées via la trame) |
| Ressource (mana générique) | **Le Souffle** (rempli en combattant/écoutant) |
| Zones co-op partagées | **Les Régions** = parties du corps d'Ourane ; jouables solo OU co-op (amis dans ton instance) |
| Métiers / farm Dofus | Récolte sur l'Échine + **la Moelle** comme ressource ambiguë (boost vs vie du monde) |
| Arènes PvP | Les Voies s'affrontent en arène — vitrine des skins |
| Progression long terme | Trame 3 actes + amélioration des compétences + rejouabilité par Voie |
| Cosmétiques (modèle éco) | Skins/familiers/**traînées de Voie** (poussière, braises, ombre, ondes, halo) |
| Mécaniques signature | **L'Écoute**, **le monde qui respire**, **la descente** (Acte III) |

## Architecture — ce qui ne change pas

- **Serveur autoritatif Nakama** : progression, loot, Souffle, Moelle, métiers,
  **entitlements cosmétiques** restent côté serveur. Le client n'est jamais cru.
- **Shards / instances** : régions = instances bornées reliées (cf. `ARCHITECTURE.md`),
  pas de monde seamless. Co-op = instance partagée ; PvP = arène matchmakée.
- **Cosmétiques découplés des stats** : les traînées/skins de Voie sont 100% visuels.
- **Logique de combat pure et testable** (`scripts/core/combat.gd`) : inchangé,
  c'est la base des kits de Voie.

## Roadmap fusionnée (les phases gardent leur ordre, relues L'Échine)

- **Phase 1 ✅** Cœur de combat ARPG (déplacement, esquive/i-frames, attaque, skill,
  feedback, IA mob). = socle d'un kit de Voie.
- **Phase 2** Perso persistant + **1 Voie jouable** (Brasier, classe d'entrée) avec
  ses 1res compétences + **jauge de Souffle** + 1 skin cosmétique + boutique factice.
- **Phase 3** Co-op autoritatif Nakama : 2 joueurs dans une instance de région.
- **Phase 4** Métiers/craft + inventaire persistant (récolte + Moelle).
- **Phase 5** Arène PvP : les Voies s'affrontent, skins exposés.
- **Phase 6** Boutique réelle + entitlements + IAP (strictement cosmétique).
- **Phase 7** Trame & contenu : **vertical slice = Acte I aux Crêtes** d'abord
  (quêtes, maître, 1er boss, mécanique d'Écoute), puis on étend.
- **Phase 8** Finalisation mobile (tactile, perf, AAB).

Les mécaniques signature (**Écoute**, **monde qui respire**, **Moelle**) s'introduisent
progressivement dès la Phase 2 (Souffle) et s'enrichissent en 4/7.

## Questions ouvertes (à trancher quand utile, pas bloquantes)

1. **Titre du jeu** : « Aurendel » (titre travail actuel dans le code) vs « L'Échine »
   vs autre. À confirmer — pas urgent, renommage trivial.
2. **Co-op et narration** : la campagne se joue-t-elle en co-op (l'ami rejoint ton
   histoire) ou la co-op est-elle réservée au farm/donjons hors-trame ? → à décider en Phase 3.
3. **Voie(s) du lancement** : combien de Voies au lancement (reco : 1-2), lesquelles.
