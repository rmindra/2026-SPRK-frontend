import { get, post, put, del } from '@/api/client'
import type { Room, RoomCreate, RoomUpdate } from '@/types'

const basePath = '/api/Rooms'

export async function getRooms(): Promise<Room[]> {
  return get<Room[]>(basePath)
}

export async function getRoom(id: number): Promise<Room> {
  return get<Room>(`${basePath}/${id}`)
}

export async function createRoom(payload: RoomCreate): Promise<Room> {
  return post<Room>(basePath, payload)
}

export async function updateRoom(id: number, payload: RoomUpdate): Promise<Room> {
  return put<Room>(`${basePath}/${id}`, payload)
}

export async function deleteRoom(id: number): Promise<void> {
  return del(`${basePath}/${id}`)
}
