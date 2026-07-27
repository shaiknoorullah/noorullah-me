/* Studio environment (SPEC §6): the existing Cycles-rendered studio HDRI
   loaded once into a PMREM for scene.environment. Background stays pure
   black; the HDRI only feeds reflections and IBL (bake-first hybrid:
   baked AO + realtime PMREM specular life). */

import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

export async function loadStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  url: string
): Promise<THREE.Texture> {
  const hdr = await new RGBELoader().loadAsync(url)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envMap = pmrem.fromEquirectangular(hdr).texture
  hdr.dispose()
  pmrem.dispose()
  return envMap
}
