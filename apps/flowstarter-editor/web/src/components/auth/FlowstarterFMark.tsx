/**
 * The gradient "F" brand mark used across every editor auth surface
 * (sign-in card, bootstrap loader, terminal auth screens). Kept in one
 * file so the loading screen, the login form card, and the index.html
 * boot shell stay pixel-identical — the HTML→React handoff must not
 * visibly shift.
 */

export function FlowstarterFMark({ size = 56 }: { readonly size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        background:
          "linear-gradient(135deg, hsl(233, 65%, 50%) 0%, hsl(233, 75%, 60%) 50%, hsl(180, 65%, 55%) 100%)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.32) inset, 0 8px 22px rgba(78,94,218,0.32)",
      }}
    >
      <svg
        viewBox="0 0 40 40"
        width={size * 0.62}
        height={size * 0.62}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13 10 L13 30"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M13 11 C17 10, 22 10, 27 11"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M13 20 C16 19, 20 19, 24 20"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M13 30 C16 30, 20 29, 25 28"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}
