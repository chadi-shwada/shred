import { describe, expect, it } from 'vitest';
import { countInRange, pwnedCount, PwnedServiceError, sha1Hex, splitHash, type Fetcher } from './pwned';

describe('sha1Hex', () => {
  it('calcule le SHA-1 en majuscules', async () => {
    // SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    expect(await sha1Hex('password')).toBe('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
  });

  it('encode en UTF-8', async () => {
    // SHA-1("é") = sur les octets C3 A9
    expect(await sha1Hex('é')).toHaveLength(40);
    expect(await sha1Hex('é')).not.toBe(await sha1Hex('e'));
  });
});

describe('splitHash', () => {
  it('garde 5 caractères pour la requête', () => {
    expect(splitHash('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8')).toEqual({
      prefix: '5BAA6',
      suffix: '1E4C9B93F3F0682250B6CF8331B7EE68FD8',
    });
  });
});

describe('countInRange', () => {
  const body = '0018A45C4D1DEF81644B54AB7F969B88D65:10\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:9545824\r\nABCDEF:0';
  it('trouve le suffixe sans tenir compte de la casse', () => {
    expect(countInRange(body, '1e4c9b93f3f0682250b6cf8331b7ee68fd8')).toBe(9545824);
  });
  it('renvoie 0 si absent ou si la ligne vient du remplissage', () => {
    expect(countInRange(body, 'FFFF')).toBe(0);
    expect(countInRange(body, 'ABCDEF')).toBe(0);
  });
});

describe('pwnedCount', () => {
  const ok = (text: string): Awaited<ReturnType<Fetcher>> => ({ ok: true, status: 200, text: async () => text });

  it('n’envoie que les 5 premiers caractères de l’empreinte', async () => {
    const urls: string[] = [];
    const fetcher: Fetcher = async (url) => {
      urls.push(url);
      return ok('1E4C9B93F3F0682250B6CF8331B7EE68FD8:42');
    };
    expect(await pwnedCount('password', fetcher)).toBe(42);
    expect(urls).toEqual(['https://api.pwnedpasswords.com/range/5BAA6']);
  });

  it('demande le remplissage, puis retente sans si la requête échoue', async () => {
    const headers: unknown[] = [];
    let calls = 0;
    const fetcher: Fetcher = async (_url, init) => {
      headers.push(init?.headers);
      calls += 1;
      if (calls === 1) throw new TypeError('Failed to fetch');
      return ok('');
    };
    expect(await pwnedCount('password', fetcher)).toBe(0);
    expect(headers).toEqual([{ 'Add-Padding': 'true' }, undefined]);
  });

  it('signale une panne du service', async () => {
    const down: Fetcher = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(pwnedCount('password', down)).rejects.toThrow(PwnedServiceError);
    const error: Fetcher = async () => ({ ok: false, status: 503, text: async () => '' });
    await expect(pwnedCount('password', error)).rejects.toThrow('503');
  });

  it('ne fait aucune requête pour un mot de passe vide', async () => {
    const never: Fetcher = async () => {
      throw new Error('ne doit pas être appelé');
    };
    expect(await pwnedCount('', never)).toBe(0);
  });
});
