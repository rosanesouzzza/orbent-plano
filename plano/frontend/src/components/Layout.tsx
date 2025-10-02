import React from 'react'
import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header fixo */}
      <header
        style={{
          background: '#1e293b',
          color: '#fff',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18 }}>🌐 Orbent Action Plan</div>
        <nav style={{ display: 'flex', gap: 16 }}>
          <Link to="/" style={linkStyle}>Home</Link>
          <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
          <Link to="/reports" style={linkStyle}>Reports</Link>
        </nav>
      </header>

      {/* Conteúdo da página */}
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  )
}

const linkStyle: React.CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 500,
}
