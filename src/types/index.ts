// ---------------------------------------------------------------------------
// Room types (mirror backend DTOs)
// ---------------------------------------------------------------------------

export interface Room {
  id: number
  name: string
  capacity: number
  location: string
  description?: string
  isAvailable: boolean
  createdAt: string
}

export interface RoomCreate {
  name: string
  capacity: number
  location: string
  description?: string
  isAvailable: boolean
}

export interface RoomUpdate {
  name?: string
  capacity?: number
  location?: string
  description?: string
  isAvailable?: boolean
}

// ---------------------------------------------------------------------------
// Booking types (mirror backend DTOs)
// ---------------------------------------------------------------------------

export const BookingStatus = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Cancelled: 'Cancelled',
} as const

export type BookingStatusType = (typeof BookingStatus)[keyof typeof BookingStatus]

export interface Booking {
  id: number
  roomId: number
  roomName: string
  borrowerName: string
  purpose: string
  startTime: string
  endTime: string
  status: BookingStatusType
  createdAt: string
}

export interface BookingCreate {
  roomId: number
  borrowerName: string
  purpose: string
  startTime: string
  endTime: string
}

export interface BookingUpdate {
  borrowerName?: string
  purpose?: string
  startTime?: string
  endTime?: string
}

// ---------------------------------------------------------------------------
// Booking filter (for GET api/Bookings query params)
// ---------------------------------------------------------------------------

export const BookingSortBy = {
  DateDesc: 'DateDesc',
  DateAsc: 'DateAsc',
  NameAsc: 'NameAsc',
  NameDesc: 'NameDesc',
} as const

export type BookingSortByType = (typeof BookingSortBy)[keyof typeof BookingSortBy]

export interface BookingFilter {
  borrowerName?: string
  roomId?: number
  status?: BookingStatusType
  date?: string
  sortBy?: BookingSortByType
}

// ---------------------------------------------------------------------------
// API error (backend returns { message: "..." } in many endpoints)
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  message?: string
  [key: string]: unknown
}
