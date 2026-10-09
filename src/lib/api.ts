async function parse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Ocurrió un error.');
  return data as T;
}

export async function apiGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  return parse<T>(await fetch(url, { credentials: 'include', signal }));
}

export async function apiSend<T>(url: string, method: string, body?: unknown): Promise<T> {
  return parse<T>(await fetch(url, {
    method,
    credentials: 'include',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  }));
}
