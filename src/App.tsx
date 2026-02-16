import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { RoomsPage } from '@/pages/RoomsPage'
import { RoomDetailPage } from '@/pages/RoomDetailPage'
import { RoomEditPage } from '@/pages/RoomEditPage'
import { RoomsNewPage } from '@/pages/RoomsNewPage'
import { BookingsPage } from '@/pages/BookingsPage'
import { BookingDetailPage } from '@/pages/BookingDetailPage'
import { BookingNewPage } from '@/pages/BookingNewPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/rooms" replace />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/new" element={<RoomsNewPage />} />
          <Route path="rooms/:id" element={<RoomDetailPage />} />
          <Route path="rooms/:id/edit" element={<RoomEditPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/new" element={<BookingNewPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
