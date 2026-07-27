/* Light rig + palette constants for The Substrate (SPEC §6, DESIGN §10.1).
   World space is the exported GLB's (Y-up, meters): the board slab spans
   BOARD_MIN..BOARD_MAX with components up, the die set sits at DIE_Y as the
   second nested scale under the socket (SPEC §4). Positions are anchored to
   the generated anchors so a pipeline re-run never strands the rig. */

import * as THREE from 'three'
import {
  BOARD_MAX,
  BOARD_MIN,
  DIE_Y,
  SOCKET_POS,
  SURFACE_Y,
} from './anchors.generated'

/* 5600K key, camera-left and low — long component shadows across the slab
   (storyboard hero_depth). Cool ionic fill ~15% from the right, ember rim
   behind the VRM/I-O skyline. Never aim saturated blue + orange at the same
   glossy curve (storyboard lesson). */
export const KEY_POS = new THREE.Vector3(-11, SURFACE_Y + 3.0, -1)
export const KEY_TGT = new THREE.Vector3(0, SURFACE_Y + 0.4, 1)
export const FILL_POS = new THREE.Vector3(6, SURFACE_Y + 4.5, -4)
export const RIM_POS = new THREE.Vector3(2.5, SURFACE_Y + 1.8, 9.5)

export const KEY_COLOR = 0xfff6ec
export const FILL_COLOR = 0x3552e8
export const RIM_COLOR = 0xff6b1a
export const SIGNAL = 0xa4eb53
export const BONE = 0xf2f2f5

/* Board/die world constants the scene components read. */
export const BOARD_CENTER = new THREE.Vector3(
  (BOARD_MIN[0] + BOARD_MAX[0]) / 2,
  SURFACE_Y,
  (BOARD_MIN[2] + BOARD_MAX[2]) / 2
)
export const SOCKET = new THREE.Vector3(...SOCKET_POS)
export const DIE_DEPTH = DIE_Y

/* The pulse spill light rides lane 0's head (SPEC §5.1: a dim point light
   rides the primary pulse — proven in storyboard renders). */
export const PULSE_LIGHT_COLOR = SIGNAL
export const PULSE_LIGHT_INTENSITY = 2.2
export const PULSE_LIGHT_DISTANCE = 2.5

export const BASIS_PATH = '/basis/'
export const STUDIO_HDR_URL = '/assets/studio.hdr'
export const SUBSTRATE_GLB_URL = '/assets/substrate.glb'
