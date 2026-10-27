import type { ItemCardData } from "../types/item";

export const mockItems: ItemCardData[] = [
  {
    id: "item-1",
    title: "Beamer für einen Filmabend",
    description: "Ein Beamer mit HDMI-Anschluss und Fernbedienung.",
    pricePerDay: "15.50",
    city: "Berlin",
    category: {
      id: "category-1",
      name: "Elektronik",
    },
    images: [
      {
        id: "image-1",
        url: "https://images.unsplash.com/photo-1589113050289-1c654e7e305d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        order: 0,
      },
    ],
    owner: {
      id: "user-1",
      name: "Olga",
      city: "Berlin",
    },
    isPublished: true,
  },
  {
    id: "item-2",
    title: "Akku-Bohrschrauber",
    description: "Leistungsstarker Bohrschrauber mit zwei Akkus.",
    pricePerDay: "12.00",
    city: "Hamburg",
    category: {
      id: "category-2",
      name: "Werkzeuge",
    },
    images: [
      {
        id: "image-2",
        url: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        order: 0,
      },
    ],
    owner: {
      id: "user-2",
      name: "Max",
      city: "Hamburg",
    },
    isPublished: true,
  },
  {
    id: "item-3",
    title: "Campingzelt für 4 Personen",
    description: "Wasserdichtes Zelt für Wochenendausflüge.",
    pricePerDay: "20.00",
    city: "Köln",
    category: {
      id: "category-3",
      name: "Freizeit",
    },
    images: [
      {
        id: "image-3",
        url: "https://images.unsplash.com/photo-1775626095828-cb5312e199b1?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
        order: 0,
      },
    ],
    owner: {
      id: "user-3",
      name: "Lena",
      city: "Köln",
    },
    isPublished: true,
  },
];
