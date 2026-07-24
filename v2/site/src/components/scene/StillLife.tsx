/* Strata (DESIGN.md §10.2) — the Blender-authored hero set, loaded from
   strata.glb and re-materialed in code (the GLB node materials are export
   placeholders). Five glass slabs floating over a granite plinth, the
   signal-green cursor cube suspended in the center gap, chrome sphere in
   its carved seat, brushed counterweight, and the jali screen standing
   behind-left so the key spot passes THROUGH it — the lattice shadow is
   geometry-cast, not a texture trick. Lighting per §10.1: key = neutral
   5600K white, fill = ionic-tinted cool, rim = ember-warm, and the cursor
   cube is the light. */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, useGLTF } from '@react-three/drei';
import type { Director } from '../../lib/director';
import { loadStudioEnvironment } from '../../lib/three/environment';
import {
  createBrushedMetalMaterial,
  createBronzeMaterial,
  createChromeMaterial,
  createCursorCubeMaterial,
  createFloorMaterial,
  createGraniteMaterial,
  createStrataGlassMaterial,
} from '../../lib/three/materials';
import { FILL_COLOR, FILL_POS, KEY_COLOR, KEY_POS, KEY_TGT, RIM_COLOR, RIM_POS, SIGNAL } from '../../lib/three/rig';
import { REDUCED } from '../../lib/store';

const _rotY = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

