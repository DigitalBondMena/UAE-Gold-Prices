import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { ApiService } from '../../core/services/api-service';
import { HeroSection } from '../../shared/components/hero-section/hero-section';

const GOLD_CALC_STORAGE_KEY = 'gold_calculator_result';

interface Currency {
  name: string;
  code: string;
  flag: string;
}

interface Karat {
  name: string;
  value: number;
}

interface CurrencyApiResponse {
  success: boolean;
  currencies: Record<string, string>;
}

interface GoldApiResponse {
  success: boolean;
  data: number[];
}

interface PriceCalculatorResponse {
  success: boolean;
  data: {
    price: number;
    currency: string;
    metal: string;
    karat: number;
    weight: number;
  };
}

@Component({
  selector: 'app-gold-calculator',
  imports: [HeroSection, FormsModule, Select],
  templateUrl: './gold-calculator.html',
  styleUrl: './gold-calculator.css',
})
export class GoldCalculator implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly platformId = inject(PLATFORM_ID);

  // Loading states
  isLoadingCurrencies = signal(true);
  isLoadingKarats = signal(true);

  // API Data Signals
  currencies = signal<Currency[]>([]);
  karats = signal<Karat[]>([]);

  // Form values
  selectedCurrency: Currency | null = null;
  selectedKarat: Karat | null = null;
  weight: number | null = null;
  
  // Result signals
  result = signal<number | null>(null);
  showResult = signal<boolean>(false);
  isCalculating = signal(false);

  // Currency code to flag mapping (ISO 3166-1 alpha-2)
  private currencyFlagMap: Record<string, string> = {
    USD: 'us',
    EUR: 'eu',
    GBP: 'gb',
    JPY: 'jp',
    CHF: 'ch',
    CAD: 'ca',
    AUD: 'au',
    EGP: 'eg',
    SAR: 'sa',
    AED: 'ae',
    QAR: 'qa',
    KWD: 'kw',
    BHD: 'bh',
    OMR: 'om',
    JOD: 'jo',
    ILS: 'il',
    IQD: 'iq',
    LBP: 'lb',
    YER: 'ye',
    ZAR: 'za',
    MAD: 'ma',
    TND: 'tn',
    DZD: 'dz',
    SDG: 'sd',
    NGN: 'ng',
    KES: 'ke',
    CNY: 'cn',
    INR: 'in',
    PKR: 'pk',
    BDT: 'bd',
    KRW: 'kr',
    SGD: 'sg',
    HKD: 'hk',
    THB: 'th',
    MYR: 'my',
    IDR: 'id',
    SEK: 'se',
    NOK: 'no',
    DKK: 'dk',
    PLN: 'pl',
    CZK: 'cz',
    HUF: 'hu',
    UAH: 'ua',
    BRL: 'br',
    MXN: 'mx',
    ARS: 'ar',
    CLP: 'cl',
    COP: 'co',
    TRY: 'tr',
    SYP: 'sy',
  };

  ngOnInit(): void {
    this.fetchCurrencyList();
    this.fetchGoldList();
    this.loadSavedResult();
  }

  private fetchCurrencyList(): void {
    this.apiService.get<CurrencyApiResponse>(API_END_POINTS.CURRENCY_COUNTRY_LIST).subscribe({
      next: (response) => {
        if (response?.success && response.currencies) {
          const currenciesArray: Currency[] = Object.entries(response.currencies).map(([code, name]) => ({
            code,
            name,
            flag: this.currencyFlagMap[code] ?? '',
          }));
          this.currencies.set(currenciesArray);

          // Set default currency (AED or first available)
          const defaultCurrency = currenciesArray.find((c) => c.code === 'AED') ?? currenciesArray[0];
          if (defaultCurrency && !this.selectedCurrency) {
            this.selectedCurrency = defaultCurrency;
          }
        }
        this.isLoadingCurrencies.set(false);
      },
      error: () => {
        this.isLoadingCurrencies.set(false);
      },
    });
  }

  private fetchGoldList(): void {
    this.apiService.get<GoldApiResponse>(API_END_POINTS.GOLD_LIST).subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          const karatsArray: Karat[] = response.data
            .sort((a, b) => b - a)
            .map((value) => ({
              name: `${value} `,
              value: value,
            }));
          this.karats.set(karatsArray);
        }
        this.isLoadingKarats.set(false);
      },
      error: () => {
        this.isLoadingKarats.set(false);
      },
    });
  }

  calculatePrice(): void {
    if (!this.selectedKarat || !this.selectedCurrency || !this.weight) {
      return;
    }

    this.isCalculating.set(true);
    this.showResult.set(false);

    const queryParams = new URLSearchParams({
      metal: 'gold',
      karat: this.selectedKarat.value.toString(),
      currency: this.selectedCurrency.code,
      weight: this.weight.toString(),
    });

    const endpoint = `${API_END_POINTS.GOLD_PRICE_CALCULATOR}?${queryParams.toString()}`;

    this.apiService.get<PriceCalculatorResponse>(endpoint).subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          this.result.set(response.data.price);
          this.showResult.set(true);
          console.log(response.data);
          this.saveResultToStorage(response.data.price);
        }
        this.isCalculating.set(false);
      },
      error: () => {
        this.isCalculating.set(false);
      },
    });
  }

  resetCalculator(): void {
    this.result.set(null);
    this.showResult.set(false);
    this.clearStoredResult();
  }

  private loadSavedResult(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedData = localStorage.getItem(GOLD_CALC_STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.price && parsed.currencyCode && parsed.timestamp) {
            // Check if result is less than 24 hours old
            const hoursDiff = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
              this.result.set(parsed.price);
              this.showResult.set(true);
              // Restore currency selection after currencies are loaded
              this.selectedCurrency = { code: parsed.currencyCode, name: parsed.currencyName ?? '', flag: this.currencyFlagMap[parsed.currencyCode] ?? '' };
            } else {
              this.clearStoredResult();
            }
          }
        } catch {
          this.clearStoredResult();
        }
      }
    }
  }

  private saveResultToStorage(price: number): void {
    if (isPlatformBrowser(this.platformId) && this.selectedCurrency) {
      const dataToSave = {
        price,
        currencyCode: this.selectedCurrency.code,
        currencyName: this.selectedCurrency.name,
        timestamp: Date.now(),
      };
      localStorage.setItem(GOLD_CALC_STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }

  private clearStoredResult(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(GOLD_CALC_STORAGE_KEY);
    }
  }

  formatPrice(price: number): string {
    return price.toLocaleString('ar-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
