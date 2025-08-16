'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/toaster';
import { useWalletStore } from '@/stores/wallet.store';

type ApiCallOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
};

type ApiCallResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (endpoint: string, options?: RequestInit) => Promise<T | null>;
  reset: () => void;
};

/**
 * 共通のAPI呼び出し処理を提供するカスタムフック
 */
export function useApiCall<T = any>(options: ApiCallOptions<T> = {}): ApiCallResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { account, isConnected } = useWalletStore();

  const { onSuccess, onError, successMessage, errorMessage, showToast = true } = options;

  const execute = useCallback(
    async (endpoint: string, requestOptions: RequestInit = {}): Promise<T | null> => {
      if (!isConnected || !account?.jwt) {
        const errorMsg = 'ウォレットが接続されていません';
        setError(errorMsg);
        if (showToast) toast.error(errorMsg);
        onError?.(errorMsg);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
        const isFormData = requestOptions.body instanceof FormData;
        const headers: Record<string, string> = {
          Authorization: `Bearer ${account.jwt}`,
        };

        // requestOptions.headersがある場合は追加
        if (requestOptions.headers) {
          Object.entries(requestOptions.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
              headers[key] = value;
            }
          });
        }

        // FormDataでない場合のみContent-Typeを設定
        if (!isFormData) {
          headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(endpoint, {
          ...requestOptions,
          headers,
        });

        const result = await response.json();

        if (result.ok) {
          setData(result);
          if (showToast && successMessage) {
            toast.success(successMessage);
          }
          onSuccess?.(result);
          return result;
        } else {
          const errorMsg = result.error || errorMessage || 'API呼び出しに失敗しました';
          setError(errorMsg);
          if (showToast) toast.error(errorMsg);
          onError?.(errorMsg);
          return null;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '予期しないエラーが発生しました';
        setError(errorMsg);
        if (showToast) toast.error(errorMsg);
        onError?.(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, account?.jwt, onSuccess, onError, successMessage, errorMessage, showToast]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}

/**
 * FormDataを使用したAPI呼び出し用のフック
 */
export function useFormDataApiCall<T = any>(
  options: ApiCallOptions<T> = {}
): Omit<ApiCallResult<T>, 'execute'> & {
  execute: (endpoint: string, formData: FormData) => Promise<T | null>;
} {
  const baseHook = useApiCall<T>(options);

  const executeWithFormData = useCallback(
    async (endpoint: string, formData: FormData): Promise<T | null> => {
      return baseHook.execute(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
          // AuthorizationヘッダーはbaseHook.execute内で設定される
        },
      });
    },
    [baseHook]
  );

  return {
    ...baseHook,
    execute: executeWithFormData,
  };
}