export function StillLife({ director, onSun }: { director: Director; onSun?: (m: THREE.Mesh) => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const gltf = useGLTF('/assets/strata.glb');

  const mats = useMemo(
    () => ({
      glassClear: createStrataGlassMaterial('clear'),
      glassFrosted: createStrataGlassMaterial('frosted'),
      glassSmoked: createStrataGlassMaterial('smoked'),
      chrome: createChromeMaterial(),
      granite: createGraniteMaterial(),
      floor: createFloorMaterial(),
      bronze: createBronzeMaterial(),
      brushed: createBrushedMetalMaterial(),
      cursor: createCursorCubeMaterial(),
    }),
    [],
  );

  const cubeMesh = useRef<THREE.Mesh | null>(null);
  const cubeHome = useRef({ pos: new THREE.Vector3(), quat: new THREE.Quaternion() });

  /* Override every material + shadow flags; find the cursor cube. Done in
     useMemo so the first rendered frame already wears the right materials. */
  useMemo(() => {
    gltf.scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const name = o.name;
      if (name === 'floor') {
        o.material = mats.floor;
        o.receiveShadow = true;
      } else if (name === 'plinth') {
        o.material = mats.granite;
        o.castShadow = true;
        o.receiveShadow = true;
      } else if (name === 'chrome_sphere') {
        o.material = mats.chrome;
        o.castShadow = true;
      } else if (name.startsWith('strata_')) {
        const i = Number(name.slice(7));
        o.material = i === 2 ? mats.glassSmoked : i === 1 || i === 3 ? mats.glassFrosted : mats.glassClear;
        o.castShadow = true;
      } else if (name === 'cursor_cube') {
        o.material = mats.cursor;
        cubeMesh.current = o;
        cubeHome.current.pos.copy(o.position);
        cubeHome.current.quat.copy(o.quaternion);
      } else if (name === 'counter_bar') {
        o.material = mats.brushed;
        o.castShadow = true;
      } else if (name === 'jali_screen') {
        o.material = mats.bronze;
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [gltf, mats]);

  /* The cube is the god-rays sun (§10.5) once mounted, and it carries its
     own practical point light — parented so it levitates with the cube. */
  const cubeLight = useRef<THREE.PointLight | null>(null);
  useEffect(() => {
    const cube = cubeMesh.current;
    if (!cube) return;
    onSun?.(cube);
    const l = new THREE.PointLight(SIGNAL, 2.5, 3, 2);
    cube.add(l);
    cubeLight.current = l;
    return () => {
      cube.remove(l);
      l.dispose();
      cubeLight.current = null;
    };
  }, [onSun]);

  /* Cycles studio HDRI -> PMREM -> environment (never the background). */
  useEffect(() => {
    let dead = false;
    let env: THREE.Texture | null = null;
    loadStudioEnvironment(gl, '/assets/studio.hdr')
      .then((t) => {
        if (dead) {
          t.dispose();
          return;
        }
        env = t;
        scene.environment = t;
      })
      .catch(() => {
        /* HDR missing: set stays lit by the rig alone */
      });
    return () => {
      dead = true;
      scene.environment = null;
      env?.dispose();
    };
  }, [gl, scene]);

  /* Fog + background belong to the SCENE — attaching them inside the
     component's <group> would set them on the group (a v1.0 no-op that
     also broke the director's fog-density drive). True black both. */
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x000000, 0.024);
    scene.background = new THREE.Color(0x000000);
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene]);

  /* Light targets must live in the scene graph. */
  const key = useRef<THREE.SpotLight>(null!);
  const fill = useRef<THREE.SpotLight>(null!);
  const rim = useRef<THREE.SpotLight>(null!);
  useEffect(() => {
    const k = key.current;
    const f = fill.current;
    const r = rim.current;
    k.target.position.copy(KEY_TGT);
    f.target.position.copy(KEY_TGT);
    r.target.position.set(0.2, 1.0, 0.2);
    scene.add(k.target, f.target, r.target);
    return () => {
      scene.remove(k.target, f.target, r.target);
    };
  }, [scene]);

  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const cube = cubeMesh.current;
    if (cube) {
      if (REDUCED) {
        cube.position.copy(cubeHome.current.pos);
        cube.quaternion.copy(cubeHome.current.quat);
      } else {
        // levitation: ±4cm at ~0.25Hz, plus a slow turn on its own axis
        cube.position.y = cubeHome.current.pos.y + Math.sin(t * Math.PI * 0.5) * 0.04;
        _rotY.setFromAxisAngle(_up, t * 0.35);
        cube.quaternion.copy(cubeHome.current.quat).multiply(_rotY);
      }
    }
    // the contact act brightens the cube +40% — the light stays on
    const b = director.cubeBoost;
    mats.cursor.emissiveIntensity = 3.5 * b;
    if (cubeLight.current) cubeLight.current.intensity = 2.5 * b;
  });

  return (
    <group>
      {/* ————— lighting rig (§10.1/§10.5) ————— */}
      {/* key: neutral 5600K softbox, behind-left THROUGH the jali screen.
          Intensity is exposure-disciplined (R13): the frosted slab must
          hold detail; AgX's shoulder rolls the rest. */}
      <spotLight
        ref={key}
        position={KEY_POS.toArray()}
        color={KEY_COLOR}
        intensity={200}
        angle={0.6}
        penumbra={0.5}
        decay={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
      />
      {/* fill: ionic-tinted cool from the right, low — lifts floors, never to gray */}
      <spotLight
        ref={fill}
        position={FILL_POS.toArray()}
        color={FILL_COLOR}
        intensity={42}
        angle={0.7}
        penumbra={0.9}
        decay={2}
      />
      {/* rim: ember-warm from behind-right — separates glass and chrome.
          Soft penumbra so the sphere's specular doesn't read as a hot dot. */}
      <spotLight
        ref={rim}
        position={RIM_POS.toArray()}
        color={RIM_COLOR}
        intensity={80}
        angle={0.5}
        penumbra={1}
        decay={2}
      />
      <hemisphereLight args={[0x0a0a0c, 0x000000, 0.22]} />

      {/* ————— the set ————— */}
      <primitive object={gltf.scene} />

      <ContactShadows position={[0, 0.002, 0]} opacity={0.66} scale={11} blur={2.6} far={4} resolution={512} color="#000000" />
    </group>
  );
}

useGLTF.preload('/assets/strata.glb');
