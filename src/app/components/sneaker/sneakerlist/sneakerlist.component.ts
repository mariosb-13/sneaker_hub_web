import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SneakerService } from '../../../services/sneaker.service';
import { Sneaker } from '../../../models/sneaker.model';
import { SneakerresumeComponent } from '../sneakerresume/sneakerresume.component';

@Component({
  selector: 'app-sneakerlist',
  standalone: true,
  imports: [CommonModule, SneakerresumeComponent],
  templateUrl: './sneakerlist.component.html',
  styleUrl: './sneakerlist.component.scss'
})
export class SneakerlistComponent implements OnInit {
  private sneakerService = inject(SneakerService);
  private route = inject(ActivatedRoute);

  allSneakers: Sneaker[] = []; 
  sneakers: Sneaker[] = [];    
  categoryTitle: string = '';

  availableModels: string[] = [];
  selectedModels: string[] = [];
  selectedSizes: string[] = [];
  currentMaxPrice: number = 1000;
  currentSort: string = 'featured';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const cat = params['category']?.toLowerCase();
      this.updateTitle(cat);
      this.loadSneakers(cat);
    });
  }

  updateTitle(cat: string | undefined) {
    if (!cat || cat === 'all') this.categoryTitle = 'Catálogo Completo';
    else if (cat === 'hombre') this.categoryTitle = 'Hombre';
    else if (cat === 'mujer') this.categoryTitle = 'Mujer';
    else this.categoryTitle = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ');
  }

  loadSneakers(category: string | undefined) {
    this.sneakerService.getSneakers().subscribe(list => {
      // Filtrado por URL
      if (!category || category === 'all') {
        this.allSneakers = list;
      } else if (category === 'hombre') {
        this.allSneakers = list.filter(s => s.gender === 'Man');
      } else if (category === 'mujer') {
        this.allSneakers = list.filter(s => s.gender === 'Woman');
      } else {
        this.allSneakers = list.filter(s => s.brand.toLowerCase().replace(/\s+/g, '-') === category);
      }

      // Modelos disponibles en esta categoría
      const models = this.allSneakers.map(s => s.model).filter(Boolean);
      this.availableModels = [...new Set(models)].sort();

      this.applyFilters();
    });
  }

  // Métodos de filtros
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
      const matchModel = this.selectedModels.length === 0 || this.selectedModels.includes(s.model);
      const matchSize = this.selectedSizes.length === 0 || this.selectedSizes.some(sz => s.sizes.includes(sz));
      const matchPrice = s.price <= this.currentMaxPrice;
      return matchModel && matchSize && matchPrice;
    });

    if (this.currentSort === 'priceAsc') filtered.sort((a, b) => a.price - b.price);
    else if (this.currentSort === 'priceDesc') filtered.sort((a, b) => b.price - a.price);
    else if (this.currentSort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

    this.sneakers = filtered;
  }
}