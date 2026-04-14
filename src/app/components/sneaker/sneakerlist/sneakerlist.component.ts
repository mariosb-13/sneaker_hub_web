import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SneakerService } from '../../../services/sneaker.service';
import { Sneaker } from '../../../models/sneaker.model';
import { SneakerresumeComponent } from '../sneakerresume/sneakerresume.component';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-sneakerlist',
  standalone: true,
  imports: [CommonModule, SneakerresumeComponent, RouterModule],
  templateUrl: './sneakerlist.component.html',
  styleUrl: './sneakerlist.component.scss'
})
export class SneakerlistComponent implements OnInit {
  private sneakerService = inject(SneakerService);
  private route = inject(ActivatedRoute);

  allSneakers: Sneaker[] = [];
  sneakers: Sneaker[] = [];
  categoryTitle: string = '';
  currentCategory: string = '';

  availableBrands: string[] = [];
  availableModels: string[] = [];

  // Filtros seleccionados
  selectedBrands: string[] = [];
  selectedModels: string[] = [];
  selectedGenders: string[] = [];
  selectedSizes: string[] = [];
  currentMaxPrice: number = 1000;
  currentSort: string = 'featured';

  ngOnInit(): void {
    combineLatest([this.route.params, this.route.queryParams]).subscribe(([params, queryParams]) => {
      this.currentCategory = params['category']?.toLowerCase() || 'all';
      const searchTerm = queryParams['q']?.toLowerCase();

      this.updateTitle(this.currentCategory, searchTerm);
      this.loadSneakers(this.currentCategory, searchTerm);
    });
  }

  updateTitle(cat: string, searchTerm: string | undefined) {
    if (searchTerm) this.categoryTitle = `Resultados para "${searchTerm}"`;
    else if (cat === 'all') this.categoryTitle = 'Catálogo Completo';
    else if (cat === 'hombre') this.categoryTitle = 'Hombre';
    else if (cat === 'mujer') this.categoryTitle = 'Mujer';
    else if (cat === 'tendencias') this.categoryTitle = 'Tendencias';
    else this.categoryTitle = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ');
  }

  loadSneakers(category: string, searchTerm: string | undefined) {
    this.sneakerService.getSneakers().subscribe(list => {
      // Definimos el set de datos base según la ruta
      if (category === 'all') {
        this.allSneakers = list;
      } else if (category === 'hombre') {
        this.allSneakers = list.filter(s => s.gender === 'Man');
      } else if (category === 'mujer') {
        this.allSneakers = list.filter(s => s.gender === 'Woman');
      } else if (category === 'tendencias') {
        this.allSneakers = list.filter(s => s.isTrending === true);
      } else {
        this.allSneakers = list.filter(s => s.brand.toLowerCase().replace(/\s+/g, '-') === category);
      }

      if (searchTerm) {
        this.allSneakers = this.allSneakers.filter(s =>
          s.name.toLowerCase().includes(searchTerm) ||
          s.brand.toLowerCase().includes(searchTerm) ||
          s.model.toLowerCase().includes(searchTerm)
        );
      }

      const brands = this.allSneakers.map(s => s.brand).filter(Boolean);
      this.availableBrands = [...new Set(brands)].sort();

      this.updateAvailableModels();
      this.applyFilters();
    });
  }

  updateAvailableModels() {
    let sneakersParaModelos = this.allSneakers;
    if (this.selectedBrands.length > 0) {
      sneakersParaModelos = this.allSneakers.filter(s => this.selectedBrands.includes(s.brand));
    }
    const models = sneakersParaModelos.map(s => s.model).filter(Boolean);
    this.availableModels = [...new Set(models)].sort();
    this.selectedModels = this.selectedModels.filter(m => this.availableModels.includes(m));
  }

  toggleGender(gender: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) this.selectedGenders.push(gender);
    else this.selectedGenders = this.selectedGenders.filter(g => g !== gender);
    this.applyFilters();
  }

  toggleBrand(brand: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) this.selectedBrands.push(brand);
    else this.selectedBrands = this.selectedBrands.filter(b => b !== brand);
    this.updateAvailableModels();
    this.applyFilters();
  }

  toggleModel(model: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) this.selectedModels.push(model);
    else this.selectedModels = this.selectedModels.filter(m => m !== model);
    this.applyFilters();
  }

  toggleSize(size: string) {
    if (this.selectedSizes.includes(size)) this.selectedSizes = this.selectedSizes.filter(s => s !== size);
    else this.selectedSizes.push(size);
    this.applyFilters();
  }

  updatePrice(event: Event) {
    this.currentMaxPrice = parseInt((event.target as HTMLInputElement).value, 10);
    this.applyFilters();
  }

  onSortChange(event: Event) {
    this.currentSort = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.allSneakers.filter(s => {
      const matchGender = this.selectedGenders.length === 0 || this.selectedGenders.includes(s.gender);
      const matchBrand = this.selectedBrands.length === 0 || this.selectedBrands.includes(s.brand);
      const matchModel = this.selectedModels.length === 0 || this.selectedModels.includes(s.model);
      const matchSize = this.selectedSizes.length === 0 || this.selectedSizes.some(sz => {
        if (!s.sizes) return false;
        const sizeKey = sz.replace('.', '_');
        return s.sizes[sizeKey] !== undefined && s.sizes[sizeKey] > 0;
      });
      const matchPrice = s.price <= this.currentMaxPrice;

      return matchGender && matchBrand && matchModel && matchSize && matchPrice;
    });

    if (this.currentSort === 'priceAsc') filtered.sort((a, b) => a.price - b.price);
    else if (this.currentSort === 'priceDesc') filtered.sort((a, b) => b.price - a.price);
    else if (this.currentSort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

    this.sneakers = filtered;
  }
}