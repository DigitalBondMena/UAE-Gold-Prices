import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = environment.apiUrl;

  // 🔹 Global API State Signals
  loading = signal(false);
  error = signal<string | null>(null);

  // 🔹 App Info Signal
  apiInfo = signal({
    baseUrl: this.baseUrl,
    appName: environment.appName,
    version: environment.version,
    isProduction: environment.production
  });

  // =======================
  // 🔹 Generic GET - Returns Observable with TransferState support
  // =======================
  get<T>(endpoint: string): Observable<T> {
    const stateKey = makeStateKey<T>(`api-${endpoint}`);
    
    // Check if data exists from SSR (TransferState)
    if (this.transferState.hasKey(stateKey)) {
      const cachedData = this.transferState.get<T>(stateKey, null as T);
      this.transferState.remove(stateKey); // Clean up after use
      return of(cachedData);
    }

    this.loading.set(true);
    this.error.set(null);

    return this.http.get<T>(`${this.baseUrl}${endpoint}`).pipe(
      tap((response) => {
        this.loading.set(false);
        // Store in TransferState during SSR for client hydration
        if (isPlatformServer(this.platformId) && response) {
          this.transferState.set(stateKey, response);
        }
      }),
      catchError((err) => {
        this.error.set(err.message ?? 'Error');
        this.loading.set(false);
        return of(null as T);
      }),
      shareReplay(1)
    );
  }

  // =======================
  // 🔹 Generic GET - Returns Signal (Legacy support)
  // =======================
  getSignal<T>(endpoint: string) {
    const data = signal<T | null>(null);
    const stateKey = makeStateKey<T>(`api-signal-${endpoint}`);

    // Check if data exists from SSR (TransferState)
    if (this.transferState.hasKey(stateKey)) {
      const cachedData = this.transferState.get<T>(stateKey, null as T);
      this.transferState.remove(stateKey);
      data.set(cachedData);
      return data;
    }

    this.loading.set(true);
    this.error.set(null);

    this.http.get<T>(`${this.baseUrl}${endpoint}`).pipe(
      catchError((err) => {
        this.error.set(err.message ?? 'Error');
        this.loading.set(false);
        return of(null);
      })
    ).subscribe({
      next: (res) => {
        data.set(res);
        this.loading.set(false);
        // Store in TransferState during SSR
        if (isPlatformServer(this.platformId) && res) {
          this.transferState.set(stateKey, res);
        }
      },
      error: (err) => {
        this.error.set(err.message ?? 'Error');
        this.loading.set(false);
      }
    });

    return data;
  }

  // =======================
  // 🔹 POST - Returns Observable
  // =======================
  post<T>(endpoint: string, body: unknown): Observable<T> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body).pipe(
      tap(() => this.loading.set(false)),
      catchError((err) => {
        this.error.set(err.message ?? 'Error');
        this.loading.set(false);
        return of(null as T);
      }),
      shareReplay(1)
    );
  }

  // =======================
  patch<T>(endpoint: string, body: unknown): Observable<T> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body).pipe(
      tap(() => this.loading.set(false)),
      catchError((err) => {
        this.error.set(err.message ?? 'Error');
        this.loading.set(false);
        return of(null as T);
      }),
      shareReplay(1)
    );
  }

  // =======================
  put<T>(endpoint: string, body: unknown): Observable<T> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body).pipe(
      tap(() => this.loading.set(false)),
      catchError((err) => {
        this.error.set(err.message ?? 'Error');
        this.loading.set(false);
        return of(null as T);
      }),
      shareReplay(1)
    );
  }

  // =======================
  delete<T>(endpoint: string): Observable<T> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<T>(`${this.baseUrl}${endpoint}`).pipe(
      tap(() => this.loading.set(false)),
      catchError((err) => {
        this.error.set(err.message ?? 'Error');
        this.loading.set(false);
        return of(null as T);
      }),
      shareReplay(1)
    );
  }
  
}
