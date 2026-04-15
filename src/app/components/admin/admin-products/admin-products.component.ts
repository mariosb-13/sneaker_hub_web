import { Component, OnInit, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SneakerService } from '../../../services/sneaker.service';
import { Sneaker } from '../../../models/sneaker.model';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss'
})
export class AdminProductsComponent implements OnInit {
  private sneakerService = inject(SneakerService);
  private storage = inject(Storage);
  private injector = inject(EnvironmentInjector);
  
  allProductos: Sneaker[] = [];
  productosFiltrados: Sneaker[] = [];
  marcasDB: any[] = [];
  cargando: boolean = true;
  isUploading: boolean = false;
  isEditing: boolean = false;

  tallasDisponibles: string[] = ['38', '39', '40', '41', '42', '43', '44', '45'];

  filtroTexto: string = '';
  filtroMarca: string = '';
  filtroPrecioMax: number = 1000;

  selectedSneaker: any = this.initSneaker();
  
  newBrand: any = this.initBrand();
  isEditingBrand: boolean = false;

  ngOnInit(): void {
    this.cargarDatos();
  }

  initBrand() {
    return { name: '', icon: '', iconHeight: '20px' };
  }

  ordenarTallas() {
    this.tallasDisponibles.sort((a, b) => {
      const numA = parseFloat(a.replace('_', '.'));
      const numB = parseFloat(b.replace('_', '.'));
      return numA - numB;
    });
  }

  cargarDatos() {
    this.sneakerService.getSneakers().subscribe(zapatillas => {
      this.allProductos = zapatillas;
      zapatillas.forEach(s => {
        if (s.sizes) {
          Object.keys(s.sizes).forEach(t => {
            if (!this.tallasDisponibles.includes(t)) this.tallasDisponibles.push(t);
          });
        }
      });
      this.ordenarTallas();
      this.aplicarFiltros();
      this.cargando = false;
    });

    this.sneakerService.getBrands().subscribe(brands => {
      this.marcasDB = brands;
    });
  }

  // --- GESTIÓN DE TENDENCIAS ---
  async toggleTrending(sneaker: Sneaker) {
    const nuevoEstado = !sneaker.isTrending;
    runInInjectionContext(this.injector, async () => {
      try {
        await this.sneakerService.updateSneaker(sneaker.id!, { isTrending: nuevoEstado });
        sneaker.isTrending = nuevoEstado;
      } catch (error) { console.error(error); }
    });
  }

  // --- GESTIÓN DE TALLAS ---
  agregarNuevaTalla() {
    const talla = prompt("Nueva talla (ej: 36 o 42_5):");
    if (talla && !this.tallasDisponibles.includes(talla)) {
      this.tallasDisponibles.push(talla);
      this.ordenarTallas();
      if (!this.selectedSneaker.sizes) this.selectedSneaker.sizes = {};
      this.selectedSneaker.sizes[talla] = 0;
    }
  }

  // --- MULTIMEDIA STORAGE ---
  private getFolderName(name: string): string {
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  }

  async uploadSinglePhoto(event: any) {
    const file = event.target.files[0];
    if (!file || !this.selectedSneaker.name) return;
    this.isUploading = true;
    const folderName = this.getFolderName(this.selectedSneaker.name);
    await runInInjectionContext(this.injector, async () => {
      try {
        const fileRef = ref(this.storage, `${folderName}/${file.name}`);
        await uploadBytes(fileRef, file);
        this.selectedSneaker.imageUrl = await getDownloadURL(fileRef);
        this.selectedSneaker.images360 = [];
      } finally { this.isUploading = false; }
    });
  }

