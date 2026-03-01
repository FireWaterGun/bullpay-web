/**
 * Auth layout — centered, no sidebar.
 * Used for: /login, /register, /forgot, /verify
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">{children}</div>
      </div>
    </div>
  )
}
