
import * as lucideIcons from 'lucide-react';
import { PlaceHolderImages } from './placeholder-images';

export const appIconUrl = "https://c.top4top.io/p_3553vhu5x1.png";

const findImage = (id: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (!img) return { imageUrl: '', imageHint: '' };
    return { imageUrl: img.imageUrl, imageHint: img.imageHint };
};

// A mapping from string names to Lucide icon components.
const iconMap: { [key: string]: lucideIcons.LucideIcon } = {
    Smartphone: lucideIcons.Smartphone,
    Sofa: lucideIcons.Sofa,
    Car: lucideIcons.Car,
    Building: lucideIcons.Building,
    Shirt: lucideIcons.Shirt,
    ShoppingBag: lucideIcons.ShoppingBag,
    Briefcase: lucideIcons.Briefcase,
    Handshake: lucideIcons.Handshake,
    Heart: lucideIcons.Heart,
    Home: lucideIcons.Home,
    PawPrint: lucideIcons.PawPrint,
    Paintbrush: lucideIcons.Paintbrush,
    Tablet: lucideIcons.Tablet,
    Tv: lucideIcons.Tv,
    Laptop: lucideIcons.Laptop,
    CarFront: lucideIcons.CarFront,
    Truck: lucideIcons.Truck,
    Bus: lucideIcons.Bus,
    Shapes: lucideIcons.Shapes,
    PackageSearch: lucideIcons.PackageSearch,
    Music: lucideIcons.Music,
    Camera: lucideIcons.Camera,
    Gamepad2: lucideIcons.Gamepad2,
};

// Function to get icon component from its string name
export const getCategoryIcon = (iconName: string): lucideIcons.LucideIcon => {
    return iconMap[iconName] || lucideIcons.Shapes; // Return a default icon if not found
};
