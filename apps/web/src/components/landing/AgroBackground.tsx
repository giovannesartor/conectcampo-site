'use client';

/**
 * Pure-SVG animated agro background.
 * Renders wheat stalks, drifting seeds, terrain lines and a sun arc.
 * Zero external dependencies — only framer-motion which is already installed.
 */

import { motion } from 'framer-motion';

// ─── Wheat stalk ──────────────────────────────────────────────────────────────

function WheatStalk({
  x,
  delay,
  scale = 1,
  opacity = 0.25,
}: {
  x: number;
  delay: number;
  scale?: number;
  opacity?: number;
}) {
  return (
    <motion.g
      transform={`translate(${x}, 0) scale(${scale})`}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 1.5, delay }}
    >
      {/* Stem */}
      <motion.path
        d="M0,120 Q2,80 0,40"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        animate={{ d: ['M0,120 Q2,80 0,40', 'M0,120 Q-2,80 0,40', 'M0,120 Q2,80 0,40'] }}
        transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Grains */}
      {[-12, -8, -4, 0, 4, 8, 12].map((offset, i) => (
        <motion.ellipse
          key={i}
          cx={offset * 0.4}
          cy={40 - i * 6}
          rx="2.5"
          ry="4"
          fill="currentColor"
          transform={`rotate(${offset * 3}, ${offset * 0.4}, ${40 - i * 6})`}
          animate={{
            cx: [offset * 0.4, offset * 0.4 + (offset > 0 ? 1 : -1), offset * 0.4],
          }}
          transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Leaf left */}
      <motion.path
        d="M0,90 Q-12,82 -10,74"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        animate={{ d: ['M0,90 Q-12,82 -10,74', 'M0,90 Q-10,82 -8,74', 'M0,90 Q-12,82 -10,74'] }}
        transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Leaf right */}
      <motion.path
        d="M0,70 Q10,62 8,54"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        animate={{ d: ['M0,70 Q10,62 8,54', 'M0,70 Q8,62 6,54', 'M0,70 Q10,62 8,54'] }}
        transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.g>
  );
}

// ─── Floating seed ────────────────────────────────────────────────────────────

function FloatingSeed({
  x,
  y,
  delay,
  size = 3,
}: {
  x: number;
  y: number;
  delay: number;
  size?: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, x, y }}
      animate={{
        opacity: [0, 0.4, 0.4, 0],
        x: [x, x + 30, x + 60],
        y: [y, y - 40, y - 80],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {/* seed body */}
      <ellipse cx="0" cy="0" rx={size} ry={size * 1.8} fill="currentColor" />
      {/* wisp tail */}
      <line x1="0" y1={size * 1.8} x2="0" y2={size * 4} stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </motion.g>
  );
}

// ─── Terrain arc ──────────────────────────────────────────────────────────────

function TerrainLines() {
  return (
    <g className="text-brand-500/10 dark:text-brand-400/10">
      {[0, 20, 40, 60].map((offset) => (
        <path
          key={offset}
          d={`M-50,${580 + offset} Q300,${560 + offset} 650,${575 + offset} T1450,${570 + offset}`}
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      ))}
    </g>
  );
}

// ─── Sun arc ─────────────────────────────────────────────────────────────────

function SunArc() {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, delay: 0.5 }}
    >
      {/* Core */}
      <circle cx="1100" cy="-30" r="90" fill="url(#sunGrad)" />
      {/* Rays */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 1100 + Math.cos(angle) * 105;
        const y1 = -30 + Math.sin(angle) * 105;
        const x2 = 1100 + Math.cos(angle) * 135;
        const y2 = -30 + Math.sin(angle) * 135;
        return (
          <motion.line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 3, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}
    </motion.g>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AgroBackground({ className = '' }: { className?: string }) {
  const stalks = [
    { x: 60,   delay: 0   },
    { x: 130,  delay: 0.3, scale: 0.85 },
    { x: 200,  delay: 0.6 },
    { x: 265,  delay: 0.2, scale: 0.9 },
    { x: 330,  delay: 0.8, scale: 0.75 },
    { x: 900,  delay: 0.4, scale: 0.8  },
    { x: 970,  delay: 0.1 },
    { x: 1040, delay: 0.7, scale: 0.9 },
    { x: 1110, delay: 0.3 },
    { x: 1180, delay: 0.5, scale: 0.85 },
    { x: 1250, delay: 0   },
    { x: 1320, delay: 0.6, scale: 0.78 },
    { x: 1390, delay: 0.2 },
  ];

  const seeds = [
    { x: 400, y: 500, delay: 0,   size: 2.5 },
    { x: 500, y: 450, delay: 2,   size: 2   },
    { x: 620, y: 520, delay: 4,   size: 3   },
    { x: 720, y: 480, delay: 1,   size: 2   },
    { x: 820, y: 510, delay: 3,   size: 2.5 },
    { x: 200, y: 300, delay: 1.5, size: 2   },
    { x: 1300, y: 350, delay: 2.5, size: 2  },
  ];

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      viewBox="0 0 1440 620"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sun */}
      <SunArc />

      {/* Terrain */}
      <TerrainLines />

      {/* Wheat stalks — bottom row */}
      <g
        transform="translate(0, 500)"
        className="text-brand-600/20 dark:text-brand-400/15 fill-current stroke-current"
      >
        {stalks.map((s, i) => (
          <WheatStalk key={i} x={s.x} delay={s.delay} scale={s.scale ?? 1} />
        ))}
      </g>

      {/* Floating seeds */}
      <g className="text-agro-gold/30 dark:text-agro-gold/20 fill-current stroke-current">
        {seeds.map((s, i) => (
          <FloatingSeed key={i} x={s.x} y={s.y} delay={s.delay} size={s.size} />
        ))}
      </g>
    </svg>
  );
}
