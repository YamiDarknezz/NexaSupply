import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  stock: number;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private api: ApiService) {}

  list(category?: string, search?: string): Observable<Product[]> {
    let params = '';
    if (category) params += `category=${encodeURIComponent(category)}`;
    if (search) params += (params ? '&' : '') + `search=${encodeURIComponent(search)}`;
    return this.api.get<Product[]>(`/products/${params ? '?' + params : ''}`);
  }

  get(id: string): Observable<Product> {
    return this.api.get<Product>(`/products/${id}`);
  }

  categories(): Observable<string[]> {
    return this.api.get<string[]>('/products/categories');
  }
}
