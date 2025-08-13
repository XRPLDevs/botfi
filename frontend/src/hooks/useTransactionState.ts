import { useState, useCallback } from 'react'

export const useTransactionState = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const clearMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])
  
  const resetState = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setSuccess(null)
  }, [])
  
  return {
    isLoading,
    setIsLoading,
    error,
    setError,
    success,
    setSuccess,
    clearMessages,
    resetState
  }
}
