export function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* Gradient orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
      <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-primary/8 blur-3xl animate-pulse-glow animation-delay-2000" />
      <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-airteltigo/8 blur-3xl animate-float-slow" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Doodle: WiFi signal */}
      <svg
        className="absolute top-[12%] left-[8%] w-16 h-16 text-primary/20 animate-float"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M8 44 Q32 20 56 44" />
        <path d="M16 44 Q32 28 48 44" />
        <path d="M24 44 Q32 36 40 44" />
        <circle cx="32" cy="48" r="3" fill="currentColor" />
      </svg>

      {/* Doodle: Phone */}
      <svg
        className="absolute top-[20%] right-[10%] w-14 h-20 text-primary/15 animate-float-slow animation-delay-1000"
        viewBox="0 0 56 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="12" y="4" width="32" height="72" rx="6" />
        <line x1="24" y1="64" x2="32" y2="64" />
        <circle cx="28" cy="14" r="2" fill="currentColor" />
        <rect x="18" y="24" width="20" height="32" rx="2" fill="currentColor" opacity="0.15" />
      </svg>

      {/* Doodle: Data packet */}
      <svg
        className="absolute bottom-[25%] left-[12%] w-20 h-16 text-airteltigo/20 animate-drift"
        viewBox="0 0 80 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="8" y="16" width="48" height="36" rx="4" />
        <path d="M56 28 L72 20 L72 48 L56 40 Z" />
        <line x1="20" y1="32" x2="44" y2="32" />
        <line x1="20" y1="40" x2="36" y2="40" />
      </svg>

      {/* Doodle: Star burst */}
      <svg
        className="absolute top-[55%] right-[6%] w-12 h-12 text-primary/25 animate-spin-slow"
        viewBox="0 0 48 48"
        fill="currentColor"
      >
        <path d="M24 4 L27 18 L42 18 L30 27 L34 42 L24 33 L14 42 L18 27 L6 18 L21 18 Z" />
      </svg>

      {/* Doodle: Zigzag */}
      <svg
        className="absolute bottom-[15%] right-[18%] w-24 h-8 text-primary/15 animate-float animation-delay-3000"
        viewBox="0 0 96 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 16 L20 4 L36 28 L52 8 L68 24 L84 12 L92 16" />
      </svg>

      {/* Doodle: Circles cluster */}
      <svg
        className="absolute top-[8%] right-[30%] w-20 h-20 text-primary/10 animate-float-slow animation-delay-2000"
        viewBox="0 0 80 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="24" cy="40" r="16" />
        <circle cx="48" cy="28" r="10" />
        <circle cx="56" cy="52" r="8" />
      </svg>

      {/* Doodle: Lightning bolt */}
      <svg
        className="absolute bottom-[35%] left-[5%] w-10 h-14 text-primary/20 animate-float animation-delay-1500"
        viewBox="0 0 40 56"
        fill="currentColor"
      >
        <path d="M22 0 L8 28 H18 L14 56 L32 22 H20 Z" />
      </svg>

      {/* Doodle: Plus signs */}
      <svg
        className="absolute top-[40%] left-[4%] w-8 h-8 text-primary/12 animate-pulse-glow"
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <line x1="16" y1="6" x2="16" y2="26" />
        <line x1="6" y1="16" x2="26" y2="16" />
      </svg>

      <svg
        className="absolute bottom-[10%] left-[35%] w-6 h-6 text-primary/10 animate-float animation-delay-2500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>

      {/* Doodle: Wavy line */}
      <svg
        className="absolute bottom-[45%] right-[5%] w-32 h-12 text-telecel/15 animate-drift-reverse"
        viewBox="0 0 128 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M0 24 Q16 8 32 24 T64 24 T96 24 T128 24" />
      </svg>

      {/* Doodle: Coin / wallet */}
      <svg
        className="absolute top-[65%] left-[20%] w-14 h-14 text-primary/18 animate-float-slow animation-delay-500"
        viewBox="0 0 56 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="28" cy="28" r="22" />
        <text x="28" y="34" textAnchor="middle" fill="currentColor" stroke="none" fontSize="18" fontWeight="bold">₵</text>
      </svg>
    </div>
  );
}
