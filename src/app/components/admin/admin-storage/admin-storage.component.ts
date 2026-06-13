import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Storage, ref as storageRef, listAll, getDownloadURL, deleteObject, uploadBytes } from '@angular/fire/storage';
import { AlertService } from '../../../services/alert.service';

interface StorageFile {
  name: string;
  fullPath: string;
  url: string;
}

interface StorageFolder {
  folderName: string;
  files: StorageFile[];
  isExpanded: boolean;
  thumbnailUrl?: string; // Para mostrar la miniatura al lado del nombre
}

@Component({
  selector: 'app-admin-storage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-storage.component.html',
  styleUrl: './admin-storage.component.scss'
})
export class AdminStorageComponent implements OnInit {
  
  folders: StorageFolder[] = [];
  filteredFolders: StorageFolder[] = [];
  isLoading = true;
  isUploading = false; // Estado global de subida
  searchTerm: string = '';
  
  mostrarModalConfirm: boolean = false;
  carpetaAEliminar: StorageFolder | null = null;
  archivoAEliminar: StorageFile | null = null;
  carpetaDelArchivo: StorageFolder | null = null;

  private alertService = inject(AlertService);

  constructor(private storage: Storage) {}

  ngOnInit() {
    this.scanStorage();
  }

  async scanStorage() {
    this.isLoading = true;
    try {
      const rootRef = storageRef(this.storage, '');
      const rootList = await listAll(rootRef);

      const folderPromises = rootList.prefixes.map(async (folderRef) => {
        const folderName = folderRef.name;
        const folderList = await listAll(folderRef);

        const filePromises = folderList.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return { name: itemRef.name, fullPath: itemRef.fullPath, url: url };
        });

        const filesInFolder = await Promise.all(filePromises);

        return {
          folderName: folderName,
          files: filesInFolder,
          isExpanded: false,
          thumbnailUrl: filesInFolder.length > 0 ? filesInFolder[0].url : undefined
        };
      });

      const resolvedFolders = await Promise.all(folderPromises);
      this.folders = resolvedFolders.filter(folder => folder.files.length > 0);
      this.applyFilter();

    } catch (error) {
      console.error('Error escaneando Storage:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // --- NUEVA FUNCIÓN: SUBIR ARCHIVOS A UNA CARPETA ---
  async onFilesSelected(event: any, folder: StorageFolder) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    this.isUploading = true;
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Creamos la referencia: carpeta/nombre_archivo
        const fileDestination = storageRef(this.storage, `${folder.folderName}/${file.name}`);
        
        // Subimos el archivo físico
        await uploadBytes(fileDestination, file);
        
        // Obtenemos la URL para actualizar la vista sin recargar todo
        const url = await getDownloadURL(fileDestination);
        return {
          name: file.name,
          fullPath: fileDestination.fullPath,
          url: url
        };
      });

      const newFiles = await Promise.all(uploadPromises);
      
      // Actualizamos la carpeta localmente para que el admin vea los cambios ya
      folder.files.push(...newFiles);
      if (!folder.thumbnailUrl) folder.thumbnailUrl = newFiles[0].url;
      
      this.alertService.success('Archivos subidos', `${newFiles.length} archivo(s) subido(s) con éxito!`);

    } catch (error) {
      console.error('Error en la subida:', error);
      this.alertService.error('Error', 'No fue posible subir los archivos. Intenta de nuevo.');
    } finally {
      this.isUploading = false;
      event.target.value = ''; // Limpiamos el input
    }
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredFolders = term ? 
      this.folders.filter(f => f.folderName.toLowerCase().includes(term)) : 
      [...this.folders];
  }

  toggleFolder(folder: StorageFolder) { folder.isExpanded = !folder.isExpanded; }
  toggleAll(expand: boolean) { this.filteredFolders.forEach(f => f.isExpanded = expand); }

  pedirConfirmacionEliminarCarpeta(folder: StorageFolder) {
    this.carpetaAEliminar = folder;
    this.archivoAEliminar = null;
    this.mostrarModalConfirm = true;
  }

  pedirConfirmacionEliminarArchivo(folder: StorageFolder, file: StorageFile) {
    this.carpetaAEliminar = null;
    this.archivoAEliminar = file;
    this.carpetaDelArchivo = folder;
    this.mostrarModalConfirm = true;
  }

  cerrarModalConfirm() {
    this.mostrarModalConfirm = false;
    this.carpetaAEliminar = null;
    this.archivoAEliminar = null;
    this.carpetaDelArchivo = null;
  }

  async confirmarEliminar() {
    if (this.carpetaAEliminar) {
      await this.confirmarEliminarCarpeta();
    } else if (this.archivoAEliminar && this.carpetaDelArchivo) {
      await this.confirmarEliminarArchivo();
    }
  }

  async confirmarEliminarCarpeta() {
    if (!this.carpetaAEliminar) return;

    try {
      const deletePromises = this.carpetaAEliminar.files.map(file => 
        deleteObject(storageRef(this.storage, file.fullPath))
      );

      await Promise.all(deletePromises);

      this.folders = this.folders.filter(f => f.folderName !== this.carpetaAEliminar!.folderName);
      
      this.applyFilter();
      
      this.alertService.success('Carpeta eliminada', `La carpeta "${this.carpetaAEliminar.folderName}" ha sido eliminada correctamente.`);

    } catch (error) {
      console.error('Error al borrar la carpeta entera:', error);
      this.alertService.error('Error', 'No fue posible eliminar la carpeta. Algunos archivos podrían no haberse eliminado correctamente.');
    } finally {
      this.cerrarModalConfirm();
    }
  }

  async confirmarEliminarArchivo() {
    if (!this.archivoAEliminar || !this.carpetaDelArchivo) return;

    try {
      await deleteObject(storageRef(this.storage, this.archivoAEliminar.fullPath));
      this.carpetaDelArchivo.files = this.carpetaDelArchivo.files.filter(f => f.fullPath !== this.archivoAEliminar!.fullPath);
      this.alertService.success('Archivo eliminado', `"${this.archivoAEliminar.name}" ha sido eliminado correctamente.`);
    } catch (error) {
      console.error(error);
      this.alertService.error('Error', 'No fue posible eliminar el archivo. Intenta de nuevo.');
    } finally {
      this.cerrarModalConfirm();
    }
  }
}