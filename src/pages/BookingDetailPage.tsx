import { useParams } from 'react-router-dom'

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <h1>Detail Peminjaman</h1>
      <p>Peminjaman ID: {id}</p>
    </div>
  )
}
