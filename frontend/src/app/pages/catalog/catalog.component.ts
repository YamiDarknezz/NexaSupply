import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
  images?: { id: string; url: string; alt_text?: string; sort_order: number }[];
  variants?: { id: string; name: string; price_modifier: number; stock: number }[];
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <a routerLink="/dashboard" class="text-2xl font-bold text-blue-600">NexaSupply</a>
              <span class="text-lg font-semibold text-gray-900">Catálogo</span>
            </div>
            <div class="flex items-center gap-4">
              <a routerLink="/carrito" class="relative text-gray-600 hover:text-blue-600 p-3 -m-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                </svg>
                @if (cartCount > 0) {
                  <span class="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{{ cartCount }}</span>
                }
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <div class="flex-1">
            <input type="text" [(ngModel)]="search" (input)="filterProducts()"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Buscar productos..." />
          </div>
          <div class="w-full sm:w-48">
            <select [(ngModel)]="selectedCategory" (change)="filterProducts()"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
              <option value="">Todas las categorías</option>
              @for (cat of categories; track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (product of filteredProducts; track product.id) {
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group">
              <a [routerLink]="'/producto/' + product.id" class="block">
                <div class="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden">
                  @if (product.images && product.images.length > 0) {
                    <img [src]="product.images[0].url" [alt]="product.name"
                      class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                  } @else {
                    <span class="text-6xl">{{ getProductEmoji(product.category) }}</span>
                  }
                </div>
                <div class="p-4 pb-2">
                  <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{{ product.category }}</span>
                  <h3 class="text-lg font-semibold text-gray-900 mt-2">{{ product.name }}</h3>
                  <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ product.description }}</p>
                  <div class="flex items-center justify-between mt-4">
                    <span class="text-xl font-bold text-gray-900">S/ {{ product.price.toFixed(2) }}</span>
                    <span class="text-xs text-gray-400">Stock: {{ product.stock }}</span>
                  </div>
                </div>
              </a>
              <div class="px-4 pb-3">
                <div class="flex items-center justify-center gap-2 mb-2">
                  <button (click)="setQty(product.id, (quantities[product.id] || 1) - 1, product.stock)"
                    class="w-11 h-11 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition text-lg">−</button>
                  <input type="number" [value]="quantities[product.id] || 1"
                    (change)="setQty(product.id, +$any($event).target.value, product.stock)"
                    class="w-14 h-11 text-center border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" min="1" [max]="product.stock" />
                  <button (click)="setQty(product.id, (quantities[product.id] || 1) + 1, product.stock)"
                    class="w-11 h-11 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition text-lg">+</button>
                </div>
                <button (click)="addToCart($event, product)"
                  [disabled]="product.stock === 0"
                  class="w-full py-3 px-4 rounded-lg font-medium text-sm transition"
                  [class.bg-blue-600]="product.stock > 0"
                  [class.text-white]="product.stock > 0"
                  [class.hover:bg-blue-700]="product.stock > 0"
                  [class.bg-gray-200]="product.stock === 0"
                  [class.text-gray-400]="product.stock === 0"
                  [class.cursor-not-allowed]="product.stock === 0">
                  {{ product.stock > 0 ? 'Agregar al carrito' : 'Agotado' }}
                </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-full text-center py-12">
              <p class="text-gray-500 text-lg">No se encontraron productos</p>
            </div>
          }
        </div>
      </div>

      @if (toastVisible) {
        <div class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {{ toastMessage }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class CatalogComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  search = '';
  selectedCategory = '';
  cartCount = 0;
  toastVisible = false;
  toastMessage = '';
  quantities: Record<string, number> = {};

  private apiBase = environment.apiBaseUrl;
  private cdr = inject(ChangeDetectorRef);

  private router = inject(Router);
  private routerSub?: Subscription;

  ngOnInit(): void {
    console.log('[Catalog] ngOnInit');
    this.loadProducts();
    this.loadCartCount();
    this.routerSub = this.router.events.subscribe((e) => {
      if (e.constructor.name === 'NavigationEnd') {
        console.log('[Catalog] navigation end');
        if (this.products.length === 0) {
          this.loadProducts();
          this.loadCartCount();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private getToken(): string {
    return localStorage.getItem('nexa_token') || '';
  }

  private async apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${this.apiBase}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
      },
    });
    return res.json();
  }

  async loadProducts(): Promise<void> {
    try {
      const res = await fetch(`${this.apiBase}/products/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
        },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const products: Product[] = await res.json();
      console.log('[Catalog] products loaded:', products.length);
      this.products = products;
      this.categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];
      this.filterProducts();
      this.cdr.detectChanges();
    } catch (e: any) {
      console.error('[Catalog] Error loading products:', e.message || e);
      this.showToast('Error al cargar productos');
    }
  }

  filterProducts(): void {
    console.log('[Catalog] filterProducts, products.length:', this.products.length);
    let filtered = this.products;
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }
    if (this.search) {
      const q = this.search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }
    this.filteredProducts = filtered;
    console.log('[Catalog] filterProducts -> filteredProducts:', this.filteredProducts.length);
    this.cdr.detectChanges();
  }

  async loadCartCount(): Promise<void> {
    try {
      const items: any[] = await this.apiGet<any[]>('/cart/');
      this.cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
      this.cdr.detectChanges();
    } catch { }
  }

  setQty(productId: string, qty: number, stock: number): void {
    this.quantities[productId] = Math.max(1, Math.min(qty, stock || qty));
  }

  async addToCart(event: MouseEvent, product: Product): Promise<void> {
    event.preventDefault();
    const token = this.getToken();
    if (!token) {
      this.showToast('Inicia sesion para agregar al carrito');
      return;
    }
    const qty = this.quantities[product.id] || 1;
    try {
      const res = await fetch(`${this.apiBase}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id, quantity: qty }),
      });
      if (!res.ok) throw new Error('Error');
      this.cartCount += qty;
      this.showToast(`${product.name} x${qty} agregado al carrito`);
    } catch {
      this.showToast('Error al agregar al carrito');
    }
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  getProductEmoji(category: string): string {
    const map: Record<string, string> = {
      'Bebidas': '🥤', 'Snacks': '🍪', 'Lácteos': '🥛', 'Abarrotes': '📦',
      'Limpieza': '🧹', 'Estacional': '🎄', 'Testing': '🧪',
    };
    return map[category] || '📦';
  }
}
