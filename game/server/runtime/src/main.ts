/**
 * Aurendel — runtime serveur Nakama (TypeScript).
 *
 * PRINCIPE NON NEGOCIABLE : logique AUTORITATIVE serveur.
 * Le client n'est jamais cru. Progression, loot, economie, metiers et
 * entitlements cosmetiques sont valides/ecrits ici, jamais par le client.
 *
 * Phase 0 : squelette + 1 RPC de sante. Les systemes viendront se brancher
 * phase par phase :
 *   - Phase 2 : equip_cosmetic (verifie possession dans `entitlements`)
 *   - Phase 4 : metiers / craft / inventaire
 *   - Phase 6 : grant_cosmetic (achat boutique, ecriture serveur exclusive)
 */

const RPC_HEALTHCHECK = "healthcheck";

/** RPC de sante : confirme que le runtime autoritatif tourne. */
function rpcHealthcheck(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  return JSON.stringify({ ok: true, service: "aurendel", ts: Date.now() });
}

/** Point d'entree appele par Nakama au demarrage. */
function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
): void {
  initializer.registerRpc(RPC_HEALTHCHECK, rpcHealthcheck);
  logger.info("[Aurendel] runtime autoritatif initialise — Phase 0.");
}

// Empeche esbuild de supprimer InitModule au tree-shaking.
// (Nakama recupere InitModule depuis le bundle global.)
!InitModule && InitModule.bind(null);
