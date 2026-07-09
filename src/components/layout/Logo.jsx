// Brand mark: a rounded-square ("squircle") wordmark reading ".ia". Rendered
// inline (not <img>) so it stays crisp at any size. `theme` inverts the
// palette so contrast holds in dark mode — light: navy bg / white text, dark:
// white bg / navy text. The favicon (public/favicon.svg) is a separate static
// file and always uses the light variant, since a browser tab icon can't
// react to the app's in-page theme state.
export default function Logo({ size = 22, theme = 'light', className = '' }) {
  const bg = theme === 'dark' ? '#FFFFFF' : '#1E3A8A'
  const fg = theme === 'dark' ? '#1E3A8A' : '#FFFFFF'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill={bg} />
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="12.5"
        fill={fg}
      >
        .ia
      </text>
    </svg>
  )
}