  async upload360Batch(event: any) {
    const files = Array.from(event.target.files as FileList);
    if (files.length === 0 || !this.selectedSneaker.name) return;
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    this.isUploading = true;
    const folderName = this.getFolderName(this.selectedSneaker.name);
    const tempUrls: string[] = [];
    await runInInjectionContext(this.injector, async () => {
      try {
        for (const file of files) {
          const fileRef = ref(this.storage, `${folderName}/${file.name}`);
          await uploadBytes(fileRef, file);
          tempUrls.push(await getDownloadURL(fileRef));
        }
        this.selectedSneaker.images360 = tempUrls;
        if (tempUrls.length > 0) this.selectedSneaker.imageUrl = tempUrls[0];
      } finally { this.isUploading = false; }
    });
  }

  // --- GESTIÓN DE MARCAS ---
  seleccionarMarcaParaEditar(marca: any) {
    this.isEditingBrand = true;
    this.newBrand = { ...marca };
  }

  cancelarEdicionMarca() {
    this.isEditingBrand = false;
    this.newBrand = this.initBrand();
  }

  async uploadBrandLogo(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.isUploading = true;
    await runInInjectionContext(this.injector, async () => {
      try {
        const fileRef = ref(this.storage, `brand_logos/${file.name}`);
        await uploadBytes(fileRef, file);
        this.newBrand.icon = await getDownloadURL(fileRef);
      } finally { this.isUploading = false; }
    });
  }

  async guardarMarca() {
    if (!this.newBrand.name || !this.newBrand.icon) return;
    try {
      await this.sneakerService.addBrand(this.newBrand);
      alert(this.isEditingBrand ? 'Marca actualizada' : 'Marca creada');
      this.cancelarEdicionMarca();
    } catch (error) { console.error(error); }
  }

  // --- CRUD SNEAKERS ---
  async guardarZapatilla() {
    if (!this.selectedSneaker.name) return;
    runInInjectionContext(this.injector, async () => {
      try {
        if (this.isEditing) await this.sneakerService.updateSneaker(this.selectedSneaker.id, this.selectedSneaker);
        else await this.sneakerService.addSneaker(this.selectedSneaker);
        alert('Guardado con éxito');
        this.cargarDatos();
      } catch (error) { console.error(error); }
    });
  }

  async eliminarZapatilla(id: string) {
    if (confirm('¿Eliminar producto?')) {
      await this.sneakerService.deleteSneaker(id);
      this.cargarDatos();
    }
  }

  initSneaker() {
    // Al crear una nueva, le ponemos un 0 a TODAS las tallas disponibles actualmente
    const baseSizes: any = {};
    this.tallasDisponibles.forEach(sz => baseSizes[sz] = 0);

    return { 
      name: '', brand: '', model: '', price: 0, gender: 'Man', 
      imageUrl: '', isTrending: false, images360: [], 
      sizes: baseSizes 
    };
  }

  abrirModalNuevo() { 
    this.isEditing = false; 
    this.selectedSneaker = this.initSneaker(); 
  }

  abrirModalEditar(s: Sneaker) { 
    this.isEditing = true; 
    this.selectedSneaker = JSON.parse(JSON.stringify(s)); 
    
    // Si la zapatilla no tiene objeto de tallas, lo creamos
    if (!this.selectedSneaker.sizes) {
      this.selectedSneaker.sizes = {};
    }

    // Si a esta zapatilla le falta alguna, le plantamos un 0.
    this.tallasDisponibles.forEach(sz => {
      if (this.selectedSneaker.sizes[sz] === undefined || this.selectedSneaker.sizes[sz] === null) {
        this.selectedSneaker.sizes[sz] = 0;
      }
    });
  }

  aplicarFiltros() {
    this.productosFiltrados = this.allProductos.filter(s => {
      const cumpleTexto = !this.filtroTexto || s.name.toLowerCase().includes(this.filtroTexto.toLowerCase()) || (s.model && s.model.toLowerCase().includes(this.filtroTexto.toLowerCase()));
      const cumpleMarca = !this.filtroMarca || s.brand === this.filtroMarca;
      return cumpleTexto && cumpleMarca && s.price <= this.filtroPrecioMax;
    });
  }

  limpiarFiltros() { this.filtroTexto = ''; this.filtroMarca = ''; this.aplicarFiltros(); }
  trackByIndex(index: number) { return index; }
}