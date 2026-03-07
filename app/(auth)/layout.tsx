/**
 * Auth layout — centered, no sidebar.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      {/* Background decorations */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-glow auth-glow-1"></div>
        <div className="auth-glow auth-glow-2"></div>
        <div className="auth-glow auth-glow-3"></div>
        <div className="auth-grid"></div>
      </div>

      <div className="relative z-10 w-full max-w-[460px]">{children}</div>
    </div>
  )
}
