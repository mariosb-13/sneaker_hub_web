import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Storage, ref as storageRef, listAll, getDownloadURL, deleteObject, uploadBytes } from '@angular/fire/storage';

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
      
      alert(`¡${newFiles.length} archivo(s) subido(s) con éxito!`);

    } catch (error) {
      console.error('Error en la subida:', error);
      alert('Error al subir los archivos.');
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

  async deleteFolder(folder: StorageFolder) {
    if (!confirm(`¿Estás MEGA SEGURO de que quieres borrar la carpeta entera "${folder.folderName}" con sus ${folder.files.length} imágenes? Esta acción NO se puede deshacer.`)) {
      return;
    }

    try {
      const deletePromises = folder.files.map(file => 
        deleteObject(storageRef(this.storage, file.fullPath))
      );

      await Promise.all(deletePromises);

      this.folders = this.folders.filter(f => f.folderName !== folder.folderName);
      
      this.applyFilter();
      
      alert(`La carpeta "${folder.folderName}" ha sido vaporizada con éxito.`);

    } catch (error) {
      console.error('Error al borrar la carpeta entera:', error);
      alert('Hubo un error. Puede que se hayan borrado algunas fotos pero no todas.');
    }
  }
  async deleteFile(folder: StorageFolder, file: StorageFile) {
    if (!confirm(`¿Eliminar permanentemente "${file.name}"?`)) return;
    try {
      await deleteObject(storageRef(this.storage, file.fullPath));
      folder.files = folder.files.filter(f => f.fullPath !== file.fullPath);
    } catch (error) { console.error(error); }
  }
}