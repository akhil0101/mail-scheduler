// Fetch live gold and silver prices from GoldAPI.io

interface MetalPrices {
  gold: { inr: number; usd: number };
  silver: { inr: number; usd: number };
  timestamp: string;
}

// GoldAPI.io response type
interface GoldApiResponse {
  price_gram_24k: number;
  price_gram_22k?: number;
  price_gram_21k?: number;
  price_gram_18k?: number;
  price?: number;
  price_gram?: number;
}

// Cache prices for 1 hour to avoid too many API calls (free tier has 300 requests/month)
let cachedPrices: MetalPrices | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fetch live prices from GoldAPI.io
export const fetchMetalPrices = async (): Promise<MetalPrices> => {
  // Return cached if still valid
  if (cachedPrices && Date.now() - lastFetch < CACHE_DURATION) {
    console.log('Using cached metal prices');
    return cachedPrices;
  }

  const apiKey = process.env.GOLD_API_KEY;
  
  if (!apiKey) {
    console.log('No GOLD_API_KEY found, using fallback prices');
    return getFallbackPrices();
  }

  try {
    console.log('Fetching live metal prices from GoldAPI.io...');
    
    // Fetch gold and silver prices in INR
    const [goldRes, silverRes] = await Promise.all([
      fetch('https://www.goldapi.io/api/XAU/INR', {
        headers: { 'x-access-token': apiKey },
      }),
      fetch('https://www.goldapi.io/api/XAG/INR', {
        headers: { 'x-access-token': apiKey },
      }),
    ]);

    if (!goldRes.ok || !silverRes.ok) {
      throw new Error('API request failed');
    }

    const goldData = await goldRes.json() as GoldApiResponse;
    const silverData = await silverRes.json() as GoldApiResponse;

    // GoldAPI returns price_gram_24k for both gold and silver
    const goldPerGramINR = goldData.price_gram_24k;
    const silverPerGramINR = silverData.price_gram_24k;
    
    // Approximate USD conversion
    const usdToInr = 83.5;

    cachedPrices = {
      gold: {
        inr: Math.round(goldPerGramINR * 100) / 100,
        usd: Math.round((goldPerGramINR / usdToInr) * 100) / 100,
      },
      silver: {
        inr: Math.round(silverPerGramINR * 100) / 100,
        usd: Math.round((silverPerGramINR / usdToInr) * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    };

    lastFetch = Date.now();
    console.log('✅ Live metal prices fetched:', cachedPrices);
    return cachedPrices;
  } catch (error) {
    console.error('Error fetching metal prices:', error);
    return getFallbackPrices();
  }
};

// Fallback prices if API fails
const getFallbackPrices = (): MetalPrices => {
  return {
    gold: { usd: 85.20, inr: 7114 },
    silver: { usd: 1.00, inr: 84 },
    timestamp: new Date().toISOString(),
  };
};

// Alternative: Fetch from GoldAPI.io (requires free API key)
export const fetchMetalPricesWithKey = async (apiKey: string): Promise<MetalPrices> => {
  if (cachedPrices && Date.now() - lastFetch < CACHE_DURATION) {
    return cachedPrices;
  }

  try {
    const [goldRes, silverRes] = await Promise.all([
      fetch('https://www.goldapi.io/api/XAU/INR', {
        headers: { 'x-access-token': apiKey },
      }),
      fetch('https://www.goldapi.io/api/XAG/INR', {
        headers: { 'x-access-token': apiKey },
      }),
    ]);

    const goldData = await goldRes.json() as GoldApiResponse;
    const silverData = await silverRes.json() as GoldApiResponse;

    cachedPrices = {
      gold: {
        usd: Math.round((goldData.price_gram_24k / 83.5) * 100) / 100,
        inr: Math.round(goldData.price_gram_24k * 100) / 100,
      },
      silver: {
        usd: Math.round((silverData.price_gram_24k / 83.5) * 100) / 100,
        inr: Math.round(silverData.price_gram_24k * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    };

    lastFetch = Date.now();
    return cachedPrices;
  } catch (error) {
    console.error('Error fetching metal prices:', error);
    return {
      gold: { usd: 85.20, inr: 7114 },
      silver: { usd: 1.00, inr: 83.50 },
      timestamp: new Date().toISOString(),
    };
  }
};

// Format price for display
export const formatPrice = (price: number, currency: 'INR' | 'USD' = 'INR'): string => {
  if (currency === 'INR') {
    return `₹${price.toLocaleString('en-IN')}`;
  }
  return `$${price.toFixed(2)}`;
};

// Get formatted metal prices HTML
export const getMetalPricesHtml = async (): Promise<string> => {
  const prices = await fetchMetalPrices();
  
  // Gold for 10 grams, Silver for 1kg (1000 grams)
  const gold10g = Math.round(prices.gold.inr * 10);
  const silver1kg = Math.round(prices.silver.inr * 1000);
  
  return `
    <div style="background: #f8f9fa; padding: 30px; margin: 0;">
      <h3 style="color: #1a1a2e; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 20px 0; text-align: center;">Live Market Prices</h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="50%" style="padding: 8px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 25px 20px; text-align: center;">
              <div style="color: #f39c12; font-size: 28px; margin-bottom: 8px;">🥇</div>
              <div style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Gold 24K</div>
              <div style="color: #fff; font-size: 22px; font-weight: 700; margin: 8px 0 4px;">${formatPrice(gold10g)}</div>
              <div style="color: #666; font-size: 10px;">per 10 grams</div>
            </div>
          </td>
          <td width="50%" style="padding: 8px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 25px 20px; text-align: center;">
              <div style="color: #c0c0c0; font-size: 28px; margin-bottom: 8px;">🥈</div>
              <div style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Silver</div>
              <div style="color: #fff; font-size: 22px; font-weight: 700; margin: 8px 0 4px;">${formatPrice(silver1kg)}</div>
              <div style="color: #666; font-size: 10px;">per 1 kg</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
};
