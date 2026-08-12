import * as lucideIcons from 'lucide-react';
import { PlaceHolderImages } from './placeholder-images';

export const appIconUrl = "/app-logo.png";

const findImage = (id: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (!img) return { imageUrl: '', imageHint: '' };
    return { imageUrl: img.imageUrl, imageHint: img.imageHint };
};

// Category ID to modern expressive Lucide icon mapping
const categoryDefaultIcons: { [key: string]: lucideIcons.LucideIcon } = {
    vehicles: lucideIcons.CarFront,
    realestate: lucideIcons.Building2,
    mobiles: lucideIcons.Smartphone,
    jobs: lucideIcons.Briefcase,
    furniture: lucideIcons.Sofa,
    electronics: lucideIcons.Tv,
    fashion: lucideIcons.Sparkles,
    pets: lucideIcons.Dog,
    baby: lucideIcons.Baby,
    hobbies: lucideIcons.Dumbbell,
    trade: lucideIcons.Factory,
    services: lucideIcons.Wrench,
    crafts: lucideIcons.Wrench,
    transport: lucideIcons.Truck,
};

// Comprehensive mapping from string names to Lucide icon components.
const iconMap: { [key: string]: lucideIcons.LucideIcon } = {
    Smartphone: lucideIcons.Smartphone,
    Sofa: lucideIcons.Sofa,
    Car: lucideIcons.CarFront, // map legacy Car to modern CarFront
    CarFront: lucideIcons.CarFront,
    Building: lucideIcons.Building2, // map legacy Building to modern Building2
    Building2: lucideIcons.Building2,
    Shirt: lucideIcons.Shirt,
    ShoppingBag: lucideIcons.ShoppingBag,
    Briefcase: lucideIcons.Briefcase,
    Handshake: lucideIcons.Handshake,
    Heart: lucideIcons.Heart,
    Home: lucideIcons.Home,
    PawPrint: lucideIcons.PawPrint,
    Dog: lucideIcons.Dog,
    Cat: lucideIcons.Cat,
    Bird: lucideIcons.Bird,
    Fish: lucideIcons.Fish,
    Paintbrush: lucideIcons.Paintbrush,
    Tablet: lucideIcons.Tablet,
    Tv: lucideIcons.Tv,
    Laptop: lucideIcons.Laptop,
    Truck: lucideIcons.Truck,
    Bus: lucideIcons.Bus,
    Shapes: lucideIcons.Shapes,
    PackageSearch: lucideIcons.PackageSearch,
    Music: lucideIcons.Music,
    Camera: lucideIcons.Camera,
    Gamepad2: lucideIcons.Gamepad2,
    Baby: lucideIcons.Baby,
    Dumbbell: lucideIcons.Dumbbell,
    Factory: lucideIcons.Factory,
    Wrench: lucideIcons.Wrench,
    Sparkles: lucideIcons.Sparkles,
    Store: lucideIcons.Store,
    BookOpen: lucideIcons.BookOpen,
    Cpu: lucideIcons.Cpu,
    Watch: lucideIcons.Watch,
    HardHat: lucideIcons.HardHat,
    Headphones: lucideIcons.Headphones,
    Crown: lucideIcons.Crown,
    Trophy: lucideIcons.Trophy,
    // Electronic Devices Icons
    Monitor: lucideIcons.Monitor,
    Radio: lucideIcons.Radio,
    Speaker: lucideIcons.Speaker,
    Mic: lucideIcons.Mic,
    Plug: lucideIcons.Plug,
    BatteryCharging: lucideIcons.BatteryCharging,
    Printer: lucideIcons.Printer,
    Server: lucideIcons.Server,
    HardDrive: lucideIcons.HardDrive,
    Router: lucideIcons.Router,
    CircuitBoard: lucideIcons.CircuitBoard,
    Projector: lucideIcons.Projector,
    Fan: lucideIcons.Fan,
    Zap: lucideIcons.Zap,
    // Additional Category Icons
    Bike: lucideIcons.Bike,
    Utensils: lucideIcons.Utensils,
    GraduationCap: lucideIcons.GraduationCap,
    Stethoscope: lucideIcons.Stethoscope,
    Plane: lucideIcons.Plane,
    KeyRound: lucideIcons.KeyRound,
};

// Function to get icon component from its string name or category ID
export const getCategoryIcon = (iconName: string, categoryId?: string): lucideIcons.LucideIcon => {
    if (categoryId && categoryDefaultIcons[categoryId] && (!iconName || iconName === 'Shapes' || iconName === 'Car' || iconName === 'Building')) {
        return categoryDefaultIcons[categoryId];
    }
    return iconMap[iconName] || (categoryId ? categoryDefaultIcons[categoryId] : null) || lucideIcons.Shapes;
};
