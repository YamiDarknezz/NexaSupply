import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_stock: number;
  quantity: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <a routerLink="/productos" class="text-2xl font-bold text-blue-600">←</a>
              <span class="text-lg font-semibold text-gray-900">Carrito</span>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (items.length === 0) {
          <div class="text-center py-16">
            <span class="text-6xl">🛒</span>
            <h2 class="text-xl font-semibold text-gray-900 mt-4">Tu carrito está vacío</h2>
            <p class="text-gray-500 mt-2">Agrega productos desde el catálogo</p>
            <a routerLink="/productos" class="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
              Ver catálogo
            </a>
          </div>
        } @else {
          <div class="space-y-4">
            @for (item of items; track item.id) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span class="text-2xl">📦</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 truncate">{{ item.product_name }}</h3>
                  <p class="text-sm text-gray-500">S/ {{ item.product_price.toFixed(2) }} c/u</p>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="updateQuantity(item, item.quantity - 1)"
                    class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                    [disabled]="item.quantity <= 1">
                    <span class="text-lg font-medium">−</span>
                  </button>
                  <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
                  <button (click)="updateQuantity(item, item.quantity + 1)"
                    class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                    [disabled]="item.quantity >= item.product_stock">
                    <span class="text-lg font-medium">+</span>
                  </button>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900">S/ {{ (item.product_price * item.quantity).toFixed(2) }}</p>
                  <button (click)="removeItem(item)" class="text-xs text-red-600 hover:text-red-800 mt-1">Eliminar</button>
                </div>
              </div>
            }
          </div>

          <!-- Summary -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <div class="flex justify-between text-lg">
              <span class="font-semibold text-gray-900">Total</span>
              <span class="font-bold text-2xl text-blue-600">S/ {{ total.toFixed(2) }}</span>
            </div>
            <button (click)="checkout()"
              class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition">
              Ir a pagar
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  total = 0;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.api.get<CartItem[]>('/cart').subscribe({
      next: (items) => {
        this.items = items;
        this.total = items.reduce((sum, i) => sum + i.product_price * i.quantity, 0);
      },
    });
  }

  updateQuantity(item: CartItem, newQty: number): void {
    if (newQty < 1 || newQty > item.product_stock) return;
    this.api.post<any>('/cart/update', { item_id: item.id, quantity: newQty }).subscribe({
      next: () => this.loadCart(),
    });
  }

  removeItem(item: CartItem): void {
    this.api.delete<any>(`/cart/${item.id}`).subscribe({
      next: () => this.loadCart(),
    });
  }

  checkout(): void {
    this.router.navigate(['/checkout']);
  }
}
