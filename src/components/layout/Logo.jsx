// Brand mark: a small calendar glyph, matching public/favicon.svg. Rendered
// inline (not <img>) so it stays crisp at any size and can be reused wherever
// the app needs the icon (topbar, future onboarding, etc).
export default function Logo({ size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#1E3A8A" />
      <path
        d="M9 8.5C9 7.67157 9.67157 7 10.5 7C11.3284 7 12 7.67157 12 8.5V10H20V8.5C20 7.67157 20.6716 7 21.5 7C22.3284 7 23 7.67157 23 8.5V10H24.5C25.3284 10 26 10.6716 26 11.5V23.5C26 24.3284 25.3284 25 24.5 25H7.5C6.67157 25 6 24.3284 6 23.5V11.5C6 10.6716 6.67157 10 7.5 10H9V8.5Z"
        fill="white"
        fillOpacity="0.92"
      />
      <rect x="8" y="13" width="16" height="9.5" rx="1.5" fill="#1E3A8A" />
      <circle cx="12.5" cy="17.25" r="1.35" fill="white" />
      <circle cx="16" cy="17.25" r="1.35" fill="white" />
      <circle cx="19.5" cy="17.25" r="1.35" fill="white" />
      <circle cx="12.5" cy="20.5" r="1.35" fill="white" />
      <circle cx="16" cy="20.5" r="1.35" fill="white" />
    </svg>
  )
}
