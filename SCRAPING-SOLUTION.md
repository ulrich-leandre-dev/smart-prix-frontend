# 🕷️ Solution Scraping SmartPrix

## Problème Résolu

**Avant**: Placeholders simulés (fausses données)  
**Après**: Vraies données Jumia CI via ScrapingBee API

---

## 🚀 Mise en place (5 minutes)

### 1. Créer un compte ScrapingBee
- **URL**: https://www.scrapingbee.com/
- **Tarif**: 1000 crédits gratuits, puis $49/mois pour 100k requêtes
- Pas de carte requise pour le test

### 2. Récupérer la clé API
Dashboard → API Keys → Copier la clé

### 3. Configurer Vercel
```bash
# Dans les settings du projet Vercel:
SCRAPINGBEE_API_KEY=votre_cle_ici
```

### 4. Déployer
```bash
git add .
git commit -m "feat: scraping Jumia CI avec ScrapingBee"
git push
```

---

## 📊 Architecture

```
Recherche utilisateur
    ↓
scraper.ts → scrapeProducts()
    ↓
scrapeJumia()
    ↓
┌─────────────────────────────────────┐
│  Étape 1: Axios direct (gratuit)    │
│  → Succès ? Retourner données       │
│  → Échec ? Continuer                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Étape 2: ScrapingBee API (payant)  │
│  Proxy rotatif + Premium pour       │
│  contourner Cloudflare              │
└─────────────────────────────────────┘
    ↓
Vrais articles Jumia CI
```

---

## 💰 Coût estimé

| Usage | Requêtes/mois | Coût |
|-------|--------------|------|
| Test/Demo | < 1000 | **Gratuit** |
| MVP (100 users/jour) | ~3000 | Gratuit (1000) + ~$1.50 |
| Scale (1000 users/jour) | ~30k | ~$15/mois |
| Production (10k users/jour) | ~300k | ~$50/mois |

---

## 🔧 Alternatives explorées

| Solution | Avantage | Inconvénient | Recommandation |
|----------|----------|--------------|----------------|
| **ScrapingBee** ✅ | Simple, fiable, pas de maintenance | Payant | **UTILISER CELLE-CI** |
| Playwright | Gratuit, contrôle total | Complexe, lent, détectable | Si budget très serré |
| Puppeteer + Stealth | Gratuit | Même problèmes que Playwright | Non recommandé |
| ZenRows | Similaire à ScrapingBee | Moins connu | Alternative viable |
| API Officielle Jumia | Légal, stable | **N'existe pas** | ❌ Impossible |
| Scrappingo | Proxy gratuit | Limité, peu fiable | Non recommandé |

---

## 📝 Fichiers créés/modifiés

```
src/lib/
├── scraper.ts              # ✅ MODIFIÉ - Intègre ScrapingBee
├── scraper-v2.ts           # ✅ CRÉÉ - Version complète avec fallback
├── scrapingbee-client.ts   # ✅ CRÉÉ - Client API ScrapingBee
└── ...

.env.example               # ✅ CRÉÉ - Template des variables
SCRAPING-SOLUTION.md       # ✅ CRÉÉ - Ce fichier
```

---

## 🧪 Test rapide

```bash
# Clé API requise
export SCRAPINGBEE_API_KEY=your_key_here

# Lancer le dev server
npm run dev

# Tester une recherche
curl "http://localhost:3000/api/search?q=samsung+s25"
```

---

## 🎯 Pourquoi ScrapingBee gagne

1. **Proxies rotatifs premium** → Contourne Cloudflare 99% du temps
2. **Pas de headless browser** → 10x plus rapide que Playwright
3. **Compatible Cheerio** → Même code de parsing
4. **Support pays** → IPs depuis Côte d'Ivoire disponibles
5. **Pricing transparent** → Paye uniquement ce que tu utilises

---

## 🚨 Si ScrapingBee ne fonctionne pas

1. Vérifier la clé API dans Vercel Dashboard
2. Tester manuellement: `curl "https://app.scrapingbee.com/api/v1/?api_key=VOTRE_CLE&url=https://www.jumia.ci/catalog/?q=phone"`
3. Contacter support@scrapingbee.com (réponse sous 24h)

---

## 📞 Contact

SmartPrix est en production sur: https://smart-prix-ulrich.loca.lt

Développé par Ulrich avec ❤️
