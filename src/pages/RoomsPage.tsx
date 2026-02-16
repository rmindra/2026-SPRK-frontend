import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getRooms, deleteRoom } from '@/api/rooms'
import type { Room } from '@/types'
import { ApiError } from '@/api/client'
import { formatDateTime } from '@/utils/datetime'
import '@/pages/RoomsPage.css'

const DESCRIPTION_MAX_LENGTH = 80

function truncateDescription(text: string | undefined): string {
  if (!text) return '—'
  if (text.length <= DESCRIPTION_MAX_LENGTH) return text
  return `${text.slice(0, DESCRIPTION_MAX_LENGTH)}…`
}

export function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRooms()
      setRooms(data)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : 'Gagal memuat daftar ruangan.'
      setError(message)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  async function handleDelete(room: Room) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus ruangan "${room.name}"?`
    )
    if (!confirmed) return
    try {
      await deleteRoom(room.id)
      setRooms((prev) => prev.filter((r) => r.id !== room.id))
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : 'Gagal menghapus ruangan.'
      setError(message)
    }
  }

  if (loading) {
    return (
      <div className="rooms-page">
        <h1 className="rooms-page__title">Ruangan</h1>
        <div className="rooms-page__loading" aria-busy="true">
          <div className="rooms-page__spinner" />
          <p>Memuat daftar ruangan…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rooms-page">
        <h1 className="rooms-page__title">Ruangan</h1>
        <div className="rooms-page__error">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchRooms}
            className="rooms-page__retry"
          >
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="rooms-page">
        <h1 className="rooms-page__title">Ruangan</h1>
        <div className="rooms-page__empty">
          <p>Belum ada ruangan.</p>
          <Link to="/rooms/new" className="rooms-page__empty-cta">
            Tambah ruangan
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rooms-page">
      <div className="rooms-page__header">
        <h1 className="rooms-page__title">Ruangan</h1>
        <Link to="/rooms/new" className="rooms-page__add">
          Tambah ruangan
        </Link>
      </div>
      <div className="rooms-page__grid">
        {rooms.map((room) => (
          <article key={room.id} className="room-card">
            <div className="room-card__header">
              <h2 className="room-card__name">{room.name}</h2>
              <span
                className={`room-card__badge ${room.isAvailable ? 'room-card__badge--available' : 'room-card__badge--unavailable'}`}
              >
                {room.isAvailable ? 'Tersedia' : 'Tidak tersedia'}
              </span>
            </div>
            <dl className="room-card__meta">
              <div>
                <dt>Kapasitas</dt>
                <dd>{room.capacity} orang</dd>
              </div>
              <div>
                <dt>Lokasi</dt>
                <dd>{room.location}</dd>
              </div>
              <div>
                <dt>Deskripsi</dt>
                <dd>{truncateDescription(room.description)}</dd>
              </div>
              <div>
                <dt>Ditambah</dt>
                <dd>{formatDateTime(room.createdAt)}</dd>
              </div>
            </dl>
            <div className="room-card__actions">
              <Link
                to={`/rooms/${room.id}`}
                className="room-card__btn room-card__btn--primary"
              >
                Lihat
              </Link>
              <Link
                to={`/rooms/${room.id}/edit`}
                className="room-card__btn room-card__btn--secondary"
              >
                Edit
              </Link>
              <button
                type="button"
                className="room-card__btn room-card__btn--danger"
                onClick={() => handleDelete(room)}
              >
                Hapus
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
