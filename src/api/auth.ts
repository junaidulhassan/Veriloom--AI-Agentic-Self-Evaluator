import type {
  AccountDeleteRequest,
  AccountSummary,
  LoginRequest,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  RegisterRequest,
  User,
} from '@/types/api'
import { get, patch, post } from './client'

export const authApi = {
  me: () => get<User>('/auth/me', { retries: 0 }),
  login: (body: LoginRequest) => post<User>('/auth/login', body),
  register: (body: RegisterRequest) => post<User>('/auth/register', body),
  logout: () => post<void>('/auth/logout'),
}

export const accountApi = {
  summary: () => get<AccountSummary>('/account'),
  update: (body: ProfileUpdateRequest) => patch<User>('/account', body),
  changePassword: (body: PasswordChangeRequest) =>
    post<{ revoked_sessions: number }>('/account/password', body),
  remove: (body: AccountDeleteRequest) => post<Record<string, number>>('/account/delete', body),
}
