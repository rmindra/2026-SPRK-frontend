import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getBookings, updateBookingStatus, deleteBooking } from '@/api/bookings'
import { getRooms } from '@/api/rooms'
import type { Booking, Room, BookingStatusType, BookingSortByType } from '@/types'
import { BookingStatus, BookingSortBy } from '@/types'
import { ApiError } from '@/api/client'
import '@/pages/BookingsPage.css'

const PURPOSE_MAX_LENGTH = 50
const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const STATUS_LABELS: Record<BookingStatusType, string> = {
  Pending: 'Menunggu',
  Approved: 'Disetujui',
  Rejected: 'Ditolak',
  Cancelled: 'Dibatalkan',
}

const SORT_OPTIONS: { value: BookingSortByType; label: string }[] = [
  { value: BookingSortBy.DateDesc, label: 'Tanggal (terbaru)' },
  { value: BookingSortBy.DateAsc, label: 'Tanggal (terlama)' },
  { value: BookingSortBy.NameAsc, label: 'Nama A–Z' },
  { value: BookingSortBy.NameDesc, label: 'Nama Z–A' },
]

function formatDateTime(iso: string): string {
  try {
    return dateTimeFormatter.format(new Date(iso))
  } catch {
    return iso
  }
}

function statusChangeLabel(status: BookingStatusType): string {
  return STATUS_LABELS[status]
}

function canEditBooking(booking: Booking): boolean {
  return booking.status !== BookingStatus.Cancelled && booking.status !== BookingStatus.Rejected
}

function canChangeStatus(booking: Booking): boolean {
  // Sesuai kebutuhan: status final (Cancelled/Rejected) tidak bisa diubah.
  // Approved masih bisa diubah ke Rejected atau Cancelled.
  return booking.status === BookingStatus.Pending || booking.status === BookingStatus.Approved
}

function getAllowedNextStatuses(current: BookingStatusType): BookingStatusType[] {
  if (current === BookingStatus.Pending) {
    return [BookingStatus.Approved, BookingStatus.Rejected, BookingStatus.Cancelled]
  }
  if (current === BookingStatus.Approved) {
    return [BookingStatus.Rejected, BookingStatus.Cancelled]
  }
  return []
}

function truncatePurpose(text: string): string {
  if (!text) return '—'
  if (text.length <= PURPOSE_MAX_LENGTH) return text
  return `${text.slice(0, PURPOSE_MAX_LENGTH)}…`
}

