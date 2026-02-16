import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRoom, deleteRoom } from '@/api/rooms'
import type { Room } from '@/types'
import { ApiError } from '@/api/client'
import '@/pages/RoomDetailPage.css'

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatCreatedAt(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso))
  } catch {
    return iso
  }
}

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const roomId = id != null ? parseInt(id, 10) : NaN
  const isValidId = Number.isFinite(roomId) && roomId > 0

  useEffect(() => {
    if (!isValidId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)

    getRoom(roomId)
      .then((data) => {
        if (!cancelled) {
          setRoom(data)
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
          setRoom(null)
        } else {
          const message =
            err instanceof ApiError
              ? err.body?.message ?? err.message
              : err instanceof Error
                ? err.message
                : 'Gagal memuat detail ruangan.'
          setError(message)
          setRoom(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [roomId, isValidId])

  async function handleDelete() {
    if (!room) return
    const confirmed = window.confirm(
      `Yakin ingin menghapus ruangan "${room.name}"?`
    )
    if (!confirmed) return
    try {
      await deleteRoom(room.id)
      navigate('/rooms', { replace: true })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.body?.message ?? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal menghapus ruangan.'
      setError(message)
    }
  }

  if (!isValidId || notFound) {
    return (
      <div className="room-detail">
        <div className="room-detail__not-found">
          <h1>Ruangan tidak ditemukan</h1>
          <p>Ruangan yang Anda cari tidak ada atau telah dihapus.</p>
          <Link to="/rooms" className="room-detail__link">
            Kembali ke daftar ruangan
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="room-detail">
        <div className="room-detail__loading" aria-busy="true">
          <div className="room-detail__spinner" />
          <p>Memuat detail ruangan…</p>
        </div>
      </div>
    )
  }

  if (error && !room) {
    return (
      <div className="room-detail">
        <div className="room-detail__error">
          <p>{error}</p>
          <Link to="/rooms" className="room-detail__link">
            Kembali ke daftar ruangan
          </Link>
        </div>
      </div>
    )
  }

  if (!room) {
    return null
  }

  return (
    <div className="room-detail">
      <div className="room-detail__header">
        <Link to="/rooms" className="room-detail__back">
          ← Kembali
        </Link>
      </div>
      <article className="room-detail__card">
        <div className="room-detail__title-row">
          <h1 className="room-detail__name">{room.name}</h1>
          <span
            className={`room-detail__badge ${room.isAvailable ? 'room-detail__badge--available' : 'room-detail__badge--unavailable'}`}
          >
            {room.isAvailable ? 'Tersedia' : 'Tidak tersedia'}
          </span>
        </div>

        <dl className="room-detail__meta">
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
            <dd>{room.description ?? '—'}</dd>
          </div>
          <div>
            <dt>Ditambah</dt>
            <dd>{formatCreatedAt(room.createdAt)}</dd>
          </div>
        </dl>

        {error && (
          <div className="room-detail__inline-error" role="alert">
            {error}
          </div>
        )}

        <div className="room-detail__actions">
          <Link
            to={`/rooms/${room.id}/edit`}
            className="room-detail__btn room-detail__btn--secondary"
          >
            Edit
          </Link>
          <button
            type="button"
            className="room-detail__btn room-detail__btn--danger"
            onClick={handleDelete}
          >
            Hapus
          </button>
          <Link
            to={`/bookings/new?roomId=${room.id}`}
            className="room-detail__btn room-detail__btn--primary"
          >
            Buat peminjaman
          </Link>
        </div>
      </article>
    </div>
  )
}
