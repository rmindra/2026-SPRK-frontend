import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getBooking, updateBooking } from '@/api/bookings'
import type { BookingUpdate, Booking } from '@/types'
import { BookingStatus } from '@/types'
import { ApiError } from '@/api/client'
import '@/pages/BookingNewPage.css'

const BORROWER_NAME_MAX = 150
const PURPOSE_MAX = 500

interface FieldErrors {
  borrowerName?: string
  purpose?: string
  startTime?: string
  endTime?: string
}

function formatDateTimeLocal(iso: string): string {
  try {
    const date = new Date(iso)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

function parseDateTimeLocal(dateTimeLocal: string): string {
  try {
    const date = new Date(dateTimeLocal)
    return date.toISOString()
  } catch {
    return ''
  }
}

export function BookingEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const bookingId = id != null ? parseInt(id, 10) : NaN
  const isValidId = Number.isFinite(bookingId) && bookingId > 0

  const [booking, setBooking] = useState<Booking | null>(null)
  const [borrowerName, setBorrowerName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isValidId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setApiError(null)
    setNotFound(false)

    getBooking(bookingId)
      .then((data) => {
        if (cancelled) return
        setBooking(data)
        setBorrowerName(data.borrowerName)
        setPurpose(data.purpose)
        setStartTime(formatDateTimeLocal(data.startTime))
        setEndTime(formatDateTimeLocal(data.endTime))
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          const message =
            err instanceof ApiError
              ? err.body?.message ?? err.message
              : err instanceof Error
                ? err.message
                : 'Gagal memuat data peminjaman.'
          setApiError(message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bookingId, isValidId])

  function validate(): boolean {
    const errors: FieldErrors = {}

    const borrowerNameTrim = borrowerName.trim()
    if (!borrowerNameTrim) {
      errors.borrowerName = 'Nama peminjam wajib diisi.'
    } else if (borrowerNameTrim.length > BORROWER_NAME_MAX) {
      errors.borrowerName = `Nama peminjam maksimal ${BORROWER_NAME_MAX} karakter.`
    }

    const purposeTrim = purpose.trim()
    if (!purposeTrim) {
      errors.purpose = 'Keperluan wajib diisi.'
    } else if (purposeTrim.length > PURPOSE_MAX) {
      errors.purpose = `Keperluan maksimal ${PURPOSE_MAX} karakter.`
    }

    if (!startTime) {
      errors.startTime = 'Waktu mulai wajib diisi.'
    }

    if (!endTime) {
      errors.endTime = 'Waktu selesai wajib diisi.'
    }

    if (startTime && endTime) {
      const start = new Date(parseDateTimeLocal(startTime))
      const end = new Date(parseDateTimeLocal(endTime))
      if (end <= start) {
        errors.endTime = 'Waktu selesai harus setelah waktu mulai.'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!booking) return
    setApiError(null)
    if (!validate()) return

    const payload: BookingUpdate = {
      borrowerName: borrowerName.trim(),
      purpose: purpose.trim(),
      startTime: parseDateTimeLocal(startTime),
      endTime: parseDateTimeLocal(endTime),
    }

    setSubmitting(true)
    try {
      const updated = await updateBooking(booking.id, payload)
      navigate(`/bookings/${updated.id}`, { replace: true })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.body?.message ?? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal menyimpan perubahan.'
      setApiError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isValidId || notFound) {
    return (
      <div className="booking-form-page">
        <div className="booking-form-page__header">
          <Link to="/bookings" className="booking-form-page__back">
            ← Kembali
          </Link>
        </div>
        <div className="booking-form-page__card">
          <div className="booking-form-page__not-found">
            <h1>Peminjaman tidak ditemukan</h1>
            <p>Peminjaman yang Anda cari tidak ada atau telah dihapus.</p>
            <Link to="/bookings" className="booking-form-page__link">
              Kembali ke daftar peminjaman
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="booking-form-page">
        <div className="booking-form-page__header">
          <Link to="/bookings" className="booking-form-page__back">
            ← Kembali
          </Link>
        </div>
        <div className="booking-form-page__card">
          <div className="booking-form-page__loading">
            <p>Memuat data peminjaman…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const canEdit =
    booking.status !== BookingStatus.Cancelled &&
    booking.status !== BookingStatus.Rejected

  if (!canEdit) {
    return (
      <div className="booking-form-page">
        <div className="booking-form-page__header">
          <Link to={`/bookings/${booking.id}`} className="booking-form-page__back">
            ← Kembali
          </Link>
        </div>
        <div className="booking-form-page__card">
          <div className="booking-form-page__not-found">
            <h1>Booking tidak bisa diedit</h1>
            <p>
              Booking dengan status <strong>{booking.status}</strong> tidak dapat
              diedit.
            </p>
            <Link to={`/bookings/${booking.id}`} className="booking-form-page__link">
              Lihat detail booking
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-form-page">
      <div className="booking-form-page__header">
        <Link to={`/bookings/${booking.id}`} className="booking-form-page__back">
          ← Kembali
        </Link>
      </div>
      <div className="booking-form-page__card">
        <h1 className="booking-form-page__title">Edit Peminjaman</h1>

        {apiError && (
          <div className="booking-form-page__api-error" role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="booking-form" noValidate>
          <div className="booking-form__field">
            <label>Ruangan</label>
            <div className="booking-form__readonly-field">
              {booking.roomName}
            </div>
            <span className="booking-form__hint">
              Ruangan tidak dapat diubah setelah peminjaman dibuat.
            </span>
          </div>

          <div className="booking-form__field">
            <label htmlFor="booking-borrower">Nama Peminjam *</label>
            <input
              id="booking-borrower"
              type="text"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              maxLength={BORROWER_NAME_MAX + 1}
              placeholder="Contoh: John Doe"
              aria-invalid={!!fieldErrors.borrowerName}
              aria-describedby={
                fieldErrors.borrowerName
                  ? 'booking-borrower-error'
                  : undefined
              }
            />
            {fieldErrors.borrowerName && (
              <span
                id="booking-borrower-error"
                className="booking-form__error"
              >
                {fieldErrors.borrowerName}
              </span>
            )}
          </div>

          <div className="booking-form__field">
            <label htmlFor="booking-purpose">Keperluan *</label>
            <textarea
              id="booking-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              maxLength={PURPOSE_MAX + 1}
              rows={4}
              placeholder="Deskripsikan keperluan peminjaman ruangan"
              aria-invalid={!!fieldErrors.purpose}
              aria-describedby={
                fieldErrors.purpose ? 'booking-purpose-error' : undefined
              }
            />
            <span className="booking-form__hint">
              {purpose.length}/{PURPOSE_MAX}
            </span>
            {fieldErrors.purpose && (
              <span id="booking-purpose-error" className="booking-form__error">
                {fieldErrors.purpose}
              </span>
            )}
          </div>

          <div className="booking-form__field">
            <label htmlFor="booking-start">Waktu Mulai *</label>
            <input
              id="booking-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              aria-invalid={!!fieldErrors.startTime}
              aria-describedby={
                fieldErrors.startTime ? 'booking-start-error' : undefined
              }
            />
            {fieldErrors.startTime && (
              <span id="booking-start-error" className="booking-form__error">
                {fieldErrors.startTime}
              </span>
            )}
          </div>

          <div className="booking-form__field">
            <label htmlFor="booking-end">Waktu Selesai *</label>
            <input
              id="booking-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              aria-invalid={!!fieldErrors.endTime}
              aria-describedby={
                fieldErrors.endTime ? 'booking-end-error' : undefined
              }
            />
            {fieldErrors.endTime && (
              <span id="booking-end-error" className="booking-form__error">
                {fieldErrors.endTime}
              </span>
            )}
          </div>

          <div className="booking-form__actions">
            <button
              type="submit"
              className="booking-form__btn booking-form__btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan…' : 'Simpan perubahan'}
            </button>
            <Link
              to={`/bookings/${booking.id}`}
              className="booking-form__btn booking-form__btn--secondary"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
