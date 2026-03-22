const STORAGE_KEY = "dth_accounts"

export interface StoredAccount {
  email: string
  full_name: string
  role: string
  avatar_url: string | null
  access_token: string
  refresh_token: string
  updated_at: number
}

function isClient(): boolean {
  return typeof window !== "undefined"
}

function readStore(): Record<string, StoredAccount> {
  if (!isClient()) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, StoredAccount>
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, StoredAccount>): void {
  if (!isClient()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function saveAccount(account: StoredAccount): void {
  const store = readStore()
  store[account.email] = account
  writeStore(store)
}

export function getAccounts(): StoredAccount[] {
  const store = readStore()
  return Object.values(store)
}

export function removeAccount(email: string): void {
  const store = readStore()
  delete store[email]
  writeStore(store)
}

export function clearAccounts(): void {
  if (!isClient()) return
  localStorage.removeItem(STORAGE_KEY)
}
