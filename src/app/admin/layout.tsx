export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", background: '#f5f6f8', color: '#111', minHeight: '100vh', fontSize: '14px', lineHeight: '1.5' }}>
      {children}
    </div>
  )
}
