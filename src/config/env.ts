function required(name: keyof ImportMetaEnv, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `Missing public env ${String(name)}. Copy .env.example to .env.local and set the value.`,
    )
  }
  return value.trim().replace(/\/$/, '')
}

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
}
