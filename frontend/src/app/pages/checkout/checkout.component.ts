import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_stock: number;
  quantity: number;
}

interface CheckoutResponse {
  order_id: string;
  order_number: string;
  status: string;
  total: number;
}

interface PaymentResponse {
  success: boolean;
  transaction_id: string;
  message: string;
}

type Step = 'review' | 'payment' | 'processing' | 'success';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <a routerLink="/carrito" class="text-2xl font-bold text-blue-600">←</a>
              <span class="text-lg font-semibold text-gray-900">Checkout</span>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (step === 'review') {
          <!-- STEP 1: Review Order & Shipping -->
          <div class="space-y-6">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h2>
              <div class="divide-y">
                @for (item of items; track item.id) {
                  <div class="flex items-center gap-4 py-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span class="text-xl">📦</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-gray-900 truncate">{{ item.product_name }}</p>
                      <p class="text-sm text-gray-500">{{ item.quantity }} x S/ {{ item.product_price.toFixed(2) }}</p>
                    </div>
                    <p class="font-semibold text-gray-900">S/ {{ (item.product_price * item.quantity).toFixed(2) }}</p>
                  </div>
                }
              </div>
              <div class="border-t pt-4 mt-2 flex justify-between">
                <span class="font-semibold text-gray-900">Total</span>
                <span class="font-bold text-2xl text-blue-600">S/ {{ total.toFixed(2) }}</span>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Dirección de Envío</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                  <input type="text" [(ngModel)]="address" name="address" required
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Av. Principal 123, Lima" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input type="text" [(ngModel)]="city" name="city"
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Lima" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                    <input type="text" [(ngModel)]="phone" name="phone" required
                      class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="987654321" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                  <textarea [(ngModel)]="notes" name="notes" rows="2"
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Indicaciones para el delivery"></textarea>
                </div>
              </div>
            </div>

            @if (error) {
              <div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{{ error }}</div>
            }

            <button (click)="proceedToPayment()" [disabled]="loading"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              @if (loading) {
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Procesando...
              } @else {
                Continuar al pago — S/ {{ total.toFixed(2) }}
              }
            </button>
          </div>
        }

        @if (step === 'payment') {
          <!-- STEP 2: Payment Form -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Información de Pago</h2>

            <div class="mb-6 p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-800">
                <strong>💳 Simulación de pago</strong> — Ingresa cualquier tarjeta de prueba para continuar.
              </p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Número de tarjeta</label>
                <input type="text" [(ngModel)]="cardNumber" name="cardNumber" maxlength="19"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="4111 1111 1111 1111" (input)="formatCardNumber($event)" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                  <input type="text" [(ngModel)]="expiry" name="expiry" maxlength="5"
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="MM/AA" (input)="formatExpiry($event)" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input type="text" [(ngModel)]="cvv" name="cvv" maxlength="4"
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="123" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Titular</label>
                <input type="text" [(ngModel)]="cardHolder" name="cardHolder"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Juan Pérez" />
              </div>
            </div>

            @if (paymentError) {
              <div class="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{{ paymentError }}</div>
            }

            <button (click)="processPayment()" [disabled]="loadingPayment"
              class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              @if (loadingPayment) {
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Procesando pago...
              } @else {
                Pagar S/ {{ total.toFixed(2) }}
              }
            </button>
          </div>
        }

        @if (step === 'processing') {
          <!-- STEP 3: Processing Animation -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div class="mb-8">
              <div class="w-24 h-24 mx-auto relative">
                <!-- Spinner -->
                <svg class="animate-spin w-full h-full text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </div>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Procesando pago</h2>
            <p class="text-gray-500">Por favor espera, estamos procesando tu pago...</p>
            <div class="mt-6 w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
              <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" [style.width.%]="progress"></div>
            </div>
            <p class="text-xs text-gray-400 mt-2">No cierres esta página</p>
          </div>
        }

        @if (step === 'success') {
          <!-- STEP 4: Success -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <!-- Success checkmark animation -->
            <div class="mb-8">
              <div class="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso! 🎉</h2>
            <p class="text-gray-500 mb-2">Tu pedido <strong>{{ orderNumber }}</strong> ha sido registrado.</p>
            <p class="text-sm text-gray-400 mb-8">Recibirás notificaciones sobre el estado de tu pedido.</p>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <a routerLink="/pedidos"
                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                Ver mis pedidos
              </a>
              <a routerLink="/productos"
                class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition">
                Seguir comprando
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class CheckoutComponent implements OnInit {
  items: CartItem[] = [];
  total = 0;

  // Shipping
  address = '';
  city = '';
  phone = '';
  notes = '';

  // Payment
  cardNumber = '';
  expiry = '';
  cvv = '';
  cardHolder = '';

  // State
  step: Step = 'review';
  loading = false;
  error = '';
  paymentError = '';
  loadingPayment = false;

  // Processing
  progress = 0;
  orderId = '';
  orderNumber = '';
  transactionId = '';

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
        if (items.length === 0) {
          this.router.navigate(['/carrito']);
          return;
        }
        this.items = items;
        this.total = items.reduce((sum, i) => sum + i.product_price * i.quantity, 0);
      },
      error: () => {
        this.router.navigate(['/carrito']);
      }
    });
  }

  proceedToPayment(): void {
    if (!this.address.trim()) {
      this.error = 'Ingresa una dirección de envío';
      return;
    }
    if (!this.phone.trim()) {
      this.error = 'Ingresa un número de teléfono';
      return;
    }

    this.loading = true;
    this.error = '';

    // Create order via checkout endpoint
    this.api.post<CheckoutResponse>('/checkout', {
      shipping_address: this.address,
      shipping_city: this.city,
      shipping_phone: this.phone,
      notes: this.notes || undefined,
    }).subscribe({
      next: (res) => {
        this.orderId = res.order_id;
        this.orderNumber = res.order_number;
        this.loading = false;
        this.step = 'payment';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Error al crear el pedido. Intenta de nuevo.';
      }
    });
  }

  processPayment(): void {
    if (!this.cardNumber.trim() || !this.expiry.trim() || !this.cvv.trim()) {
      this.paymentError = 'Completa todos los datos de la tarjeta';
      return;
    }

    this.loadingPayment = true;
    this.paymentError = '';
    this.step = 'processing';

    // Simulate payment progress bar (3 seconds)
    const duration = 3000;
    const interval = 50;
    const step = interval / duration * 100;
    let progress = 0;

    const timer = setInterval(() => {
      progress += step;
      this.progress = Math.min(progress, 90);
    }, interval);

    // Call payment simulation API
    this.api.post<PaymentResponse>('/checkout/payment/simulate', {
      card_number: this.cardNumber.replace(/\s/g, ''),
      expiry: this.expiry,
      cvv: this.cvv,
      amount: this.total,
      card_holder: this.cardHolder || 'Cliente',
    }).subscribe({
      next: (res) => {
        this.transactionId = res.transaction_id;

        // Finish progress bar
        clearInterval(timer);
        this.progress = 100;

        setTimeout(() => {
          this.loadingPayment = false;
          this.step = 'success';
        }, 500);
      },
      error: (err) => {
        clearInterval(timer);
        this.loadingPayment = false;
        this.paymentError = err.error?.detail || 'Error al procesar el pago. Intenta de nuevo.';
        this.step = 'payment';
      }
    });
  }

  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    this.cardNumber = value.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  formatExpiry(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      this.expiry = value.slice(0, 2) + '/' + value.slice(2);
    } else {
      this.expiry = value;
    }
  }
}
