// Each auth route defines its own metadata for accurate page titles in search results.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--color-bg-app)" }}
    >
      {children}
    </div>
  );
}
