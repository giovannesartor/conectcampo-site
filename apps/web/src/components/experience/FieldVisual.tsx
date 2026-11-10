/** Decorative field contours: vector artwork shared by the web and app entrances. */
export function FieldVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`cc-field-visual ${compact ? "cc-field-compact" : ""}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 720 660"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <g className="cc-contours" stroke="currentColor" strokeWidth="1">
          {Array.from({ length: 17 }, (_, i) => (
            <path
              key={i}
              d={`M ${-180 + i * 23} 700 C ${440 + i * 14} ${500 - i * 14}, ${-150 + i * 29} ${190 - i * 13}, ${600 + i * 19} -70`}
            />
          ))}
        </g>
        <path
          className="cc-field-route"
          d="M155 469L299 387L387 229L552 166"
          stroke="#d4b06a"
          strokeWidth="2"
          strokeDasharray="6 7"
        />
        {[
          [155, 469],
          [299, 387],
          [387, 229],
          [552, 166],
        ].map(([x, y], i) => (
          <g key={x}>
            <circle
              cx={x}
              cy={y}
              r="14"
              fill="#003c28"
              stroke="#d4b06a"
              strokeOpacity=".5"
            />
            <circle cx={x} cy={y} r={i === 2 ? 5 : 3} fill="#e6cf93" />
          </g>
        ))}
      </svg>
    </div>
  );
}
