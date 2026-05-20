import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div class="mb-6">
          <div class="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado! 🎉</h1>
        <p class="text-gray-500 mb-2">Tu pedido <strong>{{ orderNumber }}</strong> ha sido registrado exitosamente.</p>
        <p class="text-sm text-gray-400 mb-8">Recibirás notificaciones sobre el estado de tu pedido.</p>

        <div class="flex flex-col gap-3">
          <a routerLink="/pedidos" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition">
            Ver mis pedidos
          </a>
          <a routerLink="/productos" class="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition">
            Seguir comprando
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class OrderConfirmationComponent implements OnInit {
  orderNumber = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Get order number from query params or just show generic success
    const urlParams = new URLSearchParams(window.location.search);
    this.orderNumber = urlParams.get('order') || '—';
  }
}
