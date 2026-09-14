const BEAM_PATHS = [
  "M-120 620C180 460 260 260 520 210S860 260 1120 40",
  "M40 780C300 610 390 390 650 330S940 300 1240 120",
  "M360 760C510 560 590 420 820 390S1080 430 1320 250",
  "M740 820C800 620 850 520 1040 470S1240 470 1450 350",
  "M-80 360C180 300 350 160 560 150S900 210 1160-60",
];

export function BackgroundBeams() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full opacity-70 dark:opacity-80"
        viewBox="0 0 1280 820"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="beam-light" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.46" stopColor="currentColor" stopOpacity="0.08" />
            <stop offset="0.7" stopColor="currentColor" stopOpacity="0.72" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id="beam-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <g className="text-peach-500">
          {BEAM_PATHS.map((path) => (
            <path key={`glow-${path}`} d={path} stroke="currentColor" strokeWidth="18" strokeLinecap="round" opacity="0.13" filter="url(#beam-blur)" />
          ))}
          {BEAM_PATHS.map((path, index) => (
            <path
              key={path}
              d={path}
              stroke="url(#beam-light)"
              strokeWidth={index % 2 === 0 ? "1.5" : "1"}
              strokeLinecap="round"
              strokeDasharray="90 300"
              className="beam-dash"
              style={{ animationDelay: `${index * -2.2}s` }}
            />
          ))}
        </g>
      </svg>

      <div className="absolute inset-x-0 top-[36%] h-px bg-gradient-to-r from-transparent via-peach-500/15 to-transparent" />
    </div>
  );
}
