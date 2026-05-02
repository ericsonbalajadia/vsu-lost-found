// src/hooks/useAdminCheck.ts
import { useAuth } from './useAuth'

export function useAdminCheck(): boolean {
  const { isAdmin } = useAuth()
  return isAdmin
}