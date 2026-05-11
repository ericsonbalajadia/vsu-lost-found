// src/hooks/useAdminCheck.ts
import { useAuth } from '../contexts/AuthContext';

export function useAdminCheck(): boolean {
  const { isAdmin } = useAuth()
  return isAdmin
}