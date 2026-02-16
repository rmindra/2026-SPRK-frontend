import { get, post, put, patch, del } from '@/api/client'
import type {
  Booking,
  BookingCreate,
  BookingUpdate,
  BookingFilter,
  BookingStatusType,
} from '@/types'

const basePath = '/api/Bookings'

function buildQueryString(filter?: BookingFilter): string {
  if (!filter) return ''
  const params = new URLSearchParams()
  if (filter.borrowerName != null && filter.borrowerName !== '') {
    params.set('borrowerName', filter.borrowerName)
  }
  if (filter.roomId != null) {
    params.set('roomId', String(filter.roomId))
  }
  if (filter.status != null) {
    params.set('status', filter.status)
  }
  if (filter.date != null && filter.date !== '') {
    params.set('date', filter.date)
  }
  if (filter.sortBy != null) {
    params.set('sortBy', filter.sortBy)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function getBookings(filter?: BookingFilter): Promise<Booking[]> {
  const query = buildQueryString(filter)
  return get<Booking[]>(`${basePath}${query}`)
}

export async function getBooking(id: number): Promise<Booking> {
  return get<Booking>(`${basePath}/${id}`)
}

export async function createBooking(payload: BookingCreate): Promise<Booking> {
  return post<Booking>(basePath, payload)
}

export async function updateBooking(id: number, payload: BookingUpdate): Promise<Booking> {
  return put<Booking>(`${basePath}/${id}`, payload)
}

export async function updateBookingStatus(
  id: number,
  status: BookingStatusType
): Promise<Booking> {
  return patch<Booking>(`${basePath}/${id}/status`, { status })
}

export async function deleteBooking(id: number): Promise<void> {
  return del(`${basePath}/${id}`)
}