function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debouncedValue
}

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<number>>(
    () => new Set()
  )
  const [rowStatusErrors, setRowStatusErrors] = useState<
    Record<number, string | undefined>
  >({})

  const [borrowerName, setBorrowerName] = useState('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [status, setStatus] = useState<BookingStatusType | ''>('')
  const [date, setDate] = useState('')
  const [sortBy, setSortBy] = useState<BookingSortByType>(BookingSortBy.DateDesc)

  const debouncedBorrowerName = useDebounce(borrowerName, 350)

  const filter = useMemo(
    () => ({
      borrowerName: debouncedBorrowerName.trim() || undefined,
      roomId: roomId === '' ? undefined : (roomId as number),
      status: status === '' ? undefined : (status as BookingStatusType),
      date: date || undefined,
      sortBy,
    }),
    [debouncedBorrowerName, roomId, status, date, sortBy]
  )

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBookings(filter)
      setBookings(data)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : 'Gagal memuat daftar peminjaman.'
      setError(message)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  const fetchRooms = useCallback(async () => {
    try {
      const data = await getRooms()
      setRooms(data)
    } catch {
      setRooms([])
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  async function handleStatusChange(booking: Booking, newStatus: BookingStatusType) {
    if (!canChangeStatus(booking)) return
    const allowed = getAllowedNextStatuses(booking.status)
    if (!allowed.includes(newStatus)) return
    if (updatingStatusIds.has(booking.id)) return

    const confirmed = window.confirm(
      `Ubah status peminjaman oleh ${booking.borrowerName} dari "${statusChangeLabel(
        booking.status
      )}" menjadi "${statusChangeLabel(newStatus)}"?`
    )
    if (!confirmed) return

    setRowStatusErrors((prev) => ({ ...prev, [booking.id]: undefined }))

    setUpdatingStatusIds((prev) => {
      const next = new Set(prev)
      next.add(booking.id)
      return next
    })

    // Optimistic update: langsung update UI sebelum API call selesai
    const previousBooking = booking
    const optimisticBooking: Booking = {
      ...booking,
      status: newStatus,
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === booking.id ? optimisticBooking : b))
    )
    setError(null) // Clear error sebelum update (untuk error fetch/mutasi lain)

    try {
      const updated = await updateBookingStatus(booking.id, newStatus)
      // Update dengan data dari server untuk memastikan sync
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      )
    } catch (err) {
      // Rollback jika gagal
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? previousBooking : b))
      )
      const message =
        err instanceof ApiError
          ? (err.body?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : 'Gagal mengubah status.'
      setRowStatusErrors((prev) => ({ ...prev, [booking.id]: message }))
    } finally {
      setUpdatingStatusIds((prev) => {
        const next = new Set(prev)
        next.delete(booking.id)
        return next
      })
    }
  }

  async function handleDelete(booking: Booking) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus peminjaman "${booking.purpose}" oleh ${booking.borrowerName}?`
    )
    if (!confirmed) return
    try {
      await deleteBooking(booking.id)
      setBookings((prev) => prev.filter((b) => b.id !== booking.id))
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : 'Gagal menghapus peminjaman.'
      setError(message)
    }
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="bookings-page">
        <h1 className="bookings-page__title">Peminjaman</h1>
        <div className="bookings-page__loading" aria-busy="true">
          <div className="bookings-page__spinner" />
          <p>Memuat daftar peminjaman…</p>
        </div>
      </div>
    )
  }

  if (error && bookings.length === 0) {
    return (
      <div className="bookings-page">
        <h1 className="bookings-page__title">Peminjaman</h1>
        <div className="bookings-page__error">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchBookings}
            className="bookings-page__retry"
          >
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bookings-page">
      <div className="bookings-page__header">
        <h1 className="bookings-page__title">Peminjaman</h1>
        <Link to="/bookings/new" className="bookings-page__add">
          Buat peminjaman
        </Link>
      </div>

      <div className="bookings-page__filters">
        <label className="bookings-page__filter-label">
          <span>Peminjam</span>
          <input
            type="search"
            className="bookings-page__input"
            placeholder="Cari nama peminjam…"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
          />
        </label>
        <label className="bookings-page__filter-label">
          <span>Ruangan</span>
          <select
            className="bookings-page__select"
            value={roomId === '' ? '' : String(roomId)}
            onChange={(e) =>
              setRoomId(e.target.value === '' ? '' : Number(e.target.value))
            }
          >
            <option value="">Semua ruangan</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>
        <label className="bookings-page__filter-label">
          <span>Status</span>
          <select
            className="bookings-page__select"
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value === '' ? '' : (e.target.value as BookingStatusType)
              )
            }
          >
            <option value="">Semua status</option>
            <option value={BookingStatus.Pending}>{STATUS_LABELS.Pending}</option>
            <option value={BookingStatus.Approved}>{STATUS_LABELS.Approved}</option>
            <option value={BookingStatus.Rejected}>{STATUS_LABELS.Rejected}</option>
            <option value={BookingStatus.Cancelled}>{STATUS_LABELS.Cancelled}</option>
          </select>
        </label>
        <label className="bookings-page__filter-label">
          <span>Tanggal</span>
          <input
            type="date"
            className="bookings-page__input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="bookings-page__filter-label">
          <span>Urutkan</span>
          <select
            className="bookings-page__select"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as BookingSortByType)
            }
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="bookings-page__error-inline">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="bookings-page__loading-inline" aria-busy="true">
          <div className="bookings-page__spinner" />
          <span>Memuat…</span>
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <div className="bookings-page__empty">
          <p>Tidak ada peminjaman yang sesuai filter.</p>
          <Link to="/bookings/new" className="bookings-page__empty-cta">
            Buat peminjaman
          </Link>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="bookings-page__table-wrap">
          <table className="bookings-page__table">
            <thead>
              <tr>
                <th>Ruangan</th>
                <th>Peminjam</th>
                <th>Keperluan</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Ditambah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  {/*
                    Note: status update:
                    - Pending -> Approved/Rejected/Cancelled
                    - Approved -> Rejected/Cancelled
                    - Cancelled/Rejected -> final (tidak bisa diubah)
                    Backend bisa mengembalikan 409 Conflict (jadwal bentrok) saat approve.
                  */}
                  <td>{booking.roomName}</td>
                  <td>{booking.borrowerName}</td>
                  <td>{truncatePurpose(booking.purpose)}</td>
                  <td>
                    {formatDateTime(booking.startTime)} – {formatDateTime(booking.endTime)}
                  </td>
                  <td>
                    <span
                      className={`bookings-page__badge bookings-page__badge--${booking.status.toLowerCase()}`}
                    >
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </td>
                  <td>{formatDateTime(booking.createdAt)}</td>
                  <td>
                    <div className="bookings-page__actions-cell">
                      <div className="bookings-page__actions">
                        <Link
                          to={`/bookings/${booking.id}`}
                          className="bookings-page__btn bookings-page__btn--primary"
                        >
                          Lihat
                        </Link>
                        {canEditBooking(booking) && (
                          <Link
                            to={`/bookings/${booking.id}/edit`}
                            className="bookings-page__btn bookings-page__btn--secondary"
                          >
                            Edit
                          </Link>
                        )}

                        {canChangeStatus(booking) ? (
                          <select
                            className="bookings-page__select-inline"
                            value=""
                            disabled={updatingStatusIds.has(booking.id)}
                            onChange={(e) => {
                              const v = e.target.value
                              if (v) {
                                handleStatusChange(
                                  booking,
                                  v as BookingStatusType
                                )
                                e.target.value = ''
                              }
                            }}
                          >
                            <option value="">Ubah status</option>
                            {getAllowedNextStatuses(booking.status).map((s) => (
                              <option key={s} value={s}>
                                {statusChangeLabel(s)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="bookings-page__muted">
                            {STATUS_LABELS[booking.status]}
                          </span>
                        )}
                        <button
                          type="button"
                          className="bookings-page__btn bookings-page__btn--danger"
                          onClick={() => handleDelete(booking)}
                        >
                          Hapus
                        </button>
                      </div>

                      {(updatingStatusIds.has(booking.id) ||
                        rowStatusErrors[booking.id]) && (
                        <div className="bookings-page__actions-meta">
                          {updatingStatusIds.has(booking.id) && (
                            <span className="bookings-page__muted">
                              Mengubah status…
                            </span>
                          )}
                          {rowStatusErrors[booking.id] && (
                            <div className="bookings-page__row-error" role="alert">
                              {rowStatusErrors[booking.id]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
