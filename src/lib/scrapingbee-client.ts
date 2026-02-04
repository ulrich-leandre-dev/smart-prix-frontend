/**
 * Client ScrapingBee pour contourner Cloudflare et autres protections anti-bot
 * Documentation: https://www.scrapingbee.com/documentation/
 * 
 * Avantages:
 * - Proxies rotatifs premium qui contournent Cloudflare
 * - Pas besoin de gérer des navigateurs headless (plus rapide)
 * - Fonctionne avec Cheerio (même parsing HTML)
 * - 1000 crédits gratuits pour tester
 * 
 * Alternative si ScrapingBee ne fonctionne pas:
 * - Playwright avec stealth plugins
 * - Puppeteer-extra-plugin-stealth
 * - ZenRows API (concurrent de ScrapingBee)
 */

import axios from 'axios';

const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY;
const SCRAPINGBEE_BASE_URL = 'https://app.scrapingbee.com/api/v1/';

export interface ScrapingBeeOptions {
  /** Activer le rendu JavaScript (plus lent mais nécessaire pour SPA) */
  render_js?: boolean;
  /** Utiliser des proxies premium pour contourner Cloudflare */
  premium_proxy?: boolean;
  /** Code pays pour la géolocalisation de l'IP (ex: 'ci', 'fr', 'us') */
  country_code?: string;
  /** Timeout en millisecondes */
  timeout?: number;
}

/**
 * Scrape une URL via ScrapingBee API
 * Retourne le HTML brut pour être parsé par Cheerio
 */
export async function scrapeWithScrapingBee(
  url: string,
  options: ScrapingBeeOptions = {}
): Promise<string> {
  if (!SCRAPINGBEE_API_KEY) {
    throw new Error('SCRAPINGBEE_API_KEY non configuré dans les variables d\'environnement');
  }

  const {
    render_js = false,
    premium_proxy = true,
    country_code = 'ci',
    timeout = 30000
  } = options;

  try {
    const response = await axios.get(SCRAPINGBEE_BASE_URL, {
      params: {
        api_key: SCRAPINGBEE_API_KEY,
        url: url,
        render_js,
        premium_proxy,
        country_code,
      },
      timeout,
      // ScrapingBee retourne du HTML brut
      responseType: 'text',
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`ScrapingBee error: ${error.response?.status} - ${error.response?.data || error.message}`);
    }
    throw error;
  }
}

/**
 * Vérifie si ScrapingBee est configuré et disponible
 */
export function isScrapingBeeConfigured(): boolean {
  return !!SCRAPINGBEE_API_KEY;
}

/**
 * Teste la connexion ScrapingBee avec une URL simple
 */
export async function testScrapingBeeConnection(): Promise<boolean> {
  if (!isScrapingBeeConfigured()) {
    return false;
  }

  try {
    await scrapeWithScrapingBee('https://httpbin.org/ip', { premium_proxy: false });
    return true;
  } catch {
    return false;
  }
}
