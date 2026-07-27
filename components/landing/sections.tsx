/* Landing sections (DESIGN §5 anatomy, SPEC §4 acts). All body/chrome text
   is DOM (readability, selection, SEO); the canvas is atmosphere behind it.
   Section ids match the Director's SECTION_IDS exactly. Headings decode via
   DecodeText; counters, pins, and magnetics are driven by choreography.ts.
   The visually-hidden scene description and statement paragraph are the
   a11y/SEO/reduced-motion sources (SPEC §8). */

import type { CSSProperties, JSX } from 'react'
import { DecodeText } from '../../components/ui/DecodeText'
import { BIO_30W } from '../../lib/bio'

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
}

const mono: CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 'var(--t-xs)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const section: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: 'var(--s-8) var(--s-6)',
}

function SecHead({
  idx,
  label,
  text,
}: {
  idx: string
  label: string
  text: string
}): JSX.Element {
  return (
    <div className="sec-head" style={{ marginBottom: 'var(--s-7)' }}>
      <span className="idx" style={{ ...mono, color: 'var(--bone-1)' }}>
        {idx}
      </span>{' '}
      <span className="lbl" style={{ ...mono, color: 'var(--bone-1)' }}>
        {label}
      </span>
      <DecodeText as="h2" text={text} className="sec-title" delay={0.1} />
      <div
        className="rule"
        style={{
          height: 1,
          background: 'var(--line)',
          marginTop: 'var(--s-4)',
        }}
      />
    </div>
  )
}

const PROJECTS = [
  {
    name: 'Internal Cloud Platform',
    desc: '16-RFC spec, 99.999% availability target, multi-cloud Kubernetes PaaS.',
  },
  {
    name: 'Fleet Commander',
    desc: '35+ agents under one operator, $70/month LLM ceiling.',
  },
  { name: 'AgentHive', desc: 'Go P2P agent mesh — substrate, not SaaS.' },
  {
    name: 'BLOP / mation-engine',
    desc: 'Build-layer orchestration for the platform.',
  },
]

const COUNTERS: {
  count: number
  suffix: string
  label: string
  comma: boolean
  decimals?: number
}[] = [
  { count: 3204, suffix: '', label: 'commits', comma: true },
  { count: 562, suffix: '', label: 'PRs', comma: false },
  { count: 49, suffix: '', label: 'RFCs', comma: false },
  { count: 594, suffix: 'k', label: 'lines shipped (~)', comma: false },
  {
    count: 99.999,
    suffix: '%',
    label: 'availability target',
    comma: false,
    decimals: 3,
  },
  { count: 11, suffix: '→5', label: 'team absorbed', comma: false },
]

const PILLARS = [
  {
    title: 'Substrate over rent',
    body: 'Own the layer everyone else leases. Platforms, not tickets.',
  },
  {
    title: 'Evidence over assertion',
    body: 'Numbers, RFCs, and shipped systems. The evidence is the credential.',
  },
  {
    title: 'Multi-agent leverage',
    body: 'One engineer, ten tickets in parallel. Fleet, not headcount.',
  },
  {
    title: 'FOSS-first',
    body: 'Open tools, open protocols, no rented black boxes in the critical path.',
  },
]

function Credits(): JSX.Element {
  return (
    <div
      style={{
        ...mono,
        color: 'var(--bone-1)',
        maxWidth: '72ch',
        lineHeight: 1.8,
      }}
    >
      <p>
        Model &quot;MotherBoard + Components&quot; by Daniel Cardona
        [sketchfab.com/3d-models/motherboard-components-3bc94057328243d4b341a55f59160f8a],
        licensed CC-BY 4.0, modified (re-materialed, re-lit, optimized)
      </p>
      <p>
        Model &quot;Microchip - Prototype&quot; by re1monsen
        [sketchfab.com/3d-models/microchip-prototype-7d00abe914664a17b4bf18c6e851e7eb],
        licensed CC-BY 4.0, modified (re-materialed, re-lit, optimized)
      </p>
      <p>
        Audio: original, synthesized in-repo from oscillators and noise sources
        — no third-party samples (provenance: v2/tools/audio/gen_audio.sh)
      </p>
    </div>
  )
}

