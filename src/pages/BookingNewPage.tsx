import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createBooking } from '@/api/bookings'
import { getRooms } from '@/api/rooms'
import type { BookingCreate, Room } from '@/types'
import { ApiError } from '@/api/client'
import '@/pages/BookingNewPage.css'

const BORROWER_NAME_MAX = 150
const PURPOSE_MAX = 500

interface FieldErrors {
  roomId?: string
  borrowerName?: string
  purpose?: string
  startTime?: string
  endTime?: string
}

function parseDateTimeLocal(dateTimeLocal: string): string {
  try {
    const date = new Date(dateTimeLocal)
    return date.toISOString()
  } catch {
    return ''
  }
}

export function BookingNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomIdParam = searchParams.get('roomId')

  const [rooms, setRooms] = useState<Room[]>([])
  const [roomId, setRoomId] = useState<number | ''>(
    roomIdParam ? parseInt(roomIdParam, 10) : ''
  )
  const [borrowerName, setBorrowerName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingRooms(true)
    getRooms()
      .then((data) => {
        if (!cancelled) {
          setRooms(data)
          // Jika roomId dari URL valid, set roomId
          if (roomIdParam) {
            const id = parseInt(roomIdParam, 10)
            if (Number.isFinite(id) && data.some((r) => r.id === id)) {
              setRoomId(id)
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRooms([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRooms(false)
      })

    return () => {
      cancelled = true
    }
  }, [roomIdParam])

  function validate(): boolean {
    const errors: FieldErrors = {}

    if (roomId === '' || !Number.isFinite(roomId)) {
      errors.roomId = 'Ruangan wajib dipilih.'
    }

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
    setApiError(null)
    if (!validate()) return

    const payload: BookingCreate = {
      roomId: roomId as number,
      borrowerName: borrowerName.trim(),
      purpose: purpose.trim(),
      startTime: parseDateTimeLocal(startTime),
      endTime: parseDateTimeLocal(endTime),
    }

    setSubmitting(true)
    try {
      const created = await createBooking(payload)
      navigate(`/bookings/${created.id}`, { replace: true })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.body?.message ?? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal menyimpan peminjaman.'
      setApiError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="booking-form-page">
      <div className="booking-form-page__header">
        <Link to="/bookings" className="booking-form-page__back">
          ← Kembali
        </Link>
      </div>
      <div className="booking-form-page__card">
        <h1 className="booking-form-page__title">Buat Peminjaman</h1>

        {apiError && (
          <div className="booking-form-page__api-error" role="alert">
            {apiError}
          </div>
        )}

        {loadingRooms ? (
          <div className="booking-form-page__loading">
            <p>Memuat daftar ruangan…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="booking-form" noValidate>
            <div className="booking-form__field">
              <label htmlFor="booking-room">Ruangan *</label>
              <select
                id="booking-room"
                value={roomId === '' ? '' : String(roomId)}
                onChange={(e) =>
                  setRoomId(e.target.value === '' ? '' : Number(e.target.value))
                }
                aria-invalid={!!fieldErrors.roomId}
                aria-describedby={
                  fieldErrors.roomId ? 'booking-room-error' : undefined
                }
              >
                <option value="">Pilih ruangan</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} {room.isAvailable ? '' : '(Tidak tersedia)'}
                  </option>
                ))}
              </select>
              {fieldErrors.roomId && (
                <span id="booking-room-error" className="booking-form__error">
                  {fieldErrors.roomId}
                </span>
              )}
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
                {submitting ? 'Menyimpan…' : 'Buat peminjaman'}
              </button>
              <Link
                to="/bookings"
                className="booking-form__btn booking-form__btn--secondary"
              >
                Batal
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
