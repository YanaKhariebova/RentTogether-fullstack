import type { ItemCardData } from '../types/item';

export const mockItems: ItemCardData[] = [
  {
    id: 'item-1',
    title: 'Beamer für einen Filmabend',
    description: 'Ein Beamer mit HDMI-Anschluss und Fernbedienung.',
    pricePerDay: '15.50',
    city: 'Berlin',
    category: {
      id: 'category-1',
      name: 'Elektronik',
    },
    images: [
      {
        id: 'image-1',
        url: 'https://images.unsplash.com/photo-1589113050289-1c654e7e305d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
        order: 0,
      },
    ],
    owner: {
      id: 'user-1',
      name: 'Olga',
      city: 'Berlin',
    },
    isPublished: true,
  },
  {
    id: 'item-2',
    title: 'Akku-Bohrschrauber',
    description: 'Leistungsstarker Bohrschrauber mit zwei Akkus.',
    pricePerDay: '12.00',
    city: 'Hamburg',
    category: {
      id: 'category-2',
      name: 'Werkzeuge',
    },
    images: [
      {
        id: 'image-2',
        url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
        order: 0,
      },
    ],
    owner: {
      id: 'user-2',
      name: 'Max',
      city: 'Hamburg',
    },
    isPublished: true,
  },
  {
    id: 'item-3',
    title: 'Campingzelt für 4 Personen',
    description: 'Wasserdichtes Zelt für Wochenendausflüge.',
    pricePerDay: '20.00',
    city: 'Köln',
    category: {
      id: 'category-3',
      name: 'Freizeit',
    },
    images: [
      {
        id: 'image-3',
        url: 'https://images.unsplash.com/photo-1775626095828-cb5312e199b1?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
        order: 0,
      },
    ],
    owner: {
      id: 'user-3',
      name: 'Lena',
      city: 'Köln',
    },
    isPublished: true,
  },
  {
    id: 'item-4',
    title: 'Spiegelreflexkamera mit Objektiv',
    description: 'Kamera mit 18–55-mm-Objektiv für Ausflüge und Events.',
    pricePerDay: '28.00',
    city: 'Berlin',
    category: {
      id: 'category-4',
      name: 'Kamera & Fotografie',
    },
    images: [
      {
        id: 'image-4',
        url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-4',
      name: 'David',
      city: 'Berlin',
    },
    isPublished: true,
  },
  {
    id: 'item-5',
    title: 'City-E-Bike',
    description: 'Bequemes E-Bike mit Schloss und abnehmbarem Akku.',
    pricePerDay: '25.00',
    city: 'München',
    category: {
      id: 'category-3',
      name: 'Sport & Freizeit',
    },
    images: [
      {
        id: 'image-5',
        url: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-5',
      name: 'Sofia',
      city: 'München',
    },
    isPublished: true,
  },
  {
    id: 'item-6',
    title: 'Kaffeevollautomat',
    description: 'Vollautomatische Kaffeemaschine für Cappuccino und Espresso.',
    pricePerDay: '18.00',
    city: 'Köln',
    category: {
      id: 'category-5',
      name: 'Küche & Haushalt',
    },
    images: [
      {
        id: 'image-6',
        url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-6',
      name: 'Emre',
      city: 'Köln',
    },
    isPublished: true,
  },
  {
    id: 'item-7',
    title: 'Hochdruckreiniger',
    description: 'Kompakter Hochdruckreiniger für Terrasse, Fahrrad und Auto.',
    pricePerDay: '22.00',
    city: 'Hamburg',
    category: {
      id: 'category-2',
      name: 'Werkzeuge',
    },
    images: [
      {
        id: 'image-7',
        url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-7',
      name: 'Anna',
      city: 'Hamburg',
    },
    isPublished: true,
  },
  {
    id: 'item-8',
    title: 'Nähmaschine für Anfänger',
    description: 'Einfache Nähmaschine inklusive Grundausstattung und Anleitung.',
    pricePerDay: '10.00',
    city: 'Frankfurt',
    category: {
      id: 'category-5',
      name: 'Küche & Haushalt',
    },
    images: [
      {
        id: 'image-8',
        url: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-8',
      name: 'Lea',
      city: 'Frankfurt',
    },
    isPublished: true,
  },
  {
    id: 'item-9',
    title: 'Kinderwagen',
    description: 'Robuster Kinderwagen für Spaziergänge in der Stadt.',
    pricePerDay: '14.00',
    city: 'Berlin',
    category: {
      id: 'category-6',
      name: 'Baby & Kind',
    },
    images: [
      {
        id: 'image-9',
        url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-9',
      name: 'Marie',
      city: 'Berlin',
    },
    isPublished: true,
  },
  {
    id: 'item-10',
    title: 'Akustikgitarre',
    description: 'Westerngitarre mit Tasche, Stimmgerät und Ersatzsaiten.',
    pricePerDay: '16.00',
    city: 'München',
    category: {
      id: 'category-3',
      name: 'Sport & Freizeit',
    },
    images: [
      {
        id: 'image-10',
        url: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-10',
      name: 'Paul',
      city: 'München',
    },
    isPublished: true,
  },
  {
    id: 'item-11',
    title: 'Werkzeugkoffer für kleine Reparaturen',
    description: 'Vollständiger Werkzeugkoffer mit Hammer, Schraubendrehern und Zangen.',
    pricePerDay: '11.00',
    city: 'Stuttgart',
    category: {
      id: 'category-2',
      name: 'Werkzeuge',
    },
    images: [
      {
        id: 'image-11',
        url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-11',
      name: 'Nora',
      city: 'Stuttgart',
    },
    isPublished: true,
  },
  {
    id: 'item-12',
    title: 'Plattenspieler mit Lautsprechern',
    description: 'Plattenspieler inklusive zwei kompakter Lautsprecher für einen Musikabend.',
    pricePerDay: '19.00',
    city: 'Leipzig',
    category: {
      id: 'category-1',
      name: 'Elektronik',
    },
    images: [
      {
        id: 'image-12',
        url: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-12',
      name: 'Tobias',
      city: 'Leipzig',
    },
    isPublished: true,
  },
  {
    id: 'item-13',
    title: 'Kinderfahrrad mit Helm',
    description: 'Gut erhaltenes Kinderfahrrad inklusive passendem Fahrradhelm.',
    pricePerDay: '9.00',
    city: 'Dresden',
    category: {
      id: 'category-3',
      name: 'Sport & Freizeit',
    },
    images: [
      {
        id: 'image-13',
        url: 'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-13',
      name: 'Jana',
      city: 'Dresden',
    },
    isPublished: true,
  },
  {
    id: 'item-14',
    title: 'Partyzelt für den Garten',
    description: 'Wetterfestes Partyzelt mit Seitenwänden für Feiern im Freien.',
    pricePerDay: '30.00',
    city: 'Düsseldorf',
    category: {
      id: 'category-3',
      name: 'Sport & Freizeit',
    },
    images: [
      {
        id: 'image-14',
        url: 'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-14',
      name: 'Sven',
      city: 'Düsseldorf',
    },
    isPublished: true,
  },
  {
    id: 'item-15',
    title: 'Standmixer für Smoothies',
    description: 'Leistungsstarker Standmixer mit Glasbehälter und mehreren Stufen.',
    pricePerDay: '8.00',
    city: 'Nürnberg',
    category: {
      id: 'category-5',
      name: 'Küche & Haushalt',
    },
    images: [
      {
        id: 'image-15',
        url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 'user-15',
      name: 'Mara',
      city: 'Nürnberg',
    },
    isPublished: true,
  },
];
