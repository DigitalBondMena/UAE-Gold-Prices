import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { API_END_POINTS } from '../../core/constant/ApiEndPoints';
import { ApiService } from '../../core/services/api-service';
import { HeroSection } from '../../shared/components/hero-section/hero-section';
import { SectionTitle } from '../../shared/components/section-title/section-title';

interface Metal {
  code: string;
  name: string;
}

interface Karat {
  name: string;
  value: number;
}

interface Currency {
  name: string;
  code: string;
  flag: string;
}

// API Response interfaces matching actual API structure
interface MetalsApiResponse {
  success: boolean;
  data: Record<string, string>;
}

interface GoldApiResponse {
  success: boolean;
  data: number[];
}

interface CurrencyApiResponse {
  success: boolean;
  currencies: Record<string, string>; // { "USD": "الدولار الأمريكي", ... }
}

@Component({
  selector: 'app-metals-calculator',
  imports: [HeroSection, SectionTitle, FormsModule, Select],
  templateUrl: './metals-calculator.html',
  styleUrl: './metals-calculator.css',
})
export class MetalsCalculator implements OnInit {
  private readonly apiService = inject(ApiService);

  // Loading states
  isLoadingMetals = signal(true);
  isLoadingGold = signal(true);
  isLoadingCurrencies = signal(true);

  // API Data Signals
  metals = signal<Metal[]>([]);
  karats = signal<Karat[]>([]);
  currencies = signal<Currency[]>([]);



  // Form values - using objects for PrimeNG Select
  selectedMetal: Metal | null = null;
  selectedKarat: Karat | null = null;
  selectedCurrency: Currency | null = null;
  weight: number | null = null;

  // Result signals
  result = signal<number | null>(null);
  showResult = signal<boolean>(false);

  // Metal name mapping for Arabic display
  private metalNamesAr: Record<string, string> = {
    gold: 'ذهب',
    silver: 'فضة',
    platinum: 'بلاتين',
    palladium: 'بالاديوم',
  };

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
    this.fetchMetalsList();
    this.fetchGoldList();
    this.fetchCurrencyList();
  }

  private fetchMetalsList(): void {
    this.apiService.get<MetalsApiResponse>(API_END_POINTS.METALS_LIST).subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          const metalsArray: Metal[] = Object.entries(response.data).map(([key, value]) => ({
            code: key,
            name: this.metalNamesAr[key] ?? value,
          }));
          this.metals.set(metalsArray);
        }
        this.isLoadingMetals.set(false);
      },
      error: () => {
        this.isLoadingMetals.set(false);
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
        this.isLoadingGold.set(false);
      },
      error: () => {
        this.isLoadingGold.set(false);
      },
    });
  }

  private fetchCurrencyList(): void {
    this.apiService.get<CurrencyApiResponse>(API_END_POINTS.CURRENCY_COUNTRY_LIST).subscribe({
      next: (response) => {
        if (response?.success && response.currencies) {
          // Transform { "USD": "الدولار الأمريكي" } to [{ code: "USD", name: "الدولار الأمريكي", flag: "us" }]
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

  calculatePrice(): void {
    if (!this.selectedMetal || !this.selectedKarat || !this.selectedCurrency || !this.weight) {
      return;
    }

    const basePricePerGram = 295.5;
    const karatMultiplier = this.selectedKarat.value / 24;
    const calculatedPrice = this.weight * basePricePerGram * karatMultiplier;

    this.result.set(calculatedPrice);
    this.showResult.set(true);
  }

  formatPrice(price: number): string {
    // Format without commas, just plain number with 2 decimal places
    return price.toFixed(2);
  }

  resetForm(): void {
    this.selectedMetal = null;
    this.selectedKarat = null;
    const defaultCurrency = this.currencies().find((c) => c.code === 'AED') ?? this.currencies()[0];
    this.selectedCurrency = defaultCurrency ?? null;
    this.weight = null;
    this.result.set(null);
    this.showResult.set(false);
  }
}
