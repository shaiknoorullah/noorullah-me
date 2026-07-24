/* Studio rig constants for the Strata set (DESIGN.md §10.2/§10.5).
   World coordinates are the GLB's own (Y-up): stack centre ≈ (-0.25, 1.26,
   -0.12), plinth top y=0.35, jali screen at (-2.4, 1.25, -1.9) rotated 38°. */

import * as THREE from 'three';

/* The key sits beyond the jali screen (behind-left of the set) so its cone
   passes THROUGH the real lattice geometry before landing on the stack —
   the lattice shadow is geometry-cast, and the volumetric cookie agrees. */
export const KEY_POS = new THREE.Vector3(-5.0, 3.3, -4.0);
export const KEY_TGT = new THREE.Vector3(-0.25, 1.1, -0.12);

/* Cool ionic fill from the right, low and broad. */
export const FILL_POS = new THREE.Vector3(5.5, 2.2, 3.0);

/* Ember rim from behind-right — separates glass and chrome from the dark. */
export const RIM_POS = new THREE.Vector3(4.5, 3.2, -4.0);

/* The stack's visual centre — what the key cone and the cameras speak to. */
export const STACK_CENTER = new THREE.Vector3(-0.25, 1.26, -0.12);

/* The jali screen's authored transform (from strata.glb). */
export const JALI_POS = new THREE.Vector3(-2.4, 1.25, -1.9);

/* 5600K neutral key, ember-warm rim, ionic-tinted fill, signal cursor. */
export const KEY_COLOR = 0xfff6ec;
export const FILL_COLOR = 0x3552e8;
export const RIM_COLOR = 0xff6b1a;
export const SIGNAL = 0xa4eb53;
