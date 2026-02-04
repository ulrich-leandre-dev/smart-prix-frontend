/**
 * Scraper amélioré avec fallback vers ScrapingBee
 * 
 * Architecture:
 * 1. Essayer d'abord avec Axios direct (gratuit)
 * 2. Si échec → utiliser ScrapingBee (payant mais fiable)
 * 3. Si toujours échec → retourner erreur claire
 * 
 * Avantages:
 * - Minimalise les coûts (ne paye que quand nécessaire)
 * - Data réelle de Jumia CI
 * - Pas de "placeholders" ou fausses données
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeWithScrapingBee, isScrapingBeeConfigured } from './scrapingbee-client';

export interface ScrapedProduct {
  id?: string;
  name: string;
  price: number;
  image: string;
  link: string;
  source: string;
  rating?: number;
  delivery_time?: string;
  in_stock?: boolean;
}

/**
 * Scrape tous les produits depuis plusieurs sources
 */
export async function scrapeProducts(query: string): Promise<ScrapedProduct[]> {
  const sources = [
    scrapeJumia(query),
    // scrapeAfrimarket(query),  // TODO: À implémenter
    // scrapeGlovo(query),       // TODO: À implémenter - Glovo a une API plus ouverte
  ];

  const results = await Promise.allSettled(sources);
  
  const products: ScrapedProduct[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      products.push(...result.value);
    }
  }

  // Si aucun produit trouvé, retourner un message clair
  // (pas de placeholders fictifs)
  if (products.length === 0) {
    throw new Error('Aucun produit trouvé. Vérifiez votre connexion ou la configuration ScrapingBee.');
  }

  return products;
}

/**
 * Scrape Jumia CI avec fallback vers ScrapingBee
 */
async function scrapeJumia(query: string): Promise<ScrapedProduct[]> {
  const url = `https://www.jumia.ci/catalog/?q=${encodeURIComponent(query)}`;
  
  let html: string;
  let usedScrapingBee = false;

  // Étape 1: Essayer avec Axios direct (gratuit)
  try {
    html = await scrapeWithAxios(url);
  } catch (error) {
    console.log('[Jumia] Axios direct échoué, tentative avec ScrapingBee...');
    
    // Étape 2: Fallback vers ScrapingBee
    if (isScrapingBeeConfigured()) {
      try {
        html = await scrapeWithScrapingBee(url, {
          premium_proxy: true,
          country_code: 'ci',
          render_js: false,
        });
        usedScrapingBee = true;
        console.log('[Jumia] ScrapingBee réussi');
      } catch (sbError) {
        console.error('[Jumia] ScrapingBee aussi échoué:', sbError);
        throw new Error(`Jumia inaccessible: ${(sbError as Error).message}`);
      }
    } else {
      throw new Error('Jumia bloqué par Cloudflare. Configurez SCRAPINGBEE_API_KEY pour contourner.');
    }
  }

  // Parsing du HTML avec Cheerio
  const products = parseJumiaProducts(html);
  
  if (products.length === 0) {
    throw new Error(`Aucun produit trouvé sur Jumia pour "${query}"`);
  }

  // Ajouter metadata sur la méthode utilisée
  return products.map(p => ({
    ...p,
    source: usedScrapingBee ? 'Jumia CI (via proxy)' : 'Jumia CI'
  }));
}

/**
 * Scrape avec Axios direct
 */
async function scrapeWithAxios(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.google.com/',
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0',
    },
    timeout: 15000,
  });

  return response.data;
}

/**
 * Parse les produits Jumia depuis le HTML
 */
function parseJumiaProducts(html: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];

  // Sélecteurs Jumia CI (vérifiés février 2025)
  $('article.prd._fb.col.c-prd').each((i, el) => {
    if (i >= 12) return; // Limiter à 12 produits

    const $el = $(el);
    
    // Nom du produit
    const name = $el.find('h3.name').text().trim();
    
    // Prix
    const priceText = $el.find('.prc').first().text().replace(/[^0-9]/g, '');
    
    // Image
    const image = $el.find('.img-c img').attr('data-src') || 
                  $el.find('.img-c img').attr('src') || '';
    
    // Lien
    const href = $el.find('a.core').attr('href');
    const link = href ? (href.startsWith('http') ? href : `https://www.jumia.ci${href}`) : '';
    
    // Rating (étoiles)
    const ratingText = $el.find('.stars._s').text().trim();
    const rating = ratingText ? parseFloat(ratingText) : undefined;
    
    // Stock
    const inStock = !$el.text().includes('Rupture de stock');

    if (name && priceText) {
      products.push({
        id: href?.split('/').pop()?.split('.')[0],
        name,
        price: parseInt(priceText),
        image,
        link,
        source: 'Jumia CI',
        rating,
        in_stock: inStock,
        delivery_time: '24-48h',
      });
    }
  });

  // Fallback selectors si le premier ne marche pas
  if (products.length === 0) {
    $('article.prd').each((i, el) => {
      if (i >= 12) return;

      const $el = $(el);
      const name = $el.find('.info h3.name').text().trim();
      const priceText = $el.find('.info .prc').first().text().replace(/[^0-9]/g, '');
      const image = $el.find('.img-c img.img').attr('data-src') || 
                    $el.find('.img-c img.img').attr('src') || '';
      const href = $el.find('a.core').attr('href');
      const link = href ? `https://www.jumia.ci${href}` : '';

      if (name && priceText) {
        products.push({
          name,
          price: parseInt(priceText),
          image,
          link,
          source: 'Jumia CI',
          delivery_time: '24-48h',
        });
      }
    });
  }

  return products;
}

/**
 * TODO: Scraper Afrimarket
 * Documenter l'API ou le scraping nécessaire
 */
async function scrapeAfrimarket(query: string): Promise<ScrapedProduct[]> {
  // Afrimarket: https://www.afrimarket.ci/
  // À implémenter si Jumia n'est pas suffisant
  return [];
}

/**
 * TODO: Scraper Glovo
 * Glovo a souvent une API GraphQL/REST plus accessible
 */
async function scrapeGlovo(query: string): Promise<ScrapedProduct[]> {
  // Glovo API endpoint: https://api.glovoapp.com/
  // Nécessite investigation de l'API officielle
  return [];
}
