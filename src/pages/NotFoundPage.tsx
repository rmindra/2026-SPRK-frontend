import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>404</h1>
      <p>Halaman tidak ditemukan.</p>
      <Link to="/">Kembali ke beranda</Link>
    </div>
  )
}
