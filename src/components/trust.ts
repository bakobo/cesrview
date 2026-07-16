import type { TrustAssumption } from '@entviz/core';

/** One shared corpus trust posture for every value in a pasted stream (decision e5vk7n). A pasted
 * CESR stream is a single-origin body of values — entviz's own example of a corpus is "a KERI KEL
 * from the user's own machine" — so its pills opt into entviz's recognition aids (a scannable
 * mnemonic, the colorbar icon, and an auto-color tint) that make RECURRENCE legible at a glance,
 * without ever asserting equality by eye. Greppable and auditable: every stream pill references THIS
 * assumption; verification of cross-origin sameness still routes through the entviz compare flow. */
export const STREAM_TRUST: TrustAssumption = { posture: 'corpus', mnemonic: true, icon: true, autoColor: true };
