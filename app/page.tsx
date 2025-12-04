export default function Home() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '600' }}>
          One01 v0.1
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666' }}>
          Infra is ready.
        </p>
      </div>
    </div>
  );
}
