"use client";

// Inline SVG logo that uses CSS variables (var(--text), var(--accent))
// so the colors change automatically with the current theme.
// If we used <img src="logo.svg">, the SVG would be isolated in its own
// document context and couldn't inherit CSS vars from the page.

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <svg
      viewBox="0 0 280 100"
      className={className}
      style={{ width: "auto", height: "1em", display: "inline-block" }}
    >
      <defs>
        <linearGradient id="redux-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--text)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      {/* Roman numeral X (10) — gradient using theme colors */}
      <text
        x="55"
        y="76"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontSize="82"
        fontWeight="400"
        fill="url(#redux-logo-grad)"
        textAnchor="middle"
        letterSpacing="-2"
      >
        X
      </text>
      {showWordmark && (
        <>
          {/* 'redux' wordmark — uses --text color directly */}
          <text
            x="115"
            y="68"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
            fontSize="42"
            fontWeight="400"
            fill="var(--text)"
            letterSpacing="-0.5"
          >
            redux
          </text>
          {/* Small accent dot — uses --accent color */}
          <circle cx="262" cy="60" r="4" fill="var(--accent)" />
        </>
      )}
    </svg>
  );
}
