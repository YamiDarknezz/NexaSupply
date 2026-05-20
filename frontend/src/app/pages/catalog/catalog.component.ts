import { Component, OnInit, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
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
              <a routerLink="/dashboard" class="text-2xl font-bold text-blue-600">◆</a>
              <span class="text-lg font-semibold text-gray-900">Catálogo</span>
            </div>
            <div class="flex items-center gap-4">
              <a routerLink="/carrito" class="relative text-gray-600 hover:text-blue-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                </svg>
                @if (cartCount > 0) {
                  <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{{ cartCount }}</span>
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
              <div class="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <span class="text-6xl">{{ getProductEmoji(product.category) }}</span>
              </div>
              <div class="p-4">
                <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{{ product.category }}</span>
                <h3 class="text-lg font-semibold text-gray-900 mt-2">{{ product.name }}</h3>
                <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ product.description }}</p>
                <div class="flex items-center justify-between mt-4">
                  <span class="text-xl font-bold text-gray-900">S/ {{ product.price.toFixed(2) }}</span>
                  <span class="text-xs text-gray-400">Stock: {{ product.stock }}</span>
                </div>
                <button (click)="addToCart(product)"
                  [disabled]="product.stock === 0"
                  class="mt-3 w-full py-2 px-4 rounded-lg font-medium text-sm transition
                    {{ product.stock > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed' }}">
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
    </div>

    <!-- Toast notification -->
    @if (toastVisible) {
      <div class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
        {{ toastMessage }}
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class CatalogComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  search = '';
  selectedCategory = '';
  cartCount = 0;
  toastVisible = false;
  toastMessage = '';

  private apiBase = 'http://192.168.100.70:8000/api';

  constructor(private zone: NgZone) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCartCount();
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

  private async apiPost<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${this.apiBase}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async loadProducts(): Promise<void> {
    try {
      const res = await fetch(`${this.apiBase}/products`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
        },
      });
      const products: Product[] = await res.json();
      this.zone.run(() => {
        this.products = products;
        this.categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];
        this.filterProducts();
      });
      console.log('Products loaded:', products.length);
    } catch (e) {
      console.error('Error loading products:', e);
    }
  }

  filterProducts(): void {
    let filtered = this.products;
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }
    if (this.search) {
      const q = this.search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }
    this.filteredProducts = filtered;
  }

  async addToCart(product: Product): Promise<void> {
    try {
      await this.apiPost<any>('/cart/add', { product_id: product.id, quantity: 1 });
      this.cartCount++;
      this.showToast(`${product.name} agregado al carrito`);
    } catch (e) {
      this.showToast('Error al agregar al carrito');
    }
  }

  async loadCartCount(): Promise<void> {
    try {
      const items: any[] = await this.apiGet<any[]>('/cart');
      this.cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
    } catch (e) {
      // silent
    }
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3000);
  }

  getProductEmoji(category: string): string {
    const map: Record<string, string> = {
      'Bebidas': '🥤', 'Snacks': '🍪', 'Lácteos': '🥛', 'Abarrotes': '📦',
      'Limpieza': '🧹', 'Estacional': '🎄', 'Testing': '🧪',
    };
    return map[category] || '📦';
  }
}
