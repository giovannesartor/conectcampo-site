import { fetchJson } from './fetch-json';

describe('fetchJson', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.clearAllMocks();
  });

  it('retorna JSON quando a resposta é ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' }),
    }) as any;

    const data = await fetchJson<{ hello: string }>('https://x.test', { retries: 0 });
    expect(data.hello).toBe('world');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('repete em 5xx e sucede na tentativa seguinte', async () => {
    const fn = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: 1 }) });
    global.fetch = fn as any;

    const data = await fetchJson('https://x.test', { retries: 2, backoffMs: 1 });
    expect(data).toEqual({ ok: 1 });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('não repete em 4xx e lança', async () => {
    const fn = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    global.fetch = fn as any;

    await expect(fetchJson('https://x.test', { retries: 3, backoffMs: 1 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('lança após esgotar as tentativas em erro de rede', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('network'));
    global.fetch = fn as any;

    await expect(fetchJson('https://x.test', { retries: 1, backoffMs: 1 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
