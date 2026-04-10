export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-accent-amber)" }}
        >
          CBSH Digital Library
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Phase 1 Foundation Complete — Phase 2 coming soon.
        </p>
      </div>
    </main>
  );
}
