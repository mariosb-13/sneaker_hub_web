import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Sneaker } from '../../../models/sneaker.model'; 
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sneaker-resume',
  imports: [CommonModule, RouterLink], 
  templateUrl: './sneakerresume.component.html',
  styleUrl: './sneakerresume.component.scss'
})
export class SneakerresumeComponent {
  // Definimos el Input para recibir los datos desde el padre
  // El "!" indica que la variable se iniciará seguro antes de usarse
  @Input() sneaker!: Sneaker; 
}