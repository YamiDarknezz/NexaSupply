import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Registrar mi bodega</h1>
          <p class="text-gray-500 mt-2">Comienza a vender más con NexaSupply</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la bodega *</label>
              <input type="text" [(ngModel)]="storeName" name="storeName" required
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Mi Bodega" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del dueño *</label>
              <input type="text" [(ngModel)]="ownerName" name="ownerName" required
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Juan Pérez" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" [(ngModel)]="email" name="email" required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="tu@email.com" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
            <input type="password" [(ngModel)]="password" name="password" required
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Mínimo 6 caracteres" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">RUC</label>
              <input type="text" [(ngModel)]="ruc" name="ruc"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="10456789012" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="text" [(ngModel)]="phone" name="phone"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="987654321" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input type="text" [(ngModel)]="address" name="address"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Av. Principal 123" />
          </div>

          @if (error) {
            <div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {{ error }}
            </div>
          }

          <button type="submit" [disabled]="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            @if (loading) {
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Creando cuenta...
            } @else {
              Crear mi cuenta
            }
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?
          <a routerLink="/login" class="text-blue-600 hover:text-blue-800 font-medium">Inicia sesión</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class RegisterComponent {
  storeName = '';
  ownerName = '';
  email = '';
  password = '';
  ruc = '';
  phone = '';
  address = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.storeName || !this.ownerName || !this.email || !this.password) {
      this.error = 'Completa los campos obligatorios (*)';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register({
      store_name: this.storeName,
      owner_name: this.ownerName,
      email: this.email,
      password: this.password,
      store_ruc: this.ruc || undefined,
      store_phone: this.phone || undefined,
      store_address: this.address || undefined,
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Error al registrar. Intenta de nuevo.';
      }
    });
  }
}
