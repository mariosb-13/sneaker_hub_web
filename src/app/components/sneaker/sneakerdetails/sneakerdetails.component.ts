import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-sneakersdetails',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sneakerdetails.component.html',
  styleUrls: ['./sneakerdetails.component.scss']
})
export class SneakersdetailsComponent implements OnInit {

  sneaker: any = null; 
  selectedSize: number | null = null;

  allSneakers = [
    {
      id: 1,
      brand: 'Nike',
      model: 'Dunk Low',
      colorway: 'Off-White Lot 34',
      price: 700,
      image: 'assets/images/nike-off-white.png',
      sizes: [38, 39, 40, 41, 42, 43, 44]
    },
    {
      id: 2,
      brand: 'Jordan',
      model: 'Jumpman Jack TR',
      colorway: 'Travis Scott Sail',
      price: 450,
      image: 'assets/images/travis-scott.png',
      sizes: [40, 41, 42, 43]
    },
    {
      id: 3,
      brand: 'Nike',
      model: 'SB Dunk Low',
      colorway: 'Pro QS Neckface',
      price: 280,
      image: 'assets/images/neckface.png',
      sizes: [36, 37, 38, 39, 40]
    },
    {
      id: 4,
      brand: 'Nike',
      model: 'SB Dunk Low',
      colorway: 'Powerpuff Girls Bubbles',
      price: 390,
      image: 'assets/images/powerpuff.png',
      sizes: [35, 36, 37, 38]
    },
    {
      id: 5,
      brand: 'Adidas',
      model: 'Forum Low',
      colorway: 'Bad Bunny Pink Easter Egg',
      price: 550,
      image: 'assets/images/bad-bunny.png',
      sizes: [39, 40, 41, 42, 43, 44]
    },
    {
      id: 6,
      brand: 'Jordan',
      model: '1 Retro High OG',
      colorway: 'Lost and Found',
      price: 450,
      image: 'assets/images/lost-found.jpg',
      sizes: [40, 41, 42, 43, 44, 45]
    },
    {
      id: 7,
      brand: 'New Balance',
      model: '550',
      colorway: 'White Green',
      price: 180,
      image: 'assets/images/nb-green.jpg',
      sizes: [37, 38, 39, 40, 41, 42]
    },
    {
      id: 8,
      brand: 'Jordan',
      model: '4 Retro',
      colorway: 'Military Black',
      price: 420,
      image: 'assets/images/military-black.jpg',
      sizes: [39, 40, 41, 42, 43, 44, 45]
    },
    {
      id: 9,
      brand: 'Nike',
      model: 'SB Dunk Low',
      colorway: 'Jarritos',
      price: 600,
      image: 'assets/images/jarritos.jpg',
      sizes: [38, 39, 40, 41, 42]
    },
    {
      id: 10,
      brand: 'Adidas',
      model: 'Yeezy Slide',
      colorway: 'Onyx',
      price: 120,
      image: 'assets/images/onyx.jpg',
      sizes: [36, 37, 38, 39, 40, 41, 42]
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.sneaker = this.allSneakers.find(item => item.id === id);

    if (!this.sneaker) {
      console.error('Zapatilla no encontrada');
    }
  }

  selectSize(size: number) {
    this.selectedSize = size;
  }
}