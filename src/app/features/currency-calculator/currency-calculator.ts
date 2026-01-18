import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { ApiService } from '../../core/services/api-service';
import { SeoService } from '../../core/services/seo.service';
import { HeroSection } from '../../shared/components/hero-section/hero-section';

const CURRENCY_CALC_STORAGE_KEY = 'currency_calculator_result';

interface Currency {
  name: string;
  code: string;
  flag: string;
}

interface CurrencyApiResponse {
  success: boolean;
  currencies: Record<string, string>;
}

interface ConversionResponse {
  success: boolean;
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
}

@Component({
  selector: 'app-currency-calculator',
  imports: [HeroSection, FormsModule, Select],
  templateUrl: './currency-calculator.html',
  styleUrl: './currency-calculator.css',
})
export class CurrencyCalculator implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly apiService = inject(ApiService);
  private readonly platformId = inject(PLATFORM_ID);

  // Loading states
  isLoadingCurrencies = signal(true);
  isConverting = signal(false);

  // API Data Signals
  currencies = signal<Currency[]>([]);

  // Form values
  fromCurrency: Currency | null = null;
  toCurrency: Currency | null = null;
  amount: number | null = 0;

  // Result signals
  convertedAmount = signal<number | null>(null);
  exchangeRate = signal<number | null>(null);
  showResult = signal<boolean>(false);

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
    this.setSeoTags();
    this.fetchCurrencyList();
    this.loadSavedResult();
  }

  private setSeoTags(): void {
    this.seoService.updateMetaTags({
      title: 'محول العملات',
      description: 'حول العملات بأسعار صرف محدثة يومياً. محول عملات دقيق يدعم الدرهم الإماراتي والدولار واليورو والريال والعملات العالمية الأخرى.',
      keywords: 'محول العملات, تحويل العملات, سعر الصرف, currency converter UAE, AED to USD, سعر الدولار, سعر الدرهم',
      canonicalUrl: `${this.seoService.getSiteUrl()}/currency-calculator`,
      ogType: 'website'
    });
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

          // Set default currencies (AED as from, USD as to)
          const aedCurrency = currenciesArray.find((c) => c.code === 'AED');
          const usdCurrency = currenciesArray.find((c) => c.code === 'USD');
          
          if (aedCurrency && !this.fromCurrency) {
            this.fromCurrency = aedCurrency;
          }
          if (usdCurrency && !this.toCurrency) {
            this.toCurrency = usdCurrency;
          }
        }
        this.isLoadingCurrencies.set(false);
      },
      error: () => {
        this.isLoadingCurrencies.set(false);
      },
    });
  }

  swapCurrencies(): void {
    const temp = this.fromCurrency;
    this.fromCurrency = this.toCurrency;
    this.toCurrency = temp;
  }

  convertCurrency(): void {
    if (!this.fromCurrency || !this.toCurrency || !this.amount) {
      return;
    }

    this.isConverting.set(true);

    const queryParams = new URLSearchParams({
      from: this.fromCurrency.code,
      to: this.toCurrency.code,
      amount: this.amount.toString(),
    });

    const endpoint = `${API_END_POINTS.CURRENCY_CONVERTER}?${queryParams.toString()}`;

    this.apiService.get<ConversionResponse>(endpoint).subscribe({
      next: (response) => {
        console.log('Currency Conversion Result:', response);
        if (response?.success) {
          this.convertedAmount.set(response.result);
          this.exchangeRate.set(response.rate);
          this.showResult.set(true);
          this.saveResultToStorage(response.result, response.rate);
        }
        this.isConverting.set(false);
      },
      error: (error) => {
        console.error('Currency Conversion Error:', error);
        this.isConverting.set(false);
      },
    });
  }

  resetCalculator(): void {
    this.convertedAmount.set(null);
    this.exchangeRate.set(null);
    this.showResult.set(false);
    this.clearStoredResult();
  }

  private loadSavedResult(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedData = localStorage.getItem(CURRENCY_CALC_STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log('Loaded saved currency result from localStorage:', parsed);
          if (parsed.result && parsed.timestamp) {
            // Check if result is less than 24 hours old
            const hoursDiff = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
              this.convertedAmount.set(parsed.result);
              this.exchangeRate.set(parsed.rate);
              this.showResult.set(true);
              this.amount = parsed.amount;
              // Restore currency selection
              if (parsed.fromCode && parsed.toCode) {
                this.fromCurrency = { 
                  code: parsed.fromCode, 
                  name: parsed.fromName ?? '', 
                  flag: this.currencyFlagMap[parsed.fromCode] ?? '' 
                };
                this.toCurrency = { 
                  code: parsed.toCode, 
                  name: parsed.toName ?? '', 
                  flag: this.currencyFlagMap[parsed.toCode] ?? '' 
                };
              }
            } else {
              console.log('Saved result expired, clearing...');
              this.clearStoredResult();
            }
          }
        } catch {
          this.clearStoredResult();
        }
      }
    }
  }

  private saveResultToStorage(result: number, rate: number): void {
    if (isPlatformBrowser(this.platformId) && this.fromCurrency && this.toCurrency) {
      const dataToSave = {
        result,
        rate,
        amount: this.amount,
        fromCode: this.fromCurrency.code,
        fromName: this.fromCurrency.name,
        toCode: this.toCurrency.code,
        toName: this.toCurrency.name,
        timestamp: Date.now(),
      };
      localStorage.setItem(CURRENCY_CALC_STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('Currency result saved to localStorage:', dataToSave);
    }
  }

  private clearStoredResult(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(CURRENCY_CALC_STORAGE_KEY);
      console.log('Currency result cleared from localStorage');
    }
  }

  formatAmount(value: number): string {
    return value.toLocaleString('ar-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getShortName(name: string): string {
    // Truncate long currency names
    return name.length > 20 ? name.substring(0, 17) + '...' : name;
  }
}
