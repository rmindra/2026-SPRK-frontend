import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getRoom, updateRoom } from '@/api/rooms'
import type { RoomUpdate } from '@/types'
import { ApiError } from '@/api/client'
import '@/pages/RoomsNewPage.css'

const NAME_MAX = 100
const LOCATION_MAX = 255
const DESCRIPTION_MAX = 500
const CAPACITY_MIN = 1
const CAPACITY_MAX = 1000

interface FieldErrors {
  name?: string
  capacity?: string
  location?: string
  description?: string
}

export function RoomEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const roomId = id != null ? parseInt(id, 10) : NaN
  const isValidId = Number.isFinite(roomId) && roomId > 0

  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
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

    getRoom(roomId)
      .then((room) => {
        if (cancelled) return
        setName(room.name)
        setCapacity(room.capacity)
        setLocation(room.location)
        setDescription(room.description ?? '')
        setIsAvailable(room.isAvailable)
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
                : 'Gagal memuat data ruangan.'
          setApiError(message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [roomId, isValidId])

  function validate(): boolean {
    const errors: FieldErrors = {}

    const nameTrim = name.trim()
    if (!nameTrim) {
      errors.name = 'Nama ruangan wajib diisi.'
    } else if (nameTrim.length > NAME_MAX) {
      errors.name = `Nama maksimal ${NAME_MAX} karakter.`
    }

    const locationTrim = location.trim()
    if (!locationTrim) {
      errors.location = 'Lokasi wajib diisi.'
    } else if (locationTrim.length > LOCATION_MAX) {
      errors.location = `Lokasi maksimal ${LOCATION_MAX} karakter.`
    }

    const cap = typeof capacity === 'number' ? capacity : Number(capacity)
    if (Number.isNaN(cap) || cap < CAPACITY_MIN || cap > CAPACITY_MAX) {
      errors.capacity = `Kapasitas harus antara ${CAPACITY_MIN}–${CAPACITY_MAX}.`
    }

    if (description.length > DESCRIPTION_MAX) {
      errors.description = `Deskripsi maksimal ${DESCRIPTION_MAX} karakter.`
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setApiError(null)
    if (!validate()) return

    const cap = typeof capacity === 'number' ? capacity : Number(capacity)
    const payload: RoomUpdate = {
      name: name.trim(),
      capacity: cap,
      location: location.trim(),
      description: description.trim() || undefined,
      isAvailable,
    }

    setSubmitting(true)
    try {
      await updateRoom(roomId, payload)
      navigate(`/rooms/${roomId}`, { replace: true })
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

  function handleCapacityChange(value: string) {
    if (value === '') {
      setCapacity('')
      return
    }
    const num = parseInt(value, 10)
    if (!Number.isNaN(num)) setCapacity(num)
  }

  if (!isValidId || notFound) {
    return (
      <div className="room-form-page">
        <div className="room-form-page__header">
          <Link to="/rooms" className="room-form-page__back">
            ← Kembali
          </Link>
        </div>
        <div className="room-form-page__card">
          <h1 className="room-form-page__title">Ruangan tidak ditemukan</h1>
          <p>Ruangan yang Anda cari tidak ada atau telah dihapus.</p>
          <Link to="/rooms" className="room-form__btn room-form__btn--primary">
            Kembali ke daftar ruangan
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="room-form-page">
        <div className="room-form-page__header">
          <Link to="/rooms" className="room-form-page__back">
            ← Kembali
          </Link>
        </div>
        <div className="room-form-page__card">
          <p style={{ margin: 0, textAlign: 'center' }}>
            Memuat data ruangan…
          </p>
        </div>
      </div>
    )
  }

  if (apiError && !name && !location) {
    return (
      <div className="room-form-page">
        <div className="room-form-page__header">
          <Link to="/rooms" className="room-form-page__back">
            ← Kembali
          </Link>
        </div>
        <div className="room-form-page__card">
          <div className="room-form-page__api-error" role="alert">
            {apiError}
          </div>
          <Link to="/rooms" className="room-form__btn room-form__btn--primary">
            Kembali ke daftar ruangan
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="room-form-page">
      <div className="room-form-page__header">
        <Link to={`/rooms/${roomId}`} className="room-form-page__back">
          ← Kembali
        </Link>
      </div>
      <div className="room-form-page__card">
        <h1 className="room-form-page__title">Edit Ruangan</h1>

        {apiError && (
          <div className="room-form-page__api-error" role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="room-form" noValidate>
          <div className="room-form__field">
            <label htmlFor="room-name">Nama ruangan *</label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX + 1}
              placeholder="Contoh: Ruang Rapat A"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'room-name-error' : undefined}
            />
            {fieldErrors.name && (
              <span id="room-name-error" className="room-form__error">
                {fieldErrors.name}
              </span>
            )}
          </div>

          <div className="room-form__field">
            <label htmlFor="room-capacity">Kapasitas (1–1000) *</label>
            <input
              id="room-capacity"
              type="number"
              min={CAPACITY_MIN}
              max={CAPACITY_MAX}
              value={capacity === '' ? '' : capacity}
              onChange={(e) => handleCapacityChange(e.target.value)}
              placeholder="100"
              aria-invalid={!!fieldErrors.capacity}
              aria-describedby={
                fieldErrors.capacity ? 'room-capacity-error' : undefined
              }
            />
            {fieldErrors.capacity && (
              <span id="room-capacity-error" className="room-form__error">
                {fieldErrors.capacity}
              </span>
            )}
          </div>

          <div className="room-form__field">
            <label htmlFor="room-location">Lokasi *</label>
            <input
              id="room-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={LOCATION_MAX + 1}
              placeholder="Contoh: Gedung A Lantai 2"
              aria-invalid={!!fieldErrors.location}
              aria-describedby={
                fieldErrors.location ? 'room-location-error' : undefined
              }
            />
            {fieldErrors.location && (
              <span id="room-location-error" className="room-form__error">
                {fieldErrors.location}
              </span>
            )}
          </div>

          <div className="room-form__field">
            <label htmlFor="room-description">Deskripsi (opsional)</label>
            <textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={DESCRIPTION_MAX + 1}
              rows={3}
              placeholder="Keterangan tambahan tentang ruangan"
              aria-invalid={!!fieldErrors.description}
              aria-describedby={
                fieldErrors.description ? 'room-description-error' : undefined
              }
            />
            <span className="room-form__hint">
              {description.length}/{DESCRIPTION_MAX}
            </span>
            {fieldErrors.description && (
              <span id="room-description-error" className="room-form__error">
                {fieldErrors.description}
              </span>
            )}
          </div>

          <div className="room-form__field room-form__field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
              <span>Tersedia</span>
            </label>
            <span className="room-form__hint">
              Ruangan dapat dipinjam jika dicentang.
            </span>
          </div>

          <div className="room-form__actions">
            <button
              type="submit"
              className="room-form__btn room-form__btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan…' : 'Simpan perubahan'}
            </button>
            <Link
              to={`/rooms/${roomId}`}
              className="room-form__btn room-form__btn--secondary"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
