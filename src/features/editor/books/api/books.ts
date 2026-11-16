import {
  demoCreateBook,
  demoFetchBookById,
  demoFetchEditorBooks,
  demoPublishBook,
} from '../../../../demo/demoApi'
import { apiRequest } from '../../../../shared/api/client'
import { env } from '../../../../shared/config/env'

export type EditorBook = {
  id: number
  title: string
  isbn: string | null
  description: string | null
  isPublished: boolean
  editorName?: string | null
  recipesId?: number[]
  recipesName?: Array<{ id?: number | null; name?: string | null }>
}

export type BookCreateRequest = {
  title: string
  isbn: string
  description: string
  recipesId: number[]
}

export function fetchEditorBooks(): Promise<EditorBook[]> {
  if (env.useDemoApi) return demoFetchEditorBooks()
  return apiRequest<EditorBook[]>('/books')
}

export function fetchBookById(id: number): Promise<EditorBook> {
  if (env.useDemoApi) return demoFetchBookById(id)
  return apiRequest<EditorBook>(`/books/${id}`)
}

export function createBook(body: BookCreateRequest): Promise<EditorBook | void> {
  if (env.useDemoApi) return demoCreateBook(body)
  return apiRequest<EditorBook>('/books', { method: 'POST', body })
}

export function publishBook(id: number): Promise<void> {
  if (env.useDemoApi) return demoPublishBook(id)
  return apiRequest<void>(`/books/${id}`, { method: 'PATCH' })
}