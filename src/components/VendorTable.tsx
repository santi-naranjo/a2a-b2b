'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, MessageCircle } from 'lucide-react';
import { VendorChatModal } from './VendorChatModal';
import { DualRangeSlider } from '@/components/ui/dual-range-slider';

interface VendorData {
  id: string;
  name: string;
  categories: string[];
  category: string; // primary category for display
  product: string;
  inventory: number;
  basePrice: number;
  discountPolicy: string[];
  shippingTime: number;
}

// Legacy types removed (we now rely only on aggregated vendor API)

const vendorData: VendorData[] = [
  // Original vendors (Shoes category)
  {
    id: 'vendor1',
    name: 'Nova Trade',
    category: 'Shoes',
    product: 'Adidas men\'s shoes',
    inventory: 1000,
    basePrice: 26,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 49 units receive a 20% discount',
      'Orders of 50 or more units receive a 35% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor2',
    name: 'Bravo Supplies',
    category: 'Shoes',
    product: 'Adidas men\'s shoes',
    inventory: 500,
    basePrice: 23,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 units or more receive a 30% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor3',
    name: 'Vendor3',
    category: 'Shoes',
    product: 'Adidas men\'s shoes',
    inventory: 2500,
    basePrice: 21,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 100 units or more receive a 35% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor4',
    name: 'Reds Supplies',
    category: 'Shoes',
    product: 'Adidas men\'s shoes',
    inventory: 50,
    basePrice: 19,
    discountPolicy: [
      'Any order receive a 10% discount'
    ],
    shippingTime: 9
  },
  
  // Electronics vendors
  {
    id: 'vendor5',
    name: 'TechPro Solutions',
    category: 'Electronics',
    product: 'Dell Latitude Laptops',
    inventory: 800,
    basePrice: 850,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 15% discount',
      'Orders of 20 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor6',
    name: 'Digital Dynamics',
    category: 'Electronics',
    product: 'Apple MacBook Pro',
    inventory: 300,
    basePrice: 1200,
    discountPolicy: [
      'No discount for orders below 3 units',
      'Orders of 3 to 9 units receive a 10% discount',
      'Orders of 10 or more units receive a 20% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor7',
    name: 'SmartTech Inc',
    category: 'Electronics',
    product: 'Samsung Galaxy Tablets',
    inventory: 1200,
    basePrice: 450,
    discountPolicy: [
      'Orders of 10 or more units receive a 20% discount',
      'Orders of 50 or more units receive a 30% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor8',
    name: 'ElectroMax',
    category: 'Electronics',
    product: 'Wireless Headphones',
    inventory: 2500,
    basePrice: 89,
    discountPolicy: [
      'No discount for orders below 25 units',
      'Orders of 25 to 99 units receive a 15% discount',
      'Orders of 100 or more units receive a 25% discount'
    ],
    shippingTime: 1
  },
  
  // Clothing vendors
  {
    id: 'vendor9',
    name: 'Fashion Forward',
    category: 'Clothing',
    product: 'Nike Sports Jackets',
    inventory: 1500,
    basePrice: 75,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 49 units receive a 18% discount',
      'Orders of 50 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor10',
    name: 'Style Solutions',
    category: 'Clothing',
    product: 'Levi\'s Jeans',
    inventory: 2200,
    basePrice: 45,
    discountPolicy: [
      'Orders of 20 or more units receive a 20% discount',
      'Orders of 100 or more units receive a 35% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor11',
    name: 'Urban Wear Co',
    category: 'Clothing',
    product: 'Hoodies & Sweatshirts',
    inventory: 3000,
    basePrice: 35,
    discountPolicy: [
      'No discount for orders below 30 units',
      'Orders of 30 to 99 units receive a 12% discount',
      'Orders of 100 or more units receive a 22% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor12',
    name: 'Premium Threads',
    category: 'Clothing',
    product: 'Business Suits',
    inventory: 400,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 15% discount',
      'Orders of 20 or more units receive a 25% discount'
    ],
    shippingTime: 4
  },
  
  // Furniture vendors
  {
    id: 'vendor13',
    name: 'Office Essentials',
    category: 'Furniture',
    product: 'Ergonomic Office Chairs',
    inventory: 600,
    basePrice: 320,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 24 units receive a 12% discount',
      'Orders of 25 or more units receive a 20% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor14',
    name: 'Modern Furniture Co',
    category: 'Furniture',
    product: 'Conference Tables',
    inventory: 150,
    basePrice: 1200,
    discountPolicy: [
      'No discount for orders below 3 units',
      'Orders of 3 to 9 units receive a 10% discount',
      'Orders of 10 or more units receive a 18% discount'
    ],
    shippingTime: 7
  },
  {
    id: 'vendor15',
    name: 'Home Comfort',
    category: 'Furniture',
    product: 'Sofas & Couches',
    inventory: 200,
    basePrice: 850,
    discountPolicy: [
      'Orders of 5 or more units receive a 15% discount',
      'Orders of 15 or more units receive a 25% discount'
    ],
    shippingTime: 6
  },
  {
    id: 'vendor16',
    name: 'Storage Solutions',
    category: 'Furniture',
    product: 'Filing Cabinets',
    inventory: 800,
    basePrice: 180,
    discountPolicy: [
      'No discount for orders below 12 units',
      'Orders of 12 to 39 units receive a 14% discount',
      'Orders of 40 or more units receive a 22% discount'
    ],
    shippingTime: 3
  },
  
  // Sports Equipment vendors
  {
    id: 'vendor17',
    name: 'Sports Central',
    category: 'Sports Equipment',
    product: 'Basketballs',
    inventory: 2000,
    basePrice: 25,
    discountPolicy: [
      'No discount for orders below 50 units',
      'Orders of 50 to 199 units receive a 18% discount',
      'Orders of 200 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor18',
    name: 'Fitness Pro',
    category: 'Sports Equipment',
    product: 'Treadmills',
    inventory: 120,
    basePrice: 1200,
    discountPolicy: [
      'No discount for orders below 3 units',
      'Orders of 3 to 9 units receive a 12% discount',
      'Orders of 10 or more units receive a 20% discount'
    ],
    shippingTime: 8
  },
  {
    id: 'vendor19',
    name: 'Outdoor Gear',
    category: 'Sports Equipment',
    product: 'Tennis Rackets',
    inventory: 800,
    basePrice: 95,
    discountPolicy: [
      'Orders of 10 or more units receive a 15% discount',
      'Orders of 50 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor20',
    name: 'Gym Equipment Plus',
    category: 'Sports Equipment',
    product: 'Dumbbells Set',
    inventory: 1500,
    basePrice: 150,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 16% discount',
      'Orders of 80 or more units receive a 26% discount'
    ],
    shippingTime: 4
  },
  
  // Books & Office Supplies vendors
  {
    id: 'vendor21',
    name: 'Book World',
    category: 'Books & Office',
    product: 'Textbooks & Educational',
    inventory: 5000,
    basePrice: 45,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 499 units receive a 20% discount',
      'Orders of 500 or more units receive a 30% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor22',
    name: 'Office Depot Pro',
    category: 'Books & Office',
    product: 'Printer Paper & Ink',
    inventory: 8000,
    basePrice: 12,
    discountPolicy: [
      'Orders of 200 or more units receive a 25% discount',
      'Orders of 1000 or more units receive a 35% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor23',
    name: 'Stationery Plus',
    category: 'Books & Office',
    product: 'Notebooks & Pens',
    inventory: 12000,
    basePrice: 8,
    discountPolicy: [
      'No discount for orders below 500 units',
      'Orders of 500 to 1999 units receive a 22% discount',
      'Orders of 2000 or more units receive a 32% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor24',
    name: 'Academic Supplies',
    category: 'Books & Office',
    product: 'Scientific Calculators',
    inventory: 600,
    basePrice: 35,
    discountPolicy: [
      'No discount for orders below 25 units',
      'Orders of 25 to 99 units receive a 18% discount',
      'Orders of 100 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  
  // Additional Electronics vendors
  {
    id: 'vendor25',
    name: 'MobileTech Pro',
    category: 'Electronics',
    product: 'iPhone 15 Pro',
    inventory: 450,
    basePrice: 999,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 8% discount',
      'Orders of 20 or more units receive a 15% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor26',
    name: 'Gaming Solutions',
    category: 'Electronics',
    product: 'Gaming Laptops',
    inventory: 280,
    basePrice: 1500,
    discountPolicy: [
      'No discount for orders below 3 units',
      'Orders of 3 to 9 units receive a 12% discount',
      'Orders of 10 or more units receive a 20% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor27',
    name: 'Audio Systems Co',
    category: 'Electronics',
    product: 'Bluetooth Speakers',
    inventory: 1800,
    basePrice: 120,
    discountPolicy: [
      'Orders of 20 or more units receive a 15% discount',
      'Orders of 100 or more units receive a 25% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor28',
    name: 'Smart Home Tech',
    category: 'Electronics',
    product: 'Smart Bulbs & Switches',
    inventory: 3500,
    basePrice: 25,
    discountPolicy: [
      'No discount for orders below 50 units',
      'Orders of 50 to 199 units receive a 18% discount',
      'Orders of 200 or more units receive a 28% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor29',
    name: 'Camera World',
    category: 'Electronics',
    product: 'DSLR Cameras',
    inventory: 320,
    basePrice: 800,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 10% discount',
      'Orders of 20 or more units receive a 18% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor30',
    name: 'Monitor Solutions',
    category: 'Electronics',
    product: '4K Monitors',
    inventory: 650,
    basePrice: 350,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 49 units receive a 15% discount',
      'Orders of 50 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  
  // Additional Clothing vendors
  {
    id: 'vendor31',
    name: 'Athletic Wear Plus',
    category: 'Clothing',
    product: 'Running Shoes',
    inventory: 2200,
    basePrice: 85,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 99 units receive a 20% discount',
      'Orders of 100 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor32',
    name: 'Casual Fashion',
    category: 'Clothing',
    product: 'T-Shirts & Polos',
    inventory: 5000,
    basePrice: 18,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 499 units receive a 22% discount',
      'Orders of 500 or more units receive a 32% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor33',
    name: 'Winter Gear Co',
    category: 'Clothing',
    product: 'Winter Jackets',
    inventory: 800,
    basePrice: 150,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 49 units receive a 18% discount',
      'Orders of 50 or more units receive a 28% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor34',
    name: 'Formal Attire',
    category: 'Clothing',
    product: 'Dress Shirts',
    inventory: 1800,
    basePrice: 55,
    discountPolicy: [
      'Orders of 25 or more units receive a 20% discount',
      'Orders of 100 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor35',
    name: 'Accessories Plus',
    category: 'Clothing',
    product: 'Belts & Wallets',
    inventory: 3000,
    basePrice: 35,
    discountPolicy: [
      'No discount for orders below 50 units',
      'Orders of 50 to 199 units receive a 15% discount',
      'Orders of 200 or more units receive a 25% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor36',
    name: 'Kids Fashion',
    category: 'Clothing',
    product: 'Children\'s Clothing',
    inventory: 4000,
    basePrice: 25,
    discountPolicy: [
      'No discount for orders below 75 units',
      'Orders of 75 to 299 units receive a 20% discount',
      'Orders of 300 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  
  // Additional Furniture vendors
  {
    id: 'vendor37',
    name: 'Desk Solutions',
    category: 'Furniture',
    product: 'Office Desks',
    inventory: 450,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 12% discount',
      'Orders of 40 or more units receive a 20% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor38',
    name: 'Chair World',
    category: 'Furniture',
    product: 'Dining Chairs',
    inventory: 1200,
    basePrice: 120,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 15% discount',
      'Orders of 80 or more units receive a 25% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor39',
    name: 'Bedroom Furniture',
    category: 'Furniture',
    product: 'Bed Frames & Mattresses',
    inventory: 350,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 24 units receive a 10% discount',
      'Orders of 25 or more units receive a 18% discount'
    ],
    shippingTime: 6
  },
  {
    id: 'vendor40',
    name: 'Kitchen Essentials',
    category: 'Furniture',
    product: 'Kitchen Cabinets',
    inventory: 200,
    basePrice: 800,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 12% discount',
      'Orders of 20 or more units receive a 20% discount'
    ],
    shippingTime: 7
  },
  {
    id: 'vendor41',
    name: 'Outdoor Furniture',
    category: 'Furniture',
    product: 'Garden Chairs & Tables',
    inventory: 600,
    basePrice: 180,
    discountPolicy: [
      'Orders of 15 or more units receive a 15% discount',
      'Orders of 50 or more units receive a 25% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor42',
    name: 'Storage Pro',
    category: 'Furniture',
    product: 'Bookshelves & Wardrobes',
    inventory: 800,
    basePrice: 220,
    discountPolicy: [
      'No discount for orders below 12 units',
      'Orders of 12 to 39 units receive a 14% discount',
      'Orders of 40 or more units receive a 22% discount'
    ],
    shippingTime: 3
  },
  
  // Automotive vendors
  {
    id: 'vendor43',
    name: 'Auto Parts Pro',
    category: 'Automotive',
    product: 'Car Batteries',
    inventory: 1200,
    basePrice: 120,
    discountPolicy: [
      'No discount for orders below 25 units',
      'Orders of 25 to 99 units receive a 15% discount',
      'Orders of 100 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor44',
    name: 'Tire World',
    category: 'Automotive',
    product: 'All-Season Tires',
    inventory: 800,
    basePrice: 180,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 18% discount',
      'Orders of 80 or more units receive a 28% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor45',
    name: 'Motor Oil Plus',
    category: 'Automotive',
    product: 'Synthetic Motor Oil',
    inventory: 3000,
    basePrice: 35,
    discountPolicy: [
      'Orders of 50 or more units receive a 20% discount',
      'Orders of 200 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor46',
    name: 'Car Accessories',
    category: 'Automotive',
    product: 'Car Floor Mats',
    inventory: 2500,
    basePrice: 45,
    discountPolicy: [
      'No discount for orders below 30 units',
      'Orders of 30 to 149 units receive a 16% discount',
      'Orders of 150 or more units receive a 26% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor47',
    name: 'Brake Systems',
    category: 'Automotive',
    product: 'Brake Pads & Rotors',
    inventory: 1500,
    basePrice: 85,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 59 units receive a 17% discount',
      'Orders of 60 or more units receive a 27% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor48',
    name: 'Lighting Solutions',
    category: 'Automotive',
    product: 'LED Headlights',
    inventory: 1800,
    basePrice: 95,
    discountPolicy: [
      'Orders of 20 or more units receive a 18% discount',
      'Orders of 100 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  
  // Food & Beverages vendors
  {
    id: 'vendor49',
    name: 'Beverage World',
    category: 'Food & Beverages',
    product: 'Bottled Water',
    inventory: 15000,
    basePrice: 8,
    discountPolicy: [
      'No discount for orders below 500 units',
      'Orders of 500 to 1999 units receive a 25% discount',
      'Orders of 2000 or more units receive a 35% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor50',
    name: 'Coffee Suppliers',
    category: 'Food & Beverages',
    product: 'Premium Coffee Beans',
    inventory: 2000,
    basePrice: 25,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 499 units receive a 20% discount',
      'Orders of 500 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor51',
    name: 'Snack Central',
    category: 'Food & Beverages',
    product: 'Assorted Snacks',
    inventory: 8000,
    basePrice: 12,
    discountPolicy: [
      'Orders of 300 or more units receive a 22% discount',
      'Orders of 1000 or more units receive a 32% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor52',
    name: 'Organic Foods',
    category: 'Food & Beverages',
    product: 'Organic Cereals',
    inventory: 3000,
    basePrice: 18,
    discountPolicy: [
      'No discount for orders below 150 units',
      'Orders of 150 to 599 units receive a 18% discount',
      'Orders of 600 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor53',
    name: 'Energy Drinks Co',
    category: 'Food & Beverages',
    product: 'Energy Drinks',
    inventory: 12000,
    basePrice: 15,
    discountPolicy: [
      'No discount for orders below 400 units',
      'Orders of 400 to 1499 units receive a 23% discount',
      'Orders of 1500 or more units receive a 33% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor54',
    name: 'Tea & Herbs',
    category: 'Food & Beverages',
    product: 'Herbal Teas',
    inventory: 4000,
    basePrice: 20,
    discountPolicy: [
      'Orders of 200 or more units receive a 20% discount',
      'Orders of 800 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  
  // Health & Beauty vendors
  {
    id: 'vendor55',
    name: 'Beauty Essentials',
    category: 'Health & Beauty',
    product: 'Skincare Products',
    inventory: 3500,
    basePrice: 28,
    discountPolicy: [
      'No discount for orders below 50 units',
      'Orders of 50 to 199 units receive a 18% discount',
      'Orders of 200 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor56',
    name: 'Hair Care Pro',
    category: 'Health & Beauty',
    product: 'Hair Care Products',
    inventory: 4200,
    basePrice: 22,
    discountPolicy: [
      'No discount for orders below 75 units',
      'Orders of 75 to 299 units receive a 20% discount',
      'Orders of 300 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor57',
    name: 'Makeup World',
    category: 'Health & Beauty',
    product: 'Cosmetics & Makeup',
    inventory: 2800,
    basePrice: 35,
    discountPolicy: [
      'Orders of 40 or more units receive a 19% discount',
      'Orders of 150 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor58',
    name: 'Personal Care',
    category: 'Health & Beauty',
    product: 'Personal Hygiene',
    inventory: 6000,
    basePrice: 15,
    discountPolicy: [
      'No discount for orders below 200 units',
      'Orders of 200 to 799 units receive a 22% discount',
      'Orders of 800 or more units receive a 32% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor59',
    name: 'Fragrance House',
    category: 'Health & Beauty',
    product: 'Perfumes & Colognes',
    inventory: 1200,
    basePrice: 85,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 15% discount',
      'Orders of 80 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor60',
    name: 'Wellness Products',
    category: 'Health & Beauty',
    product: 'Vitamins & Supplements',
    inventory: 2500,
    basePrice: 45,
    discountPolicy: [
      'Orders of 30 or more units receive a 18% discount',
      'Orders of 120 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  
  // Additional Sports Equipment vendors
  {
    id: 'vendor61',
    name: 'Soccer Equipment',
    category: 'Sports Equipment',
    product: 'Soccer Balls',
    inventory: 1800,
    basePrice: 35,
    discountPolicy: [
      'No discount for orders below 40 units',
      'Orders of 40 to 159 units receive a 18% discount',
      'Orders of 160 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor62',
    name: 'Swimming Gear',
    category: 'Sports Equipment',
    product: 'Swimming Equipment',
    inventory: 1200,
    basePrice: 55,
    discountPolicy: [
      'Orders of 25 or more units receive a 17% discount',
      'Orders of 100 or more units receive a 27% discount'
    ],
    shippingTime: 3
  },

  {
    id: 'vendor64',
    name: 'Cycling Pro',
    category: 'Sports Equipment',
    product: 'Bicycle Accessories',
    inventory: 1500,
    basePrice: 75,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 16% discount',
      'Orders of 80 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor65',
    name: 'Fishing Gear',
    category: 'Sports Equipment',
    product: 'Fishing Equipment',
    inventory: 800,
    basePrice: 120,
    discountPolicy: [
      'Orders of 15 or more units receive a 18% discount',
      'Orders of 60 or more units receive a 28% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor66',
    name: 'Golf Equipment',
    category: 'Sports Equipment',
    product: 'Golf Clubs & Balls',
    inventory: 600,
    basePrice: 180,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 15% discount',
      'Orders of 40 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  
  // Additional Books & Office vendors
  {
    id: 'vendor67',
    name: 'Art Supplies',
    category: 'Books & Office',
    product: 'Art & Craft Materials',
    inventory: 3500,
    basePrice: 30,
    discountPolicy: [
      'No discount for orders below 80 units',
      'Orders of 80 to 319 units receive a 20% discount',
      'Orders of 320 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor68',
    name: 'Office Furniture',
    category: 'Books & Office',
    product: 'Office Chairs & Desks',
    inventory: 900,
    basePrice: 250,
    discountPolicy: [
      'No discount for orders below 12 units',
      'Orders of 12 to 47 units receive a 14% discount',
      'Orders of 48 or more units receive a 24% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor69',
    name: 'Computer Accessories',
    category: 'Books & Office',
    product: 'Computer Peripherals',
    inventory: 2800,
    basePrice: 65,
    discountPolicy: [
      'Orders of 35 or more units receive a 19% discount',
      'Orders of 140 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor70',
    name: 'Presentation Tools',
    category: 'Books & Office',
    product: 'Projectors & Screens',
    inventory: 400,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 12% discount',
      'Orders of 32 or more units receive a 22% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor71',
    name: 'Storage Solutions',
    category: 'Books & Office',
    product: 'USB Drives & Memory Cards',
    inventory: 5000,
    basePrice: 25,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 399 units receive a 21% discount',
      'Orders of 400 or more units receive a 31% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor72',
    name: 'Printing Supplies',
    category: 'Books & Office',
    product: 'Printer Cartridges',
    inventory: 6000,
    basePrice: 35,
    discountPolicy: [
      'Orders of 50 or more units receive a 20% discount',
      'Orders of 200 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  
  // Toys & Games vendors
  {
    id: 'vendor73',
    name: 'Toy World',
    category: 'Toys & Games',
    product: 'Educational Toys',
    inventory: 4500,
    basePrice: 35,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 399 units receive a 20% discount',
      'Orders of 400 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor74',
    name: 'Board Games Co',
    category: 'Toys & Games',
    product: 'Board Games & Puzzles',
    inventory: 2800,
    basePrice: 45,
    discountPolicy: [
      'Orders of 50 or more units receive a 18% discount',
      'Orders of 200 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor75',
    name: 'Video Games Pro',
    category: 'Toys & Games',
    product: 'Video Games & Consoles',
    inventory: 1200,
    basePrice: 60,
    discountPolicy: [
      'No discount for orders below 25 units',
      'Orders of 25 to 99 units receive a 15% discount',
      'Orders of 100 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor76',
    name: 'Outdoor Toys',
    category: 'Toys & Games',
    product: 'Outdoor Play Equipment',
    inventory: 1800,
    basePrice: 85,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 17% discount',
      'Orders of 80 or more units receive a 27% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor77',
    name: 'Building Blocks',
    category: 'Toys & Games',
    product: 'Construction Toys',
    inventory: 3200,
    basePrice: 55,
    discountPolicy: [
      'Orders of 40 or more units receive a 19% discount',
      'Orders of 160 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor78',
    name: 'Art & Craft Toys',
    category: 'Toys & Games',
    product: 'Creative Art Kits',
    inventory: 2500,
    basePrice: 40,
    discountPolicy: [
      'No discount for orders below 60 units',
      'Orders of 60 to 239 units receive a 18% discount',
      'Orders of 240 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  
  // Home & Garden vendors
  {
    id: 'vendor79',
    name: 'Garden World',
    category: 'Home & Garden',
    product: 'Garden Tools & Equipment',
    inventory: 2200,
    basePrice: 75,
    discountPolicy: [
      'No discount for orders below 30 units',
      'Orders of 30 to 119 units receive a 16% discount',
      'Orders of 120 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor80',
    name: 'Plant Nursery',
    category: 'Home & Garden',
    product: 'Plants & Seeds',
    inventory: 3500,
    basePrice: 25,
    discountPolicy: [
      'Orders of 80 or more units receive a 20% discount',
      'Orders of 320 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor81',
    name: 'Home Decor',
    category: 'Home & Garden',
    product: 'Home Decoration Items',
    inventory: 4000,
    basePrice: 45,
    discountPolicy: [
      'No discount for orders below 50 units',
      'Orders of 50 to 199 units receive a 18% discount',
      'Orders of 200 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor82',
    name: 'Kitchen Appliances',
    category: 'Home & Garden',
    product: 'Kitchen Equipment',
    inventory: 1500,
    basePrice: 120,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 59 units receive a 15% discount',
      'Orders of 60 or more units receive a 25% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor83',
    name: 'Lighting Solutions',
    category: 'Home & Garden',
    product: 'Home Lighting',
    inventory: 2800,
    basePrice: 65,
    discountPolicy: [
      'Orders of 35 or more units receive a 17% discount',
      'Orders of 140 or more units receive a 27% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor84',
    name: 'Cleaning Supplies',
    category: 'Home & Garden',
    product: 'Household Cleaners',
    inventory: 6000,
    basePrice: 18,
    discountPolicy: [
      'No discount for orders below 200 units',
      'Orders of 200 to 799 units receive a 22% discount',
      'Orders of 800 or more units receive a 32% discount'
    ],
    shippingTime: 1
  },
  
  // Tools & Hardware vendors
  {
    id: 'vendor85',
    name: 'Tool World',
    category: 'Tools & Hardware',
    product: 'Hand Tools',
    inventory: 3500,
    basePrice: 55,
    discountPolicy: [
      'No discount for orders below 40 units',
      'Orders of 40 to 159 units receive a 18% discount',
      'Orders of 160 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor86',
    name: 'Power Tools Pro',
    category: 'Tools & Hardware',
    product: 'Power Tools',
    inventory: 1200,
    basePrice: 180,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 15% discount',
      'Orders of 40 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor87',
    name: 'Hardware Store',
    category: 'Tools & Hardware',
    product: 'Nuts, Bolts & Fasteners',
    inventory: 8000,
    basePrice: 8,
    discountPolicy: [
      'Orders of 500 or more units receive a 25% discount',
      'Orders of 2000 or more units receive a 35% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor88',
    name: 'Safety Equipment',
    category: 'Tools & Hardware',
    product: 'Safety Gear & Equipment',
    inventory: 2500,
    basePrice: 45,
    discountPolicy: [
      'Orders of 30 or more units receive a 19% discount',
      'Orders of 120 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor89',
    name: 'Welding Supplies',
    category: 'Tools & Hardware',
    product: 'Welding Equipment',
    inventory: 800,
    basePrice: 250,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 12% discount',
      'Orders of 32 or more units receive a 22% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor90',
    name: 'Plumbing Supplies',
    category: 'Tools & Hardware',
    product: 'Plumbing Tools & Parts',
    inventory: 1800,
    basePrice: 75,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 16% discount',
      'Orders of 80 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  
  // Additional vendors for existing categories to reach 200
  // Electronics (more)
  {
    id: 'vendor91',
    name: 'Smartphone World',
    category: 'Electronics',
    product: 'Android Smartphones',
    inventory: 600,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 10% discount',
      'Orders of 32 or more units receive a 18% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor92',
    name: 'Audio Visual Pro',
    category: 'Electronics',
    product: 'Home Theater Systems',
    inventory: 400,
    basePrice: 650,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 12% discount',
      'Orders of 20 or more units receive a 20% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor93',
    name: 'Gaming Accessories',
    category: 'Electronics',
    product: 'Gaming Controllers',
    inventory: 1500,
    basePrice: 85,
    discountPolicy: [
      'Orders of 25 or more units receive a 18% discount',
      'Orders of 100 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor94',
    name: 'Computer Parts',
    category: 'Electronics',
    product: 'Computer Components',
    inventory: 2200,
    basePrice: 120,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 59 units receive a 16% discount',
      'Orders of 60 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor95',
    name: 'Network Solutions',
    category: 'Electronics',
    product: 'Networking Equipment',
    inventory: 800,
    basePrice: 180,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 14% discount',
      'Orders of 40 or more units receive a 24% discount'
    ],
    shippingTime: 3
  },
  
  // Clothing (more)
  {
    id: 'vendor96',
    name: 'Summer Collection',
    category: 'Clothing',
    product: 'Summer Clothing',
    inventory: 3500,
    basePrice: 35,
    discountPolicy: [
      'No discount for orders below 50 units',
      'Orders of 50 to 199 units receive a 19% discount',
      'Orders of 200 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor97',
    name: 'Workwear Pro',
    category: 'Clothing',
    product: 'Work Uniforms',
    inventory: 2800,
    basePrice: 65,
    discountPolicy: [
      'Orders of 40 or more units receive a 20% discount',
      'Orders of 160 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor98',
    name: 'Lingerie World',
    category: 'Clothing',
    product: 'Intimate Apparel',
    inventory: 1800,
    basePrice: 45,
    discountPolicy: [
      'No discount for orders below 30 units',
      'Orders of 30 to 119 units receive a 17% discount',
      'Orders of 120 or more units receive a 27% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor99',
    name: 'Shoe World',
    category: 'Clothing',
    product: 'Women\'s Shoes',
    inventory: 2500,
    basePrice: 75,
    discountPolicy: [
      'No discount for orders below 25 units',
      'Orders of 25 to 99 units receive a 18% discount',
      'Orders of 100 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor100',
    name: 'Accessories Plus',
    category: 'Clothing',
    product: 'Jewelry & Watches',
    inventory: 1200,
    basePrice: 120,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 59 units receive a 15% discount',
      'Orders of 60 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  
  // Additional vendors to reach 200 (101-150)
  {
    id: 'vendor101',
    name: 'Pet Supplies Co',
    category: 'Pet Supplies',
    product: 'Pet Food & Treats',
    inventory: 5000,
    basePrice: 22,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 399 units receive a 20% discount',
      'Orders of 400 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor102',
    name: 'Pet Accessories',
    category: 'Pet Supplies',
    product: 'Pet Toys & Accessories',
    inventory: 3500,
    basePrice: 18,
    discountPolicy: [
      'Orders of 150 or more units receive a 22% discount',
      'Orders of 600 or more units receive a 32% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor103',
    name: 'Baby Products',
    category: 'Baby & Kids',
    product: 'Baby Diapers & Wipes',
    inventory: 8000,
    basePrice: 15,
    discountPolicy: [
      'No discount for orders below 200 units',
      'Orders of 200 to 799 units receive a 25% discount',
      'Orders of 800 or more units receive a 35% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor104',
    name: 'Baby Gear',
    category: 'Baby & Kids',
    product: 'Baby Strollers & Car Seats',
    inventory: 1200,
    basePrice: 180,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 15% discount',
      'Orders of 40 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor105',
    name: 'Musical Instruments',
    category: 'Music & Entertainment',
    product: 'Guitars & String Instruments',
    inventory: 800,
    basePrice: 350,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 12% discount',
      'Orders of 32 or more units receive a 22% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor106',
    name: 'DJ Equipment',
    category: 'Music & Entertainment',
    product: 'DJ Controllers & Mixers',
    inventory: 400,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 10% discount',
      'Orders of 20 or more units receive a 18% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor107',
    name: 'Photography Gear',
    category: 'Photography',
    product: 'Camera Lenses',
    inventory: 600,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 14% discount',
      'Orders of 40 or more units receive a 24% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor108',
    name: 'Studio Equipment',
    category: 'Photography',
    product: 'Studio Lighting',
    inventory: 300,
    basePrice: 180,
    discountPolicy: [
      'Orders of 15 or more units receive a 16% discount',
      'Orders of 60 or more units receive a 26% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor109',
    name: 'Camping Gear',
    category: 'Outdoor & Recreation',
    product: 'Tents & Sleeping Bags',
    inventory: 1200,
    basePrice: 120,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 17% discount',
      'Orders of 80 or more units receive a 27% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor110',
    name: 'Hiking Equipment',
    category: 'Outdoor & Recreation',
    product: 'Backpacks & Hiking Gear',
    inventory: 1800,
    basePrice: 85,
    discountPolicy: [
      'Orders of 25 or more units receive a 18% discount',
      'Orders of 100 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor111',
    name: 'Fitness Equipment',
    category: 'Sports Equipment',
    product: 'Exercise Machines',
    inventory: 600,
    basePrice: 350,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 13% discount',
      'Orders of 32 or more units receive a 23% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor112',
    name: 'Team Sports',
    category: 'Sports Equipment',
    product: 'Team Sports Equipment',
    inventory: 1500,
    basePrice: 95,
    discountPolicy: [
      'No discount for orders below 25 units',
      'Orders of 25 to 99 units receive a 19% discount',
      'Orders of 100 or more units receive a 29% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor113',
    name: 'Water Sports',
    category: 'Sports Equipment',
    product: 'Water Sports Equipment',
    inventory: 800,
    basePrice: 150,
    discountPolicy: [
      'Orders of 15 or more units receive a 17% discount',
      'Orders of 60 or more units receive a 27% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor114',
    name: 'Winter Sports',
    category: 'Sports Equipment',
    product: 'Skiing & Snowboarding',
    inventory: 600,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 15% discount',
      'Orders of 40 or more units receive a 25% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor115',
    name: 'Martial Arts',
    category: 'Sports Equipment',
    product: 'Martial Arts Equipment',
    inventory: 1000,
    basePrice: 75,
    discountPolicy: [
      'Orders of 20 or more units receive a 18% discount',
      'Orders of 80 or more units receive a 28% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor116',
    name: 'Dance Supplies',
    category: 'Sports Equipment',
    product: 'Dance Wear & Shoes',
    inventory: 1200,
    basePrice: 65,
    discountPolicy: [
      'No discount for orders below 30 units',
      'Orders of 30 to 119 units receive a 16% discount',
      'Orders of 120 or more units receive a 26% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor117',
    name: 'Medical Supplies',
    category: 'Healthcare',
    product: 'Medical Equipment',
    inventory: 800,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 12% discount',
      'Orders of 32 or more units receive a 22% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor118',
    name: 'Dental Supplies',
    category: 'Healthcare',
    product: 'Dental Equipment',
    inventory: 500,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 14% discount',
      'Orders of 40 or more units receive a 24% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor119',
    name: 'First Aid',
    category: 'Healthcare',
    product: 'First Aid Kits',
    inventory: 2000,
    basePrice: 45,
    discountPolicy: [
      'Orders of 40 or more units receive a 19% discount',
      'Orders of 160 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor120',
    name: 'Pharmaceuticals',
    category: 'Healthcare',
    product: 'Over-the-Counter Medicine',
    inventory: 3500,
    basePrice: 25,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 399 units receive a 20% discount',
      'Orders of 400 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor121',
    name: 'Lab Equipment',
    category: 'Healthcare',
    product: 'Laboratory Equipment',
    inventory: 400,
    basePrice: 650,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 11% discount',
      'Orders of 20 or more units receive a 21% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor122',
    name: 'Veterinary Supplies',
    category: 'Healthcare',
    product: 'Veterinary Equipment',
    inventory: 600,
    basePrice: 380,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 13% discount',
      'Orders of 32 or more units receive a 23% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor123',
    name: 'Industrial Tools',
    category: 'Tools & Hardware',
    product: 'Industrial Machinery',
    inventory: 200,
    basePrice: 1200,
    discountPolicy: [
      'No discount for orders below 3 units',
      'Orders of 3 to 11 units receive a 10% discount',
      'Orders of 12 or more units receive a 20% discount'
    ],
    shippingTime: 6
  },
  {
    id: 'vendor124',
    name: 'Electrical Supplies',
    category: 'Tools & Hardware',
    product: 'Electrical Components',
    inventory: 4000,
    basePrice: 35,
    discountPolicy: [
      'No discount for orders below 80 units',
      'Orders of 80 to 319 units receive a 18% discount',
      'Orders of 320 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor125',
    name: 'HVAC Equipment',
    category: 'Tools & Hardware',
    product: 'HVAC Systems',
    inventory: 300,
    basePrice: 850,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 12% discount',
      'Orders of 20 or more units receive a 22% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor126',
    name: 'Construction Materials',
    category: 'Tools & Hardware',
    product: 'Building Materials',
    inventory: 2500,
    basePrice: 95,
    discountPolicy: [
      'Orders of 30 or more units receive a 17% discount',
      'Orders of 120 or more units receive a 27% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor127',
    name: 'Paint & Coatings',
    category: 'Tools & Hardware',
    product: 'Industrial Paints',
    inventory: 1800,
    basePrice: 65,
    discountPolicy: [
      'No discount for orders below 40 units',
      'Orders of 40 to 159 units receive a 19% discount',
      'Orders of 160 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor128',
    name: 'Adhesives & Sealants',
    category: 'Tools & Hardware',
    product: 'Industrial Adhesives',
    inventory: 2200,
    basePrice: 45,
    discountPolicy: [
      'Orders of 50 or more units receive a 20% discount',
      'Orders of 200 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor129',
    name: 'Lubricants & Oils',
    category: 'Tools & Hardware',
    product: 'Industrial Lubricants',
    inventory: 3000,
    basePrice: 28,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 399 units receive a 21% discount',
      'Orders of 400 or more units receive a 31% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor130',
    name: 'Measuring Tools',
    category: 'Tools & Hardware',
    product: 'Precision Measuring',
    inventory: 1500,
    basePrice: 85,
    discountPolicy: [
      'No discount for orders below 25 units',
      'Orders of 25 to 99 units receive a 16% discount',
      'Orders of 100 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  
  // Final vendors to reach 200 (131-200)
  {
    id: 'vendor131',
    name: 'Jewelry Supplies',
    category: 'Jewelry & Watches',
    product: 'Jewelry Making Supplies',
    inventory: 1800,
    basePrice: 55,
    discountPolicy: [
      'Orders of 30 or more units receive a 18% discount',
      'Orders of 120 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor132',
    name: 'Watch Parts',
    category: 'Jewelry & Watches',
    product: 'Watch Components',
    inventory: 1200,
    basePrice: 85,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 15% discount',
      'Orders of 80 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor133',
    name: 'Luxury Watches',
    category: 'Jewelry & Watches',
    product: 'Premium Watches',
    inventory: 300,
    basePrice: 850,
    discountPolicy: [
      'No discount for orders below 3 units',
      'Orders of 3 to 11 units receive a 8% discount',
      'Orders of 12 or more units receive a 15% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor134',
    name: 'Gemstones',
    category: 'Jewelry & Watches',
    product: 'Precious Stones',
    inventory: 800,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 12% discount',
      'Orders of 40 or more units receive a 22% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor135',
    name: 'Metals & Alloys',
    category: 'Jewelry & Watches',
    product: 'Precious Metals',
    inventory: 600,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 10% discount',
      'Orders of 32 or more units receive a 18% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor136',
    name: 'Craft Supplies',
    category: 'Arts & Crafts',
    product: 'Craft Materials',
    inventory: 4000,
    basePrice: 25,
    discountPolicy: [
      'No discount for orders below 80 units',
      'Orders of 80 to 319 units receive a 20% discount',
      'Orders of 320 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor137',
    name: 'Painting Supplies',
    category: 'Arts & Crafts',
    product: 'Art Paints & Brushes',
    inventory: 2800,
    basePrice: 35,
    discountPolicy: [
      'Orders of 50 or more units receive a 19% discount',
      'Orders of 200 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor138',
    name: 'Sewing Supplies',
    category: 'Arts & Crafts',
    product: 'Sewing Materials',
    inventory: 2200,
    basePrice: 28,
    discountPolicy: [
      'No discount for orders below 60 units',
      'Orders of 60 to 239 units receive a 18% discount',
      'Orders of 240 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor139',
    name: 'Scrapbooking',
    category: 'Arts & Crafts',
    product: 'Scrapbooking Supplies',
    inventory: 1800,
    basePrice: 32,
    discountPolicy: [
      'Orders of 40 or more units receive a 17% discount',
      'Orders of 160 or more units receive a 27% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor140',
    name: 'Pottery Supplies',
    category: 'Arts & Crafts',
    product: 'Pottery & Ceramics',
    inventory: 1200,
    basePrice: 65,
    discountPolicy: [
      'No discount for orders below 25 units',
      'Orders of 25 to 99 units receive a 16% discount',
      'Orders of 100 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor141',
    name: 'Baking Supplies',
    category: 'Food & Beverages',
    product: 'Baking Ingredients',
    inventory: 3500,
    basePrice: 22,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 399 units receive a 21% discount',
      'Orders of 400 or more units receive a 31% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor142',
    name: 'Spices & Seasonings',
    category: 'Food & Beverages',
    product: 'Cooking Spices',
    inventory: 2800,
    basePrice: 18,
    discountPolicy: [
      'Orders of 150 or more units receive a 22% discount',
      'Orders of 600 or more units receive a 32% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor143',
    name: 'Canned Goods',
    category: 'Food & Beverages',
    product: 'Canned Foods',
    inventory: 6000,
    basePrice: 12,
    discountPolicy: [
      'No discount for orders below 300 units',
      'Orders of 300 to 1199 units receive a 24% discount',
      'Orders of 1200 or more units receive a 34% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor144',
    name: 'Frozen Foods',
    category: 'Food & Beverages',
    product: 'Frozen Food Products',
    inventory: 2500,
    basePrice: 28,
    discountPolicy: [
      'Orders of 80 or more units receive a 20% discount',
      'Orders of 320 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor145',
    name: 'Organic Produce',
    category: 'Food & Beverages',
    product: 'Organic Fruits & Vegetables',
    inventory: 1800,
    basePrice: 35,
    discountPolicy: [
      'No discount for orders below 50 units',
      'Orders of 50 to 199 units receive a 19% discount',
      'Orders of 200 or more units receive a 29% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor146',
    name: 'Pet Food Premium',
    category: 'Pet Supplies',
    product: 'Premium Pet Food',
    inventory: 3200,
    basePrice: 45,
    discountPolicy: [
      'No discount for orders below 60 units',
      'Orders of 60 to 239 units receive a 18% discount',
      'Orders of 240 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor147',
    name: 'Pet Grooming',
    category: 'Pet Supplies',
    product: 'Pet Grooming Supplies',
    inventory: 1500,
    basePrice: 38,
    discountPolicy: [
      'Orders of 35 or more units receive a 17% discount',
      'Orders of 140 or more units receive a 27% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor148',
    name: 'Aquarium Supplies',
    category: 'Pet Supplies',
    product: 'Fish Tank Equipment',
    inventory: 800,
    basePrice: 85,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 59 units receive a 15% discount',
      'Orders of 60 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor149',
    name: 'Bird Supplies',
    category: 'Pet Supplies',
    product: 'Bird Food & Accessories',
    inventory: 1200,
    basePrice: 32,
    discountPolicy: [
      'Orders of 40 or more units receive a 19% discount',
      'Orders of 160 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor150',
    name: 'Reptile Supplies',
    category: 'Pet Supplies',
    product: 'Reptile Care Products',
    inventory: 600,
    basePrice: 55,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 16% discount',
      'Orders of 80 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor151',
    name: 'Baby Formula',
    category: 'Baby & Kids',
    product: 'Infant Formula',
    inventory: 4000,
    basePrice: 35,
    discountPolicy: [
      'No discount for orders below 80 units',
      'Orders of 80 to 319 units receive a 20% discount',
      'Orders of 320 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor152',
    name: 'Baby Toys',
    category: 'Baby & Kids',
    product: 'Infant Toys',
    inventory: 2800,
    basePrice: 28,
    discountPolicy: [
      'Orders of 50 or more units receive a 18% discount',
      'Orders of 200 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor153',
    name: 'Kids Furniture',
    category: 'Baby & Kids',
    product: 'Children\'s Furniture',
    inventory: 800,
    basePrice: 120,
    discountPolicy: [
      'No discount for orders below 12 units',
      'Orders of 12 to 47 units receive a 14% discount',
      'Orders of 48 or more units receive a 24% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor154',
    name: 'School Supplies',
    category: 'Baby & Kids',
    product: 'Educational Supplies',
    inventory: 5000,
    basePrice: 15,
    discountPolicy: [
      'No discount for orders below 200 units',
      'Orders of 200 to 799 units receive a 23% discount',
      'Orders of 800 or more units receive a 33% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor155',
    name: 'Kids Books',
    category: 'Baby & Kids',
    product: 'Children\'s Books',
    inventory: 3500,
    basePrice: 18,
    discountPolicy: [
      'Orders of 100 or more units receive a 21% discount',
      'Orders of 400 or more units receive a 31% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor156',
    name: 'Piano World',
    category: 'Music & Entertainment',
    product: 'Pianos & Keyboards',
    inventory: 200,
    basePrice: 1200,
    discountPolicy: [
      'No discount for orders below 3 units',
      'Orders of 3 to 11 units receive a 8% discount',
      'Orders of 12 or more units receive a 15% discount'
    ],
    shippingTime: 6
  },
  {
    id: 'vendor157',
    name: 'Drum Equipment',
    category: 'Music & Entertainment',
    product: 'Drums & Percussion',
    inventory: 600,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 13% discount',
      'Orders of 40 or more units receive a 23% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor158',
    name: 'Sound Systems',
    category: 'Music & Entertainment',
    product: 'PA Systems & Speakers',
    inventory: 400,
    basePrice: 550,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 11% discount',
      'Orders of 20 or more units receive a 19% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor159',
    name: 'Recording Equipment',
    category: 'Music & Entertainment',
    product: 'Studio Recording Gear',
    inventory: 300,
    basePrice: 380,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 12% discount',
      'Orders of 32 or more units receive a 22% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor160',
    name: 'Sheet Music',
    category: 'Music & Entertainment',
    product: 'Musical Scores & Books',
    inventory: 1500,
    basePrice: 25,
    discountPolicy: [
      'Orders of 60 or more units receive a 20% discount',
      'Orders of 240 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor161',
    name: 'Video Equipment',
    category: 'Photography',
    product: 'Video Cameras',
    inventory: 400,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 11% discount',
      'Orders of 32 or more units receive a 21% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor162',
    name: 'Drone Equipment',
    category: 'Photography',
    product: 'Drones & Accessories',
    inventory: 300,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 13% discount',
      'Orders of 40 or more units receive a 23% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor163',
    name: 'Photo Printing',
    category: 'Photography',
    product: 'Photo Printers & Paper',
    inventory: 800,
    basePrice: 180,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 59 units receive a 15% discount',
      'Orders of 60 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor164',
    name: 'Camera Bags',
    category: 'Photography',
    product: 'Camera Cases & Bags',
    inventory: 1200,
    basePrice: 65,
    discountPolicy: [
      'Orders of 25 or more units receive a 17% discount',
      'Orders of 100 or more units receive a 27% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor165',
    name: 'Tripods & Stands',
    category: 'Photography',
    product: 'Camera Tripods',
    inventory: 900,
    basePrice: 95,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 16% discount',
      'Orders of 80 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor166',
    name: 'Rock Climbing',
    category: 'Outdoor & Recreation',
    product: 'Climbing Equipment',
    inventory: 600,
    basePrice: 180,
    discountPolicy: [
      'No discount for orders below 12 units',
      'Orders of 12 to 47 units receive a 14% discount',
      'Orders of 48 or more units receive a 24% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor167',
    name: 'Cycling World',
    category: 'Outdoor & Recreation',
    product: 'Bicycles & Parts',
    inventory: 400,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 11% discount',
      'Orders of 32 or more units receive a 21% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor168',
    name: 'Fishing World',
    category: 'Outdoor & Recreation',
    product: 'Fishing Rods & Reels',
    inventory: 800,
    basePrice: 120,
    discountPolicy: [
      'Orders of 20 or more units receive a 18% discount',
      'Orders of 80 or more units receive a 28% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor169',
    name: 'Hunting Gear',
    category: 'Outdoor & Recreation',
    product: 'Hunting Equipment',
    inventory: 500,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 13% discount',
      'Orders of 40 or more units receive a 23% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor170',
    name: 'Boating Supplies',
    category: 'Outdoor & Recreation',
    product: 'Boat Equipment',
    inventory: 300,
    basePrice: 380,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 12% discount',
      'Orders of 32 or more units receive a 22% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor171',
    name: 'Surgical Instruments',
    category: 'Healthcare',
    product: 'Surgical Tools',
    inventory: 400,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 13% discount',
      'Orders of 40 or more units receive a 23% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor172',
    name: 'Diagnostic Equipment',
    category: 'Healthcare',
    product: 'Medical Diagnostic Tools',
    inventory: 300,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 11% discount',
      'Orders of 32 or more units receive a 21% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor173',
    name: 'Physical Therapy',
    category: 'Healthcare',
    product: 'Physical Therapy Equipment',
    inventory: 600,
    basePrice: 180,
    discountPolicy: [
      'Orders of 15 or more units receive a 16% discount',
      'Orders of 60 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor174',
    name: 'Optical Equipment',
    category: 'Healthcare',
    product: 'Optical Instruments',
    inventory: 400,
    basePrice: 320,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 12% discount',
      'Orders of 40 or more units receive a 22% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor175',
    name: 'Rehabilitation',
    category: 'Healthcare',
    product: 'Rehabilitation Equipment',
    inventory: 500,
    basePrice: 250,
    discountPolicy: [
      'No discount for orders below 12 units',
      'Orders of 12 to 47 units receive a 14% discount',
      'Orders of 48 or more units receive a 24% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor176',
    name: 'Automotive Tools',
    category: 'Automotive',
    product: 'Automotive Repair Tools',
    inventory: 1500,
    basePrice: 95,
    discountPolicy: [
      'No discount for orders below 20 units',
      'Orders of 20 to 79 units receive a 16% discount',
      'Orders of 80 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor177',
    name: 'Car Electronics',
    category: 'Automotive',
    product: 'Car Audio & Navigation',
    inventory: 800,
    basePrice: 180,
    discountPolicy: [
      'Orders of 15 or more units receive a 17% discount',
      'Orders of 60 or more units receive a 27% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor178',
    name: 'Car Care',
    category: 'Automotive',
    product: 'Car Cleaning Products',
    inventory: 2500,
    basePrice: 28,
    discountPolicy: [
      'No discount for orders below 80 units',
      'Orders of 80 to 319 units receive a 19% discount',
      'Orders of 320 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor179',
    name: 'Motorcycle Parts',
    category: 'Automotive',
    product: 'Motorcycle Accessories',
    inventory: 600,
    basePrice: 120,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 59 units receive a 15% discount',
      'Orders of 60 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor180',
    name: 'Truck Parts',
    category: 'Automotive',
    product: 'Truck Components',
    inventory: 400,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 13% discount',
      'Orders of 40 or more units receive a 23% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor181',
    name: 'Luxury Furniture',
    category: 'Furniture',
    product: 'Premium Furniture',
    inventory: 200,
    basePrice: 1200,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 10% discount',
      'Orders of 20 or more units receive a 18% discount'
    ],
    shippingTime: 6
  },
  {
    id: 'vendor182',
    name: 'Antique Furniture',
    category: 'Furniture',
    product: 'Antique Pieces',
    inventory: 100,
    basePrice: 1800,
    discountPolicy: [
      'No discount for orders below 3 units',
      'Orders of 3 to 11 units receive a 8% discount',
      'Orders of 12 or more units receive a 15% discount'
    ],
    shippingTime: 7
  },
  {
    id: 'vendor183',
    name: 'Garden Furniture',
    category: 'Furniture',
    product: 'Outdoor Furniture',
    inventory: 800,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 59 units receive a 14% discount',
      'Orders of 60 or more units receive a 24% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor184',
    name: 'Modular Furniture',
    category: 'Furniture',
    product: 'Modular Systems',
    inventory: 600,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 12% discount',
      'Orders of 40 or more units receive a 22% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor185',
    name: 'Custom Furniture',
    category: 'Furniture',
    product: 'Custom Made Furniture',
    inventory: 150,
    basePrice: 850,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 11% discount',
      'Orders of 20 or more units receive a 19% discount'
    ],
    shippingTime: 8
  },
  {
    id: 'vendor186',
    name: 'Smart Home',
    category: 'Electronics',
    product: 'Smart Home Systems',
    inventory: 400,
    basePrice: 380,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 13% discount',
      'Orders of 40 or more units receive a 23% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor187',
    name: 'Virtual Reality',
    category: 'Electronics',
    product: 'VR Headsets & Equipment',
    inventory: 300,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 12 units',
      'Orders of 12 to 47 units receive a 14% discount',
      'Orders of 48 or more units receive a 24% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor188',
    name: 'Augmented Reality',
    category: 'Electronics',
    product: 'AR Devices & Software',
    inventory: 200,
    basePrice: 450,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 11% discount',
      'Orders of 32 or more units receive a 21% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor189',
    name: 'Robotics',
    category: 'Electronics',
    product: 'Robotic Systems',
    inventory: 150,
    basePrice: 850,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 10% discount',
      'Orders of 20 or more units receive a 18% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor190',
    name: '3D Printing',
    category: 'Electronics',
    product: '3D Printers & Materials',
    inventory: 400,
    basePrice: 380,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 13% discount',
      'Orders of 40 or more units receive a 23% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor191',
    name: 'Sustainable Fashion',
    category: 'Clothing',
    product: 'Eco-Friendly Clothing',
    inventory: 1200,
    basePrice: 85,
    discountPolicy: [
      'Orders of 25 or more units receive a 18% discount',
      'Orders of 100 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor192',
    name: 'Vintage Clothing',
    category: 'Clothing',
    product: 'Vintage Apparel',
    inventory: 800,
    basePrice: 120,
    discountPolicy: [
      'No discount for orders below 15 units',
      'Orders of 15 to 59 units receive a 15% discount',
      'Orders of 60 or more units receive a 25% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor193',
    name: 'Designer Clothing',
    category: 'Clothing',
    product: 'Designer Apparel',
    inventory: 400,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 12% discount',
      'Orders of 40 or more units receive a 22% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor194',
    name: 'Athletic Wear',
    category: 'Clothing',
    product: 'Sports Apparel',
    inventory: 2800,
    basePrice: 55,
    discountPolicy: [
      'No discount for orders below 40 units',
      'Orders of 40 to 159 units receive a 19% discount',
      'Orders of 160 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor195',
    name: 'Formal Wear',
    category: 'Clothing',
    product: 'Formal Attire',
    inventory: 600,
    basePrice: 180,
    discountPolicy: [
      'Orders of 20 or more units receive a 16% discount',
      'Orders of 80 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor196',
    name: 'Swimwear',
    category: 'Clothing',
    product: 'Swimming Apparel',
    inventory: 1500,
    basePrice: 45,
    discountPolicy: [
      'No discount for orders below 30 units',
      'Orders of 30 to 119 units receive a 17% discount',
      'Orders of 120 or more units receive a 27% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor197',
    name: 'Sleepwear',
    category: 'Clothing',
    product: 'Sleepwear & Loungewear',
    inventory: 2000,
    basePrice: 35,
    discountPolicy: [
      'Orders of 50 or more units receive a 18% discount',
      'Orders of 200 or more units receive a 28% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor198',
    name: 'Underwear',
    category: 'Clothing',
    product: 'Underwear & Socks',
    inventory: 4000,
    basePrice: 15,
    discountPolicy: [
      'No discount for orders below 200 units',
      'Orders of 200 to 799 units receive a 22% discount',
      'Orders of 800 or more units receive a 32% discount'
    ],
    shippingTime: 1
  },
  {
    id: 'vendor199',
    name: 'Hats & Caps',
    category: 'Clothing',
    product: 'Headwear',
    inventory: 3000,
    basePrice: 25,
    discountPolicy: [
      'No discount for orders below 100 units',
      'Orders of 100 to 399 units receive a 20% discount',
      'Orders of 400 or more units receive a 30% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor200',
    name: 'Scarves & Gloves',
    category: 'Clothing',
    product: 'Winter Accessories',
    inventory: 2500,
    basePrice: 22,
    discountPolicy: [
      'Orders of 80 or more units receive a 19% discount',
      'Orders of 320 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  
  // Additional 12 vendors (201-212)
  {
    id: 'vendor201',
    name: 'Solar Energy',
    category: 'Electronics',
    product: 'Solar Panels & Systems',
    inventory: 200,
    basePrice: 850,
    discountPolicy: [
      'No discount for orders below 5 units',
      'Orders of 5 to 19 units receive a 12% discount',
      'Orders of 20 or more units receive a 20% discount'
    ],
    shippingTime: 5
  },
  {
    id: 'vendor202',
    name: 'Wind Energy',
    category: 'Electronics',
    product: 'Wind Turbines',
    inventory: 50,
    basePrice: 2500,
    discountPolicy: [
      'No discount for orders below 2 units',
      'Orders of 2 to 9 units receive a 8% discount',
      'Orders of 10 or more units receive a 15% discount'
    ],
    shippingTime: 8
  },
  {
    id: 'vendor203',
    name: 'Battery Systems',
    category: 'Electronics',
    product: 'Energy Storage Batteries',
    inventory: 300,
    basePrice: 650,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 11% discount',
      'Orders of 32 or more units receive a 19% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor204',
    name: 'Electric Vehicles',
    category: 'Automotive',
    product: 'EV Charging Stations',
    inventory: 100,
    basePrice: 1200,
    discountPolicy: [
      'No discount for orders below 3 units',
      'Orders of 3 to 11 units receive a 10% discount',
      'Orders of 12 or more units receive a 18% discount'
    ],
    shippingTime: 6
  },
  {
    id: 'vendor205',
    name: 'Hybrid Vehicles',
    category: 'Automotive',
    product: 'Hybrid Car Parts',
    inventory: 400,
    basePrice: 380,
    discountPolicy: [
      'No discount for orders below 10 units',
      'Orders of 10 to 39 units receive a 13% discount',
      'Orders of 40 or more units receive a 23% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor206',
    name: 'Sustainable Materials',
    category: 'Tools & Hardware',
    product: 'Eco-Friendly Building Materials',
    inventory: 800,
    basePrice: 120,
    discountPolicy: [
      'Orders of 20 or more units receive a 16% discount',
      'Orders of 80 or more units receive a 26% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor207',
    name: 'Green Technology',
    category: 'Electronics',
    product: 'Environmental Monitoring Systems',
    inventory: 150,
    basePrice: 550,
    discountPolicy: [
      'No discount for orders below 8 units',
      'Orders of 8 to 31 units receive a 12% discount',
      'Orders of 32 or more units receive a 20% discount'
    ],
    shippingTime: 4
  },
  {
    id: 'vendor208',
    name: 'Organic Clothing',
    category: 'Clothing',
    product: 'Organic Cotton Apparel',
    inventory: 1200,
    basePrice: 65,
    discountPolicy: [
      'No discount for orders below 30 units',
      'Orders of 30 to 119 units receive a 17% discount',
      'Orders of 120 or more units receive a 27% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor209',
    name: 'Recycled Materials',
    category: 'Tools & Hardware',
    product: 'Recycled Construction Materials',
    inventory: 600,
    basePrice: 85,
    discountPolicy: [
      'Orders of 25 or more units receive a 18% discount',
      'Orders of 100 or more units receive a 28% discount'
    ],
    shippingTime: 3
  },
  {
    id: 'vendor210',
    name: 'Biodegradable Products',
    category: 'Home & Garden',
    product: 'Biodegradable Household Items',
    inventory: 2000,
    basePrice: 28,
    discountPolicy: [
      'No discount for orders below 80 units',
      'Orders of 80 to 319 units receive a 19% discount',
      'Orders of 320 or more units receive a 29% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor211',
    name: 'Water Conservation',
    category: 'Home & Garden',
    product: 'Water Saving Devices',
    inventory: 1500,
    basePrice: 45,
    discountPolicy: [
      'Orders of 35 or more units receive a 16% discount',
      'Orders of 140 or more units receive a 26% discount'
    ],
    shippingTime: 2
  },
  {
    id: 'vendor212',
    name: 'Carbon Neutral',
    category: 'Electronics',
    product: 'Carbon Neutral Electronics',
    inventory: 250,
    basePrice: 280,
    discountPolicy: [
      'No discount for orders below 12 units',
      'Orders of 12 to 47 units receive a 14% discount',
      'Orders of 48 or more units receive a 24% discount'
    ],
    shippingTime: 3
  }
];

export function VendorTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typingTimer, setTypingTimer] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'inventory' | 'shipping'>('price');
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [data, setData] = useState<VendorData[]>([]);
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  // Range filters
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(10000);
  const [stockMin, setStockMin] = useState(0);
  const [stockMax, setStockMax] = useState(100000);
  // Shipping filter removed

  // Bounds
  const [priceBoundMin, setPriceBoundMin] = useState(0);
  const [priceBoundMax, setPriceBoundMax] = useState(10000);
  const [stockBoundMin, setStockBoundMin] = useState(0);
  const [stockBoundMax, setStockBoundMax] = useState(100000);
  // Shipping bounds removed

  async function fetchVendorsFromApi(query?: string) {
      try {
        const url = query && query.trim().length > 0 ? `/api/vendor?q=${encodeURIComponent(query.trim())}` : '/api/vendor';
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();
        const rows: Array<{ id: string; name: string; categories?: string[]; total_inventory?: number; min_price?: number | null; fastest_lead_time?: number | null }>
          = res.ok && json?.ok ? (json.vendors ?? []) : [];

        const vendors: VendorData[] = rows
          .filter(v => (v.total_inventory ?? 0) > 0) // hide vendors without products/stock
          .map(v => ({
            id: v.id,
            name: v.name,
            categories: Array.isArray(v.categories) ? v.categories : [],
            category: Array.isArray(v.categories) && v.categories.length > 0 ? v.categories[0] : '—',
            product: '—',
            inventory: v.total_inventory ?? 0,
            basePrice: v.min_price ?? 0,
            discountPolicy: [],
            shippingTime: v.fastest_lead_time ?? 0
          }));

        setData(vendors);

        if (vendors.length > 0) {
          const prices = vendors.map(v => v.basePrice).filter((n) => typeof n === 'number');
          const stocks = vendors.map(v => v.inventory).filter((n) => typeof n === 'number');
          const pmin = Math.max(0, Math.min(...prices));
          const pmax = Math.max(...prices);
          const smin = Math.max(0, Math.min(...stocks));
          const smax = Math.max(...stocks);
          setPriceBoundMin(Math.floor(pmin / 50) * 50);
          setPriceBoundMax(Math.ceil(pmax / 50) * 50 || 50);
          setStockBoundMin(Math.floor(smin / 50) * 50);
          setStockBoundMax(Math.ceil(smax / 50) * 50 || 50);
          setPriceMin(Math.floor(pmin / 50) * 50);
          setPriceMax(Math.ceil(pmax / 50) * 50 || 50);
          setStockMin(Math.floor(smin / 50) * 50);
          setStockMax(Math.ceil(smax / 50) * 50 || 50);
        }
      } catch {}
  }

  useEffect(() => { fetchVendorsFromApi(); }, []);

  // Debounced server search
  useEffect(() => {
    if (typingTimer) clearTimeout(typingTimer);
    const t = setTimeout(() => { fetchVendorsFromApi(searchTerm); }, 350);
    setTypingTimer(t);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const categories = ['all', ...Array.from(new Set(data.flatMap(v => v.categories.length ? v.categories : [v.category])))];

  const filteredVendors = data.filter(vendor =>
    (selectedCategory === 'all' || vendor.categories.includes(selectedCategory)) &&
    vendor.basePrice >= priceMin && vendor.basePrice <= priceMax &&
    vendor.inventory >= stockMin && vendor.inventory <= stockMax
  );

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.basePrice - b.basePrice;
      case 'inventory':
        return b.inventory - a.inventory;
      case 'shipping':
        return a.shippingTime - b.shippingTime;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleChatClick = (vendor: VendorData) => {
    setSelectedVendor(vendor);
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    setSelectedVendor(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Summary Stats - Outside the main table */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <h4 className="font-semibold text-sm mb-2">Summary Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Total Inventory:</span>
            <p className="font-medium">{sortedVendors.reduce((sum, v) => sum + v.inventory, 0).toLocaleString()} units</p>
          </div>
          <div>
            <span className="text-muted-foreground">Lowest Price:</span>
            <p className="font-medium">${sortedVendors.length > 0 ? Math.min(...sortedVendors.map(v => v.basePrice)) : 0} USD</p>
          </div>
          <div>
            <span className="text-muted-foreground">Highest Price:</span>
            <p className="font-medium">${sortedVendors.length > 0 ? Math.max(...sortedVendors.map(v => v.basePrice)) : 0} USD</p>
          </div>
          <div>
            <span className="text-muted-foreground">Fastest Shipping:</span>
            <p className="font-medium">{sortedVendors.length > 0 ? Math.min(...sortedVendors.map(v => v.shippingTime)) : 0} days</p>
          </div>
        </div>
        
        {/* Category Breakdown */}
        {selectedCategory === 'all' && (
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <h5 className="font-medium text-sm mb-2">Categories Breakdown</h5>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
              {categories.slice(1).map((category) => {
                const categoryVendors = data.filter(v => v.category === category);
                const totalInventory = categoryVendors.reduce((sum, v) => sum + v.inventory, 0);
                return (
                  <div key={category} className="text-center">
                    <Badge variant="outline" className="text-xs mb-1">
                      {category}
                    </Badge>
                    <p className="font-medium">{categoryVendors.length} vendors</p>
                    <p className="text-muted-foreground">{totalInventory.toLocaleString()} units</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Vendor Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Vendor Inventory & Pricing</span>
            <Badge variant="secondary" className="ml-auto">
              {sortedVendors.length} Vendors
            </Badge>
          </CardTitle>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 mt-4">
            {/* Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between text-xs mb-1"><span>Price (USD)</span><span>${priceMin} - ${priceMax}</span></div>
                <DualRangeSlider
                  min={priceBoundMin}
                  max={priceBoundMax}
                  step={10}
                  value={[priceMin, priceMax]}
                  onValueChange={(v: number[]) => { setPriceMin(v[0]); setPriceMax(v[1]); }}
                  label={(v) => v}
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1"><span>Stock (units)</span><span>{stockMin} - {stockMax}</span></div>
                <DualRangeSlider
                  min={stockBoundMin}
                  max={stockBoundMax}
                  step={50}
                  value={[stockMin, stockMax]}
                  onValueChange={(v: number[]) => { setStockMin(v[0]); setStockMax(v[1]); }}
                  label={(v) => v}
                />
              </div>
              {/* Shipping slider removed */}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors or products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Buttons removed as requested */}
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  {category === 'all' ? 'All Categories' : category}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
        <div className="space-y-4">
          {sortedVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No vendors found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            sortedVendors.map((vendor, index) => (
                          <div key={vendor.id}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg items-center">
                  {/* Vendor Name & Basic Info */}
                  <div className="md:col-span-1">
                    <h3 className="font-semibold text-lg text-primary">{vendor.name}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>ID: {vendor.id}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {vendor.category}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-2">
                      {vendor.product}
                    </p>
                  </div>

                {/* Inventory & Pricing */}
                <div className="md:col-span-1">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Inventory:</span>
                      <Badge variant="outline" className="text-xs">
                        {vendor.inventory.toLocaleString()} units
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Base Price:</span>
                      <Badge variant="default" className="text-xs">
                        ${vendor.basePrice} USD
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Shipping label removed */}

                {/* Discount Policy removed */}

                {/* Chat Button */}
                <div className="md:col-span-1 flex items-center md:justify-end">
                  <Button
                    onClick={() => handleChatClick(vendor)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-xs"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Start Quote
                  </Button>
                </div>
              </div>
              
              {index < sortedVendors.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))
          )}
        </div>
      </CardContent>
    </Card>

    {/* Vendor Chat Modal */}
    <VendorChatModal
      isOpen={isChatModalOpen}
      onClose={handleCloseChat}
      vendor={selectedVendor}
    />
    </div>
  );
}