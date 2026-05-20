import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  tracking_status: string;
  status_history: string[];
  created_at: string;
  items?: OrderItem[];
  shipping_address?: string;
  shipping_city?: string;
  payment_method?: string;
  transaction_id?: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <a routerLink="/dashboard" class="text-2xl font-bold text-blue-600">←</a>
              <span class="text-lg font-semibold text-gray-900">Mis Pedidos</span>
            </div>
            <a routerLink="/productos" class="text-sm text-blue-600 hover:text-blue-800 font-medium">Nuevo pedido</a>
          </div>
        </div>
      </nav>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading) {
          <div class="text-center py-12">
            <svg class="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p class="text-gray-500 mt-4">Cargando pedidos...</p>
          </div>
        } @else if (orders.length === 0) {
          <div class="text-center py-16">
            <span class="text-6xl">📋</span>
            <h2 class="text-xl font-semibold text-gray-900 mt-4">No tienes pedidos aún</h2>
            <p class="text-gray-500 mt-2">Empieza explorando nuestro catálogo</p>
            <a routerLink="/productos" class="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
              Ver catálogo
            </a>
          </div>
        } @else {
          <!-- List of orders -->
          <div class="space-y-4">
            @for (order of orders; track order.id) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition" (click)="toggleOrder(order.id)">
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p class="font-semibold text-gray-900">{{ order.order_number }}</p>
                      <p class="text-sm text-gray-500">{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                    </div>
                    <div class="flex items-center gap-4">
                      <span class="font-bold text-lg text-blue-600">S/ {{ order.total.toFixed(2) }}</span>
                      <span class="px-3 py-1 rounded-full text-xs font-medium"
                        [class.bg-blue-100]="order.tracking_status === 'pending'"
                        [class.text-blue-800]="order.tracking_status === 'pending'"
                        [class.bg-yellow-100]="order.tracking_status === 'confirmed' || order.tracking_status === 'preparing'"
                        [class.text-yellow-800]="order.tracking_status === 'confirmed' || order.tracking_status === 'preparing'"
                        [class.bg-orange-100]="order.tracking_status === 'shipped'"
                        [class.text-orange-800]="order.tracking_status === 'shipped'"
                        [class.bg-green-100]="order.tracking_status === 'delivered'"
                        [class.text-green-800]="order.tracking_status === 'delivered'">
                        {{ statusLabel(order.tracking_status) }}
                      </span>
                      <svg class="w-5 h-5 text-gray-400 transition-transform" [class.rotate-180]="expandedOrder === order.id"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Expanded detail with tracking timeline -->
                @if (expandedOrder === order.id) {
                  <div class="border-t border-gray-200">
                    <div class="p-4 sm:p-6">
                      <!-- Tracking Timeline -->
                      <div class="mb-6">
                        <h3 class="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Estado del pedido</h3>
                        <div class="relative">
                          <!-- Timeline line -->
                          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                          @for (step of trackingSteps; track step.key) {
                            <div class="relative flex items-start gap-4 pb-6 last:pb-0">
                              <!-- Circle -->
                              <div class="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                                [class.bg-blue-600]="isStepActive(step.key)"
                                [class.bg-gray-200]="!isStepActive(step.key)">
                                @if (isStepActive(step.key)) {
                                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                } @else {
                                  <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
                                }
                              </div>
                              <!-- Content -->
                              <div class="flex-1 min-w-0 pt-1">
                                <p class="font-medium text-sm"
                                  [class.text-blue-700]="isStepActive(step.key)"
                                  [class.text-gray-400]="!isStepActive(step.key)">
                                  {{ step.label }}
                                </p>
                                <p class="text-xs text-gray-400 mt-0.5">{{ step.description }}</p>
                              </div>
                            </div>
                          }
                        </div>
                      </div>

                      <!-- Order Items -->
                      @if (order.items && order.items.length > 0) {
                        <div>
                          <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Productos</h3>
                          <div class="divide-y">
                            @for (item of order.items; track item.product_id) {
                              <div class="flex items-center justify-between py-2">
                                <div class="flex items-center gap-3">
                                  <span class="text-lg">📦</span>
                                  <div>
                                    <p class="text-sm font-medium text-gray-900">{{ item.product_name }}</p>
                                    <p class="text-xs text-gray-500">{{ item.quantity }} x S/ {{ item.unit_price.toFixed(2) }}</p>
                                  </div>
                                </div>
                                <p class="text-sm font-semibold text-gray-900">S/ {{ (item.quantity * item.unit_price).toFixed(2) }}</p>
                              </div>
                            }
                          </div>
                          <div class="border-t flex justify-between pt-3 mt-2">
                            <span class="font-semibold text-gray-900">Total</span>
                            <span class="font-bold text-blue-600">S/ {{ order.total.toFixed(2) }}</span>
                          </div>
                        </div>
                      }

                      <!-- Shipping Info -->
                      @if (order.shipping_address) {
                        <div class="mt-4 pt-4 border-t">
                          <h3 class="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Envío</h3>
                          <p class="text-sm text-gray-600">{{ order.shipping_address }}{{ order.shipping_city ? ', ' + order.shipping_city : '' }}</p>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  expandedOrder: string | null = null;

  trackingSteps = [
    { key: 'pending', label: 'Pendiente', description: 'Pedido registrado, esperando confirmación' },
    { key: 'confirmed', label: 'Confirmado', description: 'Pedido confirmado, preparando productos' },
    { key: 'preparing', label: 'En preparación', description: 'Empacando tus productos' },
    { key: 'shipped', label: 'En camino', description: 'El pedido está en ruta de entrega' },
    { key: 'delivered', label: 'Entregado', description: '¡Pedido entregado con éxito!' },
  ];

  statusMap: Record<string, string> = {
    'pending': 'Pendiente',
    'confirmed': 'Confirmado',
    'preparing': 'Preparando',
    'shipped': 'En camino',
    'delivered': 'Entregado',
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.api.get<Order[]>('/orders').subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  toggleOrder(id: string): void {
    this.expandedOrder = this.expandedOrder === id ? null : id;
    // Load full order details including items
    if (this.expandedOrder === id) {
      const order = this.orders.find(o => o.id === id);
      if (order && !order.items) {
        this.api.get<Order>(`/orders/${id}`).subscribe({
          next: (fullOrder) => {
            const idx = this.orders.findIndex(o => o.id === id);
            if (idx >= 0) {
              this.orders[idx] = fullOrder;
            }
          }
        });
      }
    }
  }

  isStepActive(stepKey: string): boolean {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
    const currentIdx = statusOrder.indexOf(this.expandedOrder 
      ? this.orders.find(o => o.id === this.expandedOrder)?.tracking_status || 'pending' 
      : 'pending');
    const stepIdx = statusOrder.indexOf(stepKey);
    return stepIdx <= currentIdx;
  }

  statusLabel(status: string): string {
    return this.statusMap[status] || status;
  }
}
