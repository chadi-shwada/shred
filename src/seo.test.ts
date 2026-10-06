import { describe, expect, it } from 'vitest';
import { PUBLIC_ROUTES } from './router';
import { headTags, htmlFileName, NOT_FOUND, pageMeta, PAGES, sitemapXml, structuredData } from './seo';

describe('pages', () => {
  it('couvre exactement les routes de l’application', () => {
    expect(PAGES.map((p) => p.path).sort()).toEqual([...PUBLIC_ROUTES].sort());
  });

  it('a un titre et une description uniques', () => {
    expect(new Set(PAGES.map((p) => p.title)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((p) => p.description)).size).toBe(PAGES.length);
    for (const p of PAGES) expect(p.description.length).toBeLessThanOrEqual(200);
  });

  it('donne un fichier HTML par adresse', () => {
    expect(PAGES.map(htmlFileName)).toContain('verifier.html');
    expect(htmlFileName(PAGES[0]!)).toBe('index.html');
  });
});

describe('headTags', () => {
  it('chaque page est sa propre adresse canonique', () => {
    const tags = headTags(pageMeta('/verifier'));
    expect(tags).toContain('<link rel="canonical" href="https://shredrgpd.fr/verifier" />');
    expect(tags).toContain('<meta property="og:url" content="https://shredrgpd.fr/verifier" />');
    expect(tags).toContain('<title>Vérifier mes fuites · ShredRGPD</title>');
  });

  it("l'accueil pointe vers « / »", () => {
    expect(headTags(pageMeta('/'))).toContain('href="https://shredrgpd.fr/"');
  });

  it("la page 404 n'est pas indexée et n'a pas d'adresse canonique", () => {
    const tags = headTags(NOT_FOUND, { noindex: true });
    expect(tags).toContain('<meta name="robots" content="noindex" />');
    expect(tags).not.toContain('canonical');
    expect(pageMeta('/inconnue')).toBe(NOT_FOUND);
  });

  it('échappe les guillemets', () => {
    expect(headTags({ path: '/x', title: 'a"b', description: '<c>' })).toContain('content="a&quot;b"');
  });
});

describe('sitemap', () => {
  it('liste toutes les pages, sans la 404', () => {
    const xml = sitemapXml();
    for (const p of PAGES) expect(xml).toContain(`<loc>https://shredrgpd.fr${p.path}</loc>`);
    expect(xml).not.toContain('404');
  });

  it('utilise l’image propre à la page quand elle existe', () => {
    const tags = headTags({ path: '/fuite/free', title: 'Fuite Free', description: 'x', image: '/og/free.jpg' });
    expect(tags).toContain('content="https://shredrgpd.fr/og/free.jpg"');
    expect(tags).toContain('<meta property="og:image:alt" content="Fuite Free" />');
    expect(headTags(pageMeta('/'))).toContain('content="https://shredrgpd.fr/og.png"');
  });
});

describe('référencement', () => {
  it('ajoute la date de mise à jour des pages qui en ont une', () => {
    const xml = sitemapXml([{ path: '/fuite/free', title: 'Fuite Free', description: 'x', lastmod: '2024-10-19' }]);
    expect(xml).toContain('<url><loc>https://shredrgpd.fr/fuite/free</loc><lastmod>2024-10-19</lastmod></url>');
    expect(xml).toContain('<url><loc>https://shredrgpd.fr/verifier</loc></url>');
  });

  it('décrit le site et l’outil gratuit en JSON-LD, sur l’accueil seulement', () => {
    const block = structuredData();
    const json = JSON.parse(block.replace(/^<script type="application\/ld\+json">|<\/script>$/g, ''));
    expect(json['@graph'].map((n: { '@type': string }) => n['@type'])).toEqual(['WebSite', 'WebApplication']);
    expect(json['@graph'][1].offers.price).toBe('0');
    expect(block).not.toMatch(/<(?!script|\/script)/);
    expect(headTags(pageMeta('/'))).toContain('application/ld+json');
    expect(headTags(pageMeta('/verifier'))).not.toContain('application/ld+json');
    expect(headTags(NOT_FOUND, { noindex: true })).not.toContain('application/ld+json');
  });
});
