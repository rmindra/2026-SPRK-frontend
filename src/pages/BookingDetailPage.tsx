import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getBooking, updateBookingStatus, deleteBooking } from '@/api/bookings'
import type { Booking, BookingStatusType } from '@/types'
import { BookingStatus } from '@/types'
import { ApiError } from '@/api/client'
import '@/pages/BookingDetailPage.css'

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

function formatDateTime(iso: string): string {
  try {
    return dateTimeFormatter.format(new Date(iso))
  } catch {
    return iso
  }
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingTo, setUpdatingTo] = useState<BookingStatusType | null>(null)

  const bookingId = id != null ? parseInt(id, 10) : NaN
  const isValidId = Number.isFinite(bookingId) && bookingId > 0

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

    getBooking(bookingId)
      .then((data) => {
        if (!cancelled) {
          setBooking(data)
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
          setBooking(null)
        } else {
          const message =
            err instanceof ApiError
              ? err.body?.message ?? err.message
              : err instanceof Error
                ? err.message
                : 'Gagal memuat detail peminjaman.'
          setError(message)
          setBooking(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bookingId, isValidId])

  function canEditCurrent(): boolean {
    if (!booking) return false
    return booking.status !== BookingStatus.Cancelled && booking.status !== BookingStatus.Rejected
  }

  function canChangeCurrentStatus(): boolean {
    if (!booking) return false
    return booking.status === BookingStatus.Pending || booking.status === BookingStatus.Approved
  }

  function allowedNextStatuses(current: BookingStatusType): BookingStatusType[] {
    if (current === BookingStatus.Pending) {
      return [BookingStatus.Approved, BookingStatus.Rejected, BookingStatus.Cancelled]
    }
    if (current === BookingStatus.Approved) {
      return [BookingStatus.Rejected, BookingStatus.Cancelled]
    }
    return []
  }

  async function handleStatusChange(newStatus: BookingStatusType) {
    if (!booking) return
    if (!canChangeCurrentStatus()) return
    if (!allowedNextStatuses(booking.status).includes(newStatus)) return
    if (updatingStatus) return

    const confirmed = window.confirm(
      `Ubah status peminjaman ini dari "${STATUS_LABELS[booking.status]}" menjadi "${STATUS_LABELS[newStatus]}"?`
    )
    if (!confirmed) return

    // Optimistic update
    const previousBooking = booking
    const optimisticBooking: Booking = {
      ...booking,
      status: newStatus,
    }
    setBooking(optimisticBooking)
    setError(null)
    setUpdatingStatus(true)
    setUpdatingTo(newStatus)

    try {
      const updated = await updateBookingStatus(booking.id, newStatus)
      setBooking(updated)
    } catch (err) {
      // Rollback jika gagal
      setBooking(previousBooking)
      const message =
        err instanceof ApiError
          ? err.body?.message ?? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal mengubah status.'
      setError(message)
    } finally {
      setUpdatingStatus(false)
      setUpdatingTo(null)
    }
  }

  async function handleDelete() {
    if (!booking) return
    const confirmed = window.confirm(
      `Yakin ingin menghapus peminjaman "${booking.purpose}" oleh ${booking.borrowerName}?`
    )
    if (!confirmed) return
    try {
      await deleteBooking(booking.id)
      navigate('/bookings', { replace: true })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.body?.message ?? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal menghapus peminjaman.'
      setError(message)
    }
  }

  if (!isValidId || notFound) {
    return (
      <div className="booking-detail">
        <div className="booking-detail__not-found">
          <h1>Peminjaman tidak ditemukan</h1>
          <p>Peminjaman yang Anda cari tidak ada atau telah dihapus.</p>
          <Link to="/bookings" className="booking-detail__link">
            Kembali ke daftar peminjaman
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="booking-detail">
        <div className="booking-detail__loading" aria-busy="true">
          <div className="booking-detail__spinner" />
          <p>Memuat detail peminjaman…</p>
        </div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="booking-detail">
        <div className="booking-detail__error">
          <p>{error}</p>
          <Link to="/bookings" className="booking-detail__link">
            Kembali ke daftar peminjaman
          </Link>
        </div>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const showStatusActions = canChangeCurrentStatus()
  const canEdit = canEditCurrent()
  const allowedStatuses = allowedNextStatuses(booking.status)

  return (
    <div className="booking-detail">
      <div className="booking-detail__header">
        <Link to="/bookings" className="booking-detail__back">
          ← Kembali
        </Link>
      </div>
      <article className="booking-detail__card">
        <div className="booking-detail__title-row">
          <h1 className="booking-detail__title">Detail Peminjaman</h1>
          <span
            className={`booking-detail__badge booking-detail__badge--${booking.status.toLowerCase()}`}
          >
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        <dl className="booking-detail__meta">
          <div>
            <dt>Ruangan</dt>
            <dd>
              <Link
                to={`/rooms/${booking.roomId}`}
                className="booking-detail__room-link"
              >
                {booking.roomName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Peminjam</dt>
            <dd>{booking.borrowerName}</dd>
          </div>
          <div>
            <dt>Keperluan</dt>
            <dd>{booking.purpose}</dd>
          </div>
          <div>
            <dt>Waktu Mulai</dt>
            <dd>{formatDateTime(booking.startTime)}</dd>
          </div>
          <div>
            <dt>Waktu Selesai</dt>
            <dd>{formatDateTime(booking.endTime)}</dd>
          </div>
          <div>
            <dt>Ditambah</dt>
            <dd>{formatDateTime(booking.createdAt)}</dd>
          </div>
        </dl>

        {error && (
          <div className="booking-detail__inline-error" role="alert">
            {error}
          </div>
        )}

        <div className="booking-detail__actions">
          {canEdit && (
            <Link
              to={`/bookings/${booking.id}/edit`}
              className="booking-detail__btn booking-detail__btn--secondary"
            >
              Edit
            </Link>
          )}
          {showStatusActions ? (
            <>
              {allowedStatuses.includes(BookingStatus.Approved) && (
                <button
                  type="button"
                  className="booking-detail__btn booking-detail__btn--approve"
                  onClick={() => handleStatusChange(BookingStatus.Approved)}
                  disabled={updatingStatus}
                >
                  {updatingTo === BookingStatus.Approved ? 'Menyetujui…' : 'Setujui'}
                </button>
              )}
              <button
                type="button"
                className="booking-detail__btn booking-detail__btn--reject"
                onClick={() => handleStatusChange(BookingStatus.Rejected)}
                disabled={updatingStatus}
              >
                {updatingTo === BookingStatus.Rejected ? 'Menolak…' : 'Tolak'}
              </button>
              <button
                type="button"
                className="booking-detail__btn booking-detail__btn--cancel"
                onClick={() => handleStatusChange(BookingStatus.Cancelled)}
                disabled={updatingStatus}
              >
                {updatingTo === BookingStatus.Cancelled ? 'Membatalkan…' : 'Batalkan'}
              </button>
            </>
          ) : (
            <span className="booking-detail__status-info">
              Status tidak dapat diubah ({STATUS_LABELS[booking.status]})
            </span>
          )}
          <button
            type="button"
            className="booking-detail__btn booking-detail__btn--danger"
            onClick={handleDelete}
            disabled={updatingStatus}
          >
            Hapus
          </button>
        </div>
      </article>
    </div>
  )
}
