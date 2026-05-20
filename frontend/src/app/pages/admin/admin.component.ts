import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface AdminStore {
  id: string;
  name: string;
  owner_name: string;
  email: string;
  plan: string;
  subscription_status: string;
  created_at: string;
}

interface AdminOrder {
  id: string;
  order_number: string;
  store_name?: string;
  total: number;
  tracking_status: string;
  created_at: string;
}

type View = 'login' | 'dashboard' | 'orders' | 'stores';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="min-h-screen bg-gray-900">
      @if (view === 'login') {
        <!-- Admin Login -->
        <div class="min-h-screen flex items-center justify-center p-4">
          <div class="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8">
            <div class="text-center mb-8">
              <span class="text-4xl">⚙️</span>
              <h1 class="text-2xl font-bold text-white mt-4">Panel Administrativo</h1>
              <p class="text-gray-400 mt-2">NexaSupply Admin</p>
            </div>

            <form (ngSubmit)="adminLogin()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input type="email" [(ngModel)]="email" name="email" required
                  class="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="admin@nexasupply.store" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
                <input type="password" [(ngModel)]="password" name="password" required
                  class="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••" />
              </div>

              @if (error) {
                <div class="bg-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm">{{ error }}</div>
              }

              <button type="submit" [disabled]="loading"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50">
                {{ loading ? 'Ingresando...' : 'Ingresar' }}
              </button>
            </form>

            <p class="text-center text-sm text-gray-500 mt-6">
              Demo: admin@nexasupply.store / admin123
            </p>

            <a routerLink="/" class="block text-center text-sm text-blue-400 hover:text-blue-300 mt-4">← Volver al inicio</a>
          </div>
        </div>
      }

      @if (view === 'dashboard') {
        <!-- Admin Dashboard -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Header -->
          <div class="flex items-center justify-between mb-8">
            <div>
              <h1 class="text-2xl font-bold text-white">Panel de Administración</h1>
              <p class="text-gray-400">Gestiona bodegas, pedidos y productos</p>
            </div>
            <div class="flex items-center gap-4">
              <button (click)="view = 'orders'" class="text-sm text-blue-400 hover:text-blue-300">Pedidos</button>
              <button (click)="view = 'stores'" class="text-sm text-blue-400 hover:text-blue-300">Bodegas</button>
              <button (click)="logout()" class="text-sm text-red-400 hover:text-red-300">Cerrar sesión</button>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-gray-800 rounded-xl p-6">
              <p class="text-sm text-gray-400">Bodegas</p>
              <p class="text-3xl font-bold text-white mt-1">{{ stores.length }}</p>
            </div>
            <div class="bg-gray-800 rounded-xl p-6">
              <p class="text-sm text-gray-400">Pedidos Totales</p>
              <p class="text-3xl font-bold text-white mt-1">{{ orders.length }}</p>
            </div>
            <div class="bg-gray-800 rounded-xl p-6">
              <p class="text-sm text-gray-400">Ingresos Totales</p>
              <p class="text-3xl font-bold text-emerald-400 mt-1">S/ {{ totalRevenue.toFixed(2) }}</p>
            </div>
            <div class="bg-gray-800 rounded-xl p-6">
              <p class="text-sm text-gray-400">Pedidos Pendientes</p>
              <p class="text-3xl font-bold text-yellow-400 mt-1">{{ pendingOrders }}</p>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button (click)="view = 'orders'"
              class="bg-gray-800 rounded-xl p-6 text-left hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500">
              <span class="text-2xl">📋</span>
              <h3 class="text-lg font-semibold text-white mt-2">Gestionar Pedidos</h3>
              <p class="text-sm text-gray-400">Ver y actualizar estado de pedidos</p>
            </button>
            <button (click)="view = 'stores'"
              class="bg-gray-800 rounded-xl p-6 text-left hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500">
              <span class="text-2xl">🏪</span>
              <h3 class="text-lg font-semibold text-white mt-2">Bodegas</h3>
              <p class="text-sm text-gray-400">Ver bodegas registradas</p>
            </button>
          </div>

          <!-- Recent Orders Table -->
          <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-700">
              <h2 class="text-lg font-semibold text-white">Pedidos Recientes</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-400 border-b border-gray-700">
                    <th class="px-6 py-3 font-medium">N° Pedido</th>
                    <th class="px-6 py-3 font-medium">Bodega</th>
                    <th class="px-6 py-3 font-medium">Total</th>
                    <th class="px-6 py-3 font-medium">Estado</th>
                    <th class="px-6 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of orders.slice(0, 10); track order.id) {
                    <tr class="border-b border-gray-700 last:border-0 hover:bg-gray-750">
                      <td class="px-6 py-4 font-medium text-blue-400">{{ order.order_number }}</td>
                      <td class="px-6 py-4 text-gray-300">{{ order.store_name || '—' }}</td>
                      <td class="px-6 py-4 text-gray-300">S/ {{ order.total.toFixed(2) }}</td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-full text-xs font-medium"
                          [class.bg-blue-900]="order.tracking_status === 'pending'"
                          [class.text-blue-300]="order.tracking_status === 'pending'"
                          [class.bg-yellow-900]="order.tracking_status === 'confirmed'"
                          [class.text-yellow-300]="order.tracking_status === 'confirmed'"
                          [class.bg-green-900]="order.tracking_status === 'delivered'"
                          [class.text-green-300]="order.tracking_status === 'delivered'">
                          {{ order.tracking_status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-gray-400">{{ order.created_at | date:'dd/MM/yyyy' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      @if (view === 'orders') {
        <!-- Admin Orders Management -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <button (click)="view = 'dashboard'" class="text-blue-400 hover:text-blue-300 text-sm">← Volver al panel</button>
              <h1 class="text-2xl font-bold text-white mt-2">Gestión de Pedidos</h1>
            </div>
          </div>

          <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-400 border-b border-gray-700 bg-gray-850">
                    <th class="px-6 py-3 font-medium">N° Pedido</th>
                    <th class="px-6 py-3 font-medium">Bodega</th>
                    <th class="px-6 py-3 font-medium">Total</th>
                    <th class="px-6 py-3 font-medium">Estado</th>
                    <th class="px-6 py-3 font-medium">Fecha</th>
                    <th class="px-6 py-3 font-medium text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of orders; track order.id) {
                    <tr class="border-b border-gray-700 last:border-0 hover:bg-gray-750">
                      <td class="px-6 py-4 font-medium text-blue-400">{{ order.order_number }}</td>
                      <td class="px-6 py-4 text-gray-300">{{ order.store_name || '—' }}</td>
                      <td class="px-6 py-4 text-gray-300">S/ {{ order.total.toFixed(2) }}</td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-full text-xs font-medium"
                          [class.bg-blue-900]="order.tracking_status === 'pending'"
                          [class.text-blue-300]="order.tracking_status === 'pending'"
                          [class.bg-yellow-900]="order.tracking_status === 'confirmed'"
                          [class.text-yellow-300]="order.tracking_status === 'confirmed'"
                          [class.bg-orange-900]="order.tracking_status === 'shipped'"
                          [class.text-orange-300]="order.tracking_status === 'shipped'"
                          [class.bg-green-900]="order.tracking_status === 'delivered'"
                          [class.text-green-300]="order.tracking_status === 'delivered'">
                          {{ order.tracking_status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-gray-400">{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td class="px-6 py-4 text-center">
                        @if (order.tracking_status !== 'delivered') {
                          <button (click)="advanceOrder(order)"
                            class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
                            Avanzar
                          </button>
                        } @else {
                          <span class="text-xs text-gray-500">Completado</span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">No hay pedidos registrados</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      @if (view === 'stores') {
        <!-- Admin Stores View -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <button (click)="view = 'dashboard'" class="text-blue-400 hover:text-blue-300 text-sm">← Volver al panel</button>
              <h1 class="text-2xl font-bold text-white mt-2">Bodegas Registradas</h1>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (store of stores; track store.id) {
              <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div class="flex items-center justify-between mb-4">
                  <span class="text-2xl">🏪</span>
                  <span class="px-2 py-1 rounded-full text-xs font-medium"
                    [class.bg-green-900]="store.subscription_status === 'active'"
                    [class.text-green-300]="store.subscription_status === 'active'"
                    [class.bg-red-900]="store.subscription_status !== 'active'"
                    [class.text-red-300]="store.subscription_status !== 'active'">
                    {{ store.subscription_status }}
                  </span>
                </div>
                <h3 class="text-lg font-semibold text-white">{{ store.name }}</h3>
                <p class="text-sm text-gray-400 mt-1">{{ store.owner_name }}</p>
                <div class="mt-4 space-y-1 text-sm text-gray-400">
                  <p>📧 {{ store.email }}</p>
                  <p>📋 Plan: {{ store.plan }}</p>
                  <p>📅 {{ store.created_at | date:'dd/MM/yyyy' }}</p>
                </div>
              </div>
            } @empty {
              <div class="col-span-full text-center py-12">
                <p class="text-gray-500">No hay bodegas registradas</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .bg-gray-850 { background-color: rgb(26, 32, 44); }
    .hover\\:bg-gray-750:hover { background-color: rgb(47, 55, 70); }
  `]
})
export class AdminComponent implements OnInit {
  view: View = 'login';

  // Login
  email = '';
  password = '';
  loading = false;
  error = '';

  // Data
  stores: AdminStore[] = [];
  orders: AdminOrder[] = [];

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if already logged in as admin
    const token = localStorage.getItem('nexa_admin_token');
    if (token) {
      this.loadData();
    }
  }

  get totalRevenue(): number {
    return this.orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }

  get pendingOrders(): number {
    return this.orders.filter(o => o.tracking_status !== 'delivered').length;
  }

  adminLogin(): void {
    if (!this.email || !this.password) {
      this.error = 'Ingresa email y contraseña';
      return;
    }

    this.loading = true;
    this.error = '';

    this.api.post<any>('/admin/login', { email: this.email, password: this.password }).subscribe({
      next: (res) => {
        localStorage.setItem('nexa_admin_token', res.access_token);
        this.loading = false;
        this.loadData();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Credenciales inválidas';
      }
    });
  }

  loadData(): void {
    this.view = 'dashboard';

    // Load stores
    this.api.get<AdminStore[]>('/admin/stores').subscribe({
      next: (data) => this.stores = data,
    });

    // Load orders
    this.api.get<AdminOrder[]>('/admin/orders').subscribe({
      next: (data) => this.orders = data,
    });
  }

  advanceOrder(order: AdminOrder): void {
    this.api.post<any>(`/admin/orders/${order.id}/advance`, {}).subscribe({
      next: () => {
        // Refresh orders
        this.api.get<AdminOrder[]>('/admin/orders').subscribe({
          next: (data) => this.orders = data,
        });
      },
      error: (err) => {
        alert(err.error?.detail || 'Error al avanzar el pedido');
      }
    });
  }

  logout(): void {
    localStorage.removeItem('nexa_admin_token');
    this.view = 'login';
    this.email = '';
    this.password = '';
  }
}
