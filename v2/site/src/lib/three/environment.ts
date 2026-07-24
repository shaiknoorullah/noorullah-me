/* Studio environment (DESIGN.md §10.2): a real Cycles-rendered studio HDRI
   (2k equirect — 5600K key card, cool strip, warm low card, dark room)
   loaded once into a PMREM for scene.environment. The background stays
   pure black; the HDRI only feeds reflections and IBL. */

import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export async function loadStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  url: string,
): Promise<THREE.Texture> {
  const hdr = await new RGBELoader().loadAsync(url);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(hdr).texture;
  hdr.dispose();
  pmrem.dispose();
  return envMap;
}