export function LandingSections(): JSX.Element {
  return (
    <>
      {/* a11y/SEO: the scene in words (SPEC §8) */}
      <p data-sr-scene style={srOnly}>
        A black motherboard floats in dark space above a granite plinth, fog
        pooled beneath it. Green signal pulses travel the board&apos;s copper
        traces between component districts. The camera dives through the lifted
        CPU heatspreader into the exposed silicon die, whose logic blocks light
        up green in sequence.
      </p>

      <main>
        {/* §1 HERO — canvas act 0 */}
        <section id="hero" style={section}>
          <p style={{ ...mono, color: 'var(--bone-1)' }}>
            SHAIK NOORULLAH — PLATFORM ENGINEER · HYDERABAD, IN → REMOTE
          </p>
          <h1
            data-reveal="words"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 'var(--t-3xl)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: 'var(--bone-0)',
              maxWidth: '18ch',
              margin: 'var(--s-5) 0',
            }}
          >
            I build the substrate everyone else rents.
          </h1>
          <p style={{ ...mono, color: 'var(--bone-1)' }}>
            OPEN TO PRODUCT-BASED REMOTE TEAMS · SCROLL · EST. 28 MONTHS IN THE
            TRADE
          </p>
          <p style={srOnly}>{BIO_30W}</p>
        </section>

        {/* §2 STATEMENT — canvas act 1 (pinned, SDF text in-canvas) */}
        <section id="statement" style={section}>
          {/* visually-hidden source; the in-canvas SDF text renders the pin */}
          <p data-sr-statement style={srOnly}>
            Twenty-eight months ago I joined as a backend engineer. The team
            contracted from eleven to five. I absorbed the platform — and
            shipped a 99.999%-target multi-cloud Kubernetes PaaS, a 16-RFC
            platform specification, and a multi-agent engineering platform that
            lets one engineer run ten tickets in parallel.
          </p>
        </section>

        {/* §3 WORK — canvas act 2 */}
        <section id="work" style={section}>
          <SecHead idx="02" label="SELECTED WORK" text="THE DISTRICTS" />
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              maxWidth: '72ch',
            }}
          >
            {PROJECTS.map((p) => (
              <li
                key={p.name}
                data-reveal
                style={{
                  borderTop: '1px solid var(--line)',
                  padding: 'var(--s-5) 0',
                }}
              >
                <span style={{ ...mono, color: 'var(--bone-0)' }}>
                  {p.name}
                </span>
                <p style={{ color: 'var(--bone-1)', margin: 'var(--s-2) 0 0' }}>
                  {p.desc}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* §4 EVIDENCE — canvas act 3 */}
        <section id="evidence" style={section}>
          <SecHead idx="03" label="EVIDENCE" text="THE LEDGER" />
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--s-6)',
            }}
          >
            {COUNTERS.map((c) => (
              <li key={c.label}>
                <span
                  data-count={c.count}
                  data-suffix={c.suffix}
                  data-decimals={c.decimals ?? 0}
                  data-format={c.comma ? 'comma' : undefined}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 'var(--t-2xl)',
                    color: 'var(--bone-0)',
                  }}
                >
                  0
                </span>
                <p
                  style={{
                    ...mono,
                    color: 'var(--bone-1)',
                    marginTop: 'var(--s-2)',
                  }}
                >
                  {c.label}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* §5 ABOUT — canvas act 4 (the dive) */}
        <section id="about" style={section}>
          <SecHead
            idx="04"
            label="ABOUT"
            text="THE PERSON UNDER THE PLATFORM"
          />
          <div
            style={{
              maxWidth: '62ch',
              color: 'var(--bone-1)',
              lineHeight: 1.6,
            }}
          >
            <p data-reveal>
              Self-taught. Dropped out, shipped anyway. When the team contracted
              from eleven to five, I absorbed the platform — the spec, the
              clusters, the on-call, the deploys. The evidence is the
              credential.
            </p>
          </div>
        </section>

        {/* §6 PRINCIPLES — horizontal accent (pinned track) */}
        <section id="principles" style={{ ...section, overflow: 'hidden' }}>
          <SecHead idx="05" label="PRINCIPLES" text="THE OPERATING RULES" />
          <div
            data-track
            style={{ display: 'flex', gap: 'var(--s-7)', width: 'max-content' }}
          >
            {PILLARS.map((p) => (
              <article key={p.title} style={{ width: 'min(70vw, 420px)' }}>
                <h3
                  style={{
                    ...mono,
                    color: 'var(--cursor)',
                    fontSize: 'var(--t-sm)',
                  }}
                >
                  {p.title}
                </h3>
                <p style={{ color: 'var(--bone-1)', lineHeight: 1.6 }}>
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* §7 WRITING — canvas act 5 */}
        <section id="writing" style={section}>
          <SecHead idx="06" label="WRITING" text="FIELD NOTES" />
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              maxWidth: '72ch',
            }}
          >
            {[
              'How the platform outlived its team',
              'Running 35 agents on $70 a month',
              'The substrate everyone else rents',
            ].map((t) => (
              <li
                key={t}
                data-reveal
                style={{
                  borderTop: '1px solid var(--line)',
                  padding: 'var(--s-5) 0',
                }}
              >
                <span style={{ ...mono, color: 'var(--bone-0)' }}>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* §8 CONTACT — canvas act 6 */}
        <section id="contact" style={section}>
          <SecHead
            idx="07"
            label="CONTACT"
            text="BUILD THE SUBSTRATE WITH ME"
          />
          <p>
            <a
              href="mailto:hello@shaiknoorullah.email"
              data-magnetic
              style={{
                ...mono,
                display: 'inline-block',
                color: 'var(--bone-0)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--cursor)',
                paddingBottom: 'var(--s-1)',
              }}
            >
              HELLO@SHAIKNOORULLAH.EMAIL
            </a>
          </p>
          <p style={{ ...mono, color: 'var(--bone-1)' }}>GITHUB · LINKEDIN</p>
        </section>
      </main>

      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          padding: 'var(--s-7) var(--s-6)',
          borderTop: '1px solid var(--line)',
        }}
      >
        <Credits />
        <p style={{ ...mono, color: 'var(--bone-1)', marginTop: 'var(--s-5)' }}>
          © 2026 SHAIK NOORULLAH · HYDERABAD, IN · SUBSTRATE OVER RENT
        </p>
      </footer>
    </>
  )
}
