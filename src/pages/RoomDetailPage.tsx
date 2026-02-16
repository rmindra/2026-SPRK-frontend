import { useParams } from 'react-router-dom'

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <h1>Detail Ruangan</h1>
      <p>Ruangan ID: {id}</p>
    </div>
  )
}
