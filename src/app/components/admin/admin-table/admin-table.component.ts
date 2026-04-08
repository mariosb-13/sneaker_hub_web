import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  field: string;
  header: string;
  type?: 'text' | 'badge' | 'avatar' | 'price'; // Para saber cómo pintarlo
}

@Component({
  selector: 'app-admin-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-table.component.html',
  styleUrl: './admin-table.component.scss'
})
export class AdminTableComponent implements OnChanges {
  // Entradas de datos desde el componente padre
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() searchPlaceholder: string = 'Buscar...';
  
  // Salida de eventos (cuando hacen clic en un botón)
  @Output() onAction = new EventEmitter<{ actionName: string, row: any }>();

  filteredData: any[] = [];
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Se ejecuta cuando el padre le manda datos nuevos
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.applyFilters();
    }
  }

  // BUSCADOR Y ORDENACIÓN GENÉRICA
  applyFilters() {
    let temp = [...this.data];

    // Buscador genérico: busca el texto en TODAS las columnas
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      temp = temp.filter(item => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(term)
        );
      });
    }

    // Ordenación
    if (this.sortColumn) {
      temp.sort((a, b) => {
        const valA = String(a[this.sortColumn] || '').toLowerCase();
        const valB = String(b[this.sortColumn] || '').toLowerCase();
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredData = temp;
  }

  sortBy(columnField: string) {
    if (this.sortColumn === columnField) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnField;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // Emitir evento al padre
  triggerAction(actionName: string, row: any) {
    this.onAction.emit({ actionName, row });
  }
}