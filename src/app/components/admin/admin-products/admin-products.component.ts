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
  isSaving: boolean = false;
  uploadMessage: string = '';

  filtroTexto: string = '';
  filtroMarca: string = '';
  filtroPrecioMax: number = 1000;

  selectedSneaker: any = this.initSneaker();
  
  newBrand: any = this.initBrand();
  isEditingBrand: boolean = false;

  mostrarModal: boolean = false;
  modalTitulo: string = '';
  modalMensaje: string = '';
  modalEsError: boolean = false;

  mostrarModalConfirm: boolean = false;
  itemAEliminar: string | null = null;

  mostrarInputTalla: boolean = false;
  nuevaTallaInput: string = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  mostrarAlerta(titulo: string, mensaje: string, esError: boolean = false) {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalEsError = esError;
    this.mostrarModal = true;
  }

  cerrarAlerta() { 
    this.mostrarModal = false; 
  }

  pedirConfirmacionEliminar(id: string) {
    this.itemAEliminar = id;
    this.mostrarModalConfirm = true;
  }

  cerrarConfirmacion() { 
    this.mostrarModalConfirm = false; 
    this.itemAEliminar = null; 
  }

  initBrand() {
    return { name: '', icon: '', iconHeight: '20px' };
  }

  initSneaker() {
    return { 
      name: '', brand: '', model: '', price: 0, gender: 'Man', 
      imageUrl: '', isTrending: false, images360: [], 
      sizes: {},
      discount: { percentage: 0, isActive: false }
    };
  }

  getDiscountedPrice(price: number, percentage: number): number {
    if (!percentage || percentage <= 0) return price;
    return price - (price * (percentage / 100));
  }

  cargarDatos() {
    this.sneakerService.getSneakers().subscribe(zapatillas => {
      this.allProductos = zapatillas;
      this.aplicarFiltros();
      this.cargando = false;
    });

    this.sneakerService.getBrands().subscribe(brands => {
      this.marcasDB = brands;
    });
  }

  async toggleTrending(sneaker: Sneaker) {
    const nuevoEstado = !sneaker.isTrending;
    runInInjectionContext(this.injector, async () => {
      try {
        await this.sneakerService.updateSneaker(sneaker.id!, { isTrending: nuevoEstado });
        sneaker.isTrending = nuevoEstado;
      } catch (error) { 
        this.mostrarAlerta('Error', 'No se pudo actualizar la tendencia.', true); 
      }
    });
  }

  getSizesKeys(sizesObj: any): string[] {
    if (!sizesObj) return [];
    return Object.keys(sizesObj).sort((a, b) => parseFloat(a.replace('_', '.')) - parseFloat(b.replace('_', '.')));
  }

  confirmarNuevaTalla() {
    const talla = this.nuevaTallaInput.trim();
    const regexFormato = /^\d{1,2}(_\d)?$/;
    
    if (!regexFormato.test(talla)) {
      this.mostrarAlerta('Formato Inválido', 'La talla debe contener solo números, usando guión bajo para medios números (ej: 42 o 42_5). No se permiten letras ni guiones medios.', true);
      return;
    }

    if (!this.selectedSneaker.sizes) {
      this.selectedSneaker.sizes = {};
    }

    if (this.selectedSneaker.sizes.hasOwnProperty(talla)) {
      this.mostrarAlerta('Atención', 'Esta talla ya está asignada a la zapatilla actual.', true);
      return;
    }

    this.selectedSneaker.sizes[talla] = 0;
    
    this.uploadMessage = `Talla ${talla.replace('_', '.')} asignada correctamente.`;
    setTimeout(() => this.uploadMessage = '', 3000);
    
    this.mostrarInputTalla = false;
    this.nuevaTallaInput = '';
  }

  eliminarTalla(sz: string) {
    if (this.selectedSneaker.sizes && this.selectedSneaker.sizes.hasOwnProperty(sz)) {
      delete this.selectedSneaker.sizes[sz];
    }
  }

  private getFolderName(name: string): string {
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  }

  async uploadSinglePhoto(event: any) {
    const file = event.target.files[0];
    if (!file || !this.selectedSneaker.name) {
      this.mostrarAlerta('Atención', 'Introduce un nombre para la zapatilla antes de subir fotos.', true);
      return;
    }
    this.isUploading = true;
    this.uploadMessage = '';
    const folderName = this.getFolderName(this.selectedSneaker.name);
    await runInInjectionContext(this.injector, async () => {
      try {
        const fileRef = ref(this.storage, `${folderName}/${file.name}`);
        await uploadBytes(fileRef, file);
        this.selectedSneaker.imageUrl = await getDownloadURL(fileRef);
        this.selectedSneaker.images360 = [];
        this.uploadMessage = 'Foto principal subida correctamente.';
        setTimeout(() => this.uploadMessage = '', 4000);
      } finally { 
        this.isUploading = false; 
      }
    });
  }

  async upload360Batch(event: any) {
    const files = Array.from(event.target.files as FileList);
    if (files.length === 0 || !this.selectedSneaker.name) {
      this.mostrarAlerta('Atención', 'Introduce un nombre para la zapatilla antes de subir fotos.', true);
      return;
    }
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    this.isUploading = true;
    this.uploadMessage = '';
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
        this.uploadMessage = `Pack de ${files.length} fotos subido correctamente.`;
        setTimeout(() => this.uploadMessage = '', 4000);
      } finally { 
        this.isUploading = false; 
      }
    });
  }

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
      } finally { 
        this.isUploading = false; 
      }
    });
  }

  async guardarMarca() {
    if (!this.newBrand.name || !this.newBrand.icon) return;
    try {
      await this.sneakerService.addBrand(this.newBrand);
      this.mostrarAlerta('Éxito', this.isEditingBrand ? 'Marca actualizada correctamente.' : 'Marca creada con éxito.', false);
      this.cancelarEdicionMarca();
    } catch (error) { 
      this.mostrarAlerta('Error', 'No se pudo guardar la marca.', true); 
    }
  }

  async guardarZapatilla() {
    if (!this.selectedSneaker.name || this.isSaving || this.isUploading) return;
    
    this.isSaving = true;
    
    runInInjectionContext(this.injector, async () => {
      try {
        if (this.isEditing) {
          await this.sneakerService.updateSneaker(this.selectedSneaker.id, this.selectedSneaker);
        } else {
          await this.sneakerService.addSneaker(this.selectedSneaker);
        }
        
        this.mostrarAlerta('Guardado', 'Zapatilla guardada correctamente en el inventario.', false);
        
        const btnCerrar = document.querySelector('#sneakerModal .btn-close') as HTMLElement;
        if (btnCerrar) btnCerrar.click();

      } catch (error) { 
        this.mostrarAlerta('Error', 'Hubo un problema al guardar la zapatilla.', true); 
      } finally {
        this.isSaving = false;
      }
    });
  }

  async ejecutarEliminarZapatilla() {
    if (this.itemAEliminar) {
      await this.sneakerService.deleteSneaker(this.itemAEliminar);
      this.cargarDatos();
      this.mostrarAlerta('Eliminada', 'La zapatilla ha sido borrada del catálogo.', false);
    }
    this.cerrarConfirmacion();
  }

  abrirModalNuevo() { 
    this.isEditing = false; 
    this.selectedSneaker = this.initSneaker(); 
    this.uploadMessage = '';
    this.mostrarInputTalla = false;
    this.nuevaTallaInput = '';
  }

  abrirModalEditar(s: Sneaker) { 
    this.isEditing = true; 
    this.uploadMessage = '';
    this.mostrarInputTalla = false;
    this.nuevaTallaInput = '';
    this.selectedSneaker = JSON.parse(JSON.stringify(s)); 
    
    if (!this.selectedSneaker.sizes) {
      this.selectedSneaker.sizes = {};
    }
    
    if (!this.selectedSneaker.discount) {
      this.selectedSneaker.discount = { percentage: 0, isActive: false };
    }
  }

  aplicarFiltros() {
    this.productosFiltrados = this.allProductos.filter(s => {
      const cumpleTexto = !this.filtroTexto || s.name.toLowerCase().includes(this.filtroTexto.toLowerCase()) || (s.model && s.model.toLowerCase().includes(this.filtroTexto.toLowerCase()));
      const cumpleMarca = !this.filtroMarca || s.brand === this.filtroMarca;
      return cumpleTexto && cumpleMarca && s.price <= this.filtroPrecioMax;
    });
  }

  limpiarFiltros() { 
    this.filtroTexto = ''; 
    this.filtroMarca = ''; 
    this.aplicarFiltros(); 
  }
}