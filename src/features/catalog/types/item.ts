export type ItemCardData = {
  id: string;
  title: string;
  description: string;
  pricePerDay: string;
  city: string;
  category: {
    id: string;
    name: string;
  };
  images: {
    id: string;
    url: string;
    order: number;
  }[];
  owner: {
    id: string;
    name: string;
    city: string;
  };
  isPublished: boolean;
};
