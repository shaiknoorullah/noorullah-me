/* Stage — the island entry. Owns the Canvas, quality tiering, Lenis smooth
   scroll (wired to GSAP per DESIGN.md §3, heavier lerp 0.085 + magnetic
   proximity snap per §10.6), the Director, and the DOM choreography.
   Everything behind the content; the page conducts the film. */

import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import Lenis from 'lenis';
import Snap from 'lenis/snap';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Director } from '../../lib/director';
import { quality, REDUCED } from '../../lib/store';
import { initDomChoreography } from '../../lib/choreography';
import { StillLife } from './StillLife';
import { ParticleField } from './ParticleField';
import { LightShaft } from './LightShaft';
import { StatementText } from './StatementText';
import { Effects } from './Effects';
import { Rig } from './Rig';

gsap.registerPlugin(ScrollTrigger);

/* Snap anchors: act boundaries only — the statement pin range and the
   principles horizontal pin range own their scrub (§10.6). */
const SNAP_ANCHOR_IDS = ['work', 'evidence', 'about', 'writing', 'contact'];

/* expo-out, per §10.6 */
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function detectTier(): typeof quality.tier {
  if (typeof navigator === 'undefined') return 'mid';
  const forced = new URLSearchParams(location.search).get('tier');
  if (forced === 'low' || forced === 'mid' || forced === 'high') return forced;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (coarse || mem <= 4 || cores <= 4) return 'low';
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl!.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software/i.test(renderer)) return 'low';
    if (/intel(?!.*arc)|uhd|iris/i.test(renderer)) return 'mid';
  } catch {
    /* default */
  }
  return 'high';
}

export default function Stage() {
  const [ready, setReady] = useState(false);
  const [sun, setSun] = useState<THREE.Mesh | null>(null);
  const director = useMemo(() => new Director(REDUCED), []);

  useEffect(() => {
    quality.tier = detectTier();

    let lenis: Lenis | null = null;
    let snap: Snap | null = null;
    let raf: ((time: number) => void) | null = null;
    if (!REDUCED) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      // magnetic scroll (§10.6): proximity snap to act boundaries.
      // Reduced motion: no lenis, no snap.
      snap = new Snap(lenis, {
        type: 'proximity',
        debounce: 120,
        duration: 1.1,
        easing: expoOut,
      });
      raf = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    /* choreography first (pins change layout), then resolve anchors,
       then refresh so triggers and keys agree */
    const teardownDom = initDomChoreography(lenis, director);
    ScrollTrigger.refresh();
    director.buildKeys();

    let snapOffs: Array<() => void> = [];
    const rebuild = () => {
      // 'refresh' fires with pin spacers applied — both the shot keys and
      // the snap anchors land where sections actually arrive
      director.buildKeys();
      if (snap) {
        snapOffs.forEach((off) => off());
        snapOffs = [snap.add(0)];
        for (const id of SNAP_ANCHOR_IDS) {
          const el = document.getElementById(id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top + (window.scrollY || 0);
          snapOffs.push(snap.add(top));
        }
      }
    };
    addEventListener('resize', rebuild);
    ScrollTrigger.addEventListener('refresh', rebuild);
    // fonts affect layout -> key positions
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    const onPointer = (e: PointerEvent) => {
      director.setPointer((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    };
    addEventListener('pointermove', onPointer);

    // QA/debug handle (harmless in production)
    (window as unknown as { __dir?: Director }).__dir = director;

    setReady(true);

    return () => {
      removeEventListener('resize', rebuild);
      ScrollTrigger.removeEventListener('refresh', rebuild);
      removeEventListener('pointermove', onPointer);
      snapOffs.forEach((off) => off());
      snap?.destroy();
      teardownDom();
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, [director]);

  const low = quality.tier === 'low';

  return (
    <Canvas
      shadows
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping, // grade happens in the composer (AgX)
      }}
      dpr={low ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: 26, near: 0.1, far: 120, position: [4.6, 2.75, 7.2] }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('loader')?.classList.add('done');
      }}
    >
      <Suspense fallback={null}>
        <StillLife director={director} onSun={setSun} />
        <ParticleField />
        <LightShaft />
        <StatementText />
        {ready && <Rig director={director} />}
        <Effects director={director} sun={sun} />
      </Suspense>
    </Canvas>
  );
}
