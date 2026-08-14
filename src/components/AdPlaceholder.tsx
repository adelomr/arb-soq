import React from 'react';
import { 
  Car, Building2, Smartphone, Briefcase, Sofa, Tv, 
  Sparkles, Dog, Baby, Dumbbell, Factory, Wrench, Truck, ImageIcon 
} from 'lucide-react';

interface AdPlaceholderProps {
  category?: string;
  className?: string;
  iconClassName?: string;
}

export default function AdPlaceholder({ category, className = "w-full h-full", iconClassName = "h-12 w-12" }: AdPlaceholderProps) {
  // تدوين الفئات واستخدام الألوان المناسبة والأيقونات لكل منها
  const config = (() => {
    switch (category) {
      case 'vehicles':
        return {
          icon: Car,
          gradient: 'from-orange-500/20 via-amber-500/10 to-amber-600/20 text-orange-600 dark:text-orange-400',
          bg: 'bg-gradient-to-br'
        };
      case 'realestate':
        return {
          icon: Building2,
          gradient: 'from-blue-500/20 via-cyan-500/10 to-indigo-600/20 text-indigo-600 dark:text-indigo-400',
          bg: 'bg-gradient-to-br'
        };
      case 'mobiles':
        return {
          icon: Smartphone,
          gradient: 'from-violet-500/20 via-purple-500/10 to-purple-600/20 text-purple-600 dark:text-purple-400',
          bg: 'bg-gradient-to-br'
        };
      case 'jobs':
        return {
          icon: Briefcase,
          gradient: 'from-emerald-500/20 via-teal-500/10 to-teal-600/20 text-teal-600 dark:text-teal-400',
          bg: 'bg-gradient-to-br'
        };
      case 'furniture':
        return {
          icon: Sofa,
          gradient: 'from-amber-700/20 via-yellow-600/10 to-yellow-900/20 text-amber-700 dark:text-amber-500',
          bg: 'bg-gradient-to-br'
        };
      case 'electronics':
        return {
          icon: Tv,
          gradient: 'from-cyan-500/20 via-sky-500/10 to-blue-600/20 text-blue-600 dark:text-blue-400',
          bg: 'bg-gradient-to-br'
        };
      case 'fashion':
        return {
          icon: Sparkles,
          gradient: 'from-pink-500/20 via-rose-500/10 to-rose-600/20 text-rose-600 dark:text-rose-400',
          bg: 'bg-gradient-to-br'
        };
      case 'pets':
        return {
          icon: Dog,
          gradient: 'from-lime-500/20 via-emerald-500/10 to-green-600/20 text-green-600 dark:text-green-400',
          bg: 'bg-gradient-to-br'
        };
      case 'baby':
        return {
          icon: Baby,
          gradient: 'from-sky-400/20 via-blue-400/10 to-blue-500/20 text-sky-500 dark:text-sky-400',
          bg: 'bg-gradient-to-br'
        };
      case 'hobbies':
        return {
          icon: Dumbbell,
          gradient: 'from-yellow-500/20 via-amber-500/10 to-amber-600/20 text-amber-600 dark:text-amber-400',
          bg: 'bg-gradient-to-br'
        };
      case 'trade':
        return {
          icon: Factory,
          gradient: 'from-gray-500/20 via-slate-500/10 to-slate-700/20 text-slate-700 dark:text-slate-400',
          bg: 'bg-gradient-to-br'
        };
      case 'services':
        return {
          icon: Wrench,
          gradient: 'from-violet-600/20 via-indigo-600/10 to-indigo-800/20 text-indigo-700 dark:text-indigo-400',
          bg: 'bg-gradient-to-br'
        };
      case 'crafts':
        return {
          icon: Wrench,
          gradient: 'from-orange-500/20 via-red-500/10 to-red-600/20 text-red-600 dark:text-red-400',
          bg: 'bg-gradient-to-br'
        };
      case 'transport':
        return {
          icon: Truck,
          gradient: 'from-emerald-600/20 via-teal-600/10 to-green-800/20 text-green-700 dark:text-green-400',
          bg: 'bg-gradient-to-br'
        };
      default:
        return {
          icon: ImageIcon,
          gradient: 'from-gray-100 to-gray-200 text-gray-400 dark:from-gray-800 dark:to-gray-900 dark:text-gray-600',
          bg: 'bg-gradient-to-br'
        };
    }
  })();

  const IconComponent = config.icon;

  return (
    <div className={`${className} flex flex-col items-center justify-center ${config.bg} ${config.gradient} select-none transition-all duration-300`}>
      <IconComponent className={`${iconClassName} stroke-[1.5] opacity-80`} />
      <span className="text-xs font-semibold mt-2 tracking-wider opacity-50 font-sans">سوق العرب</span>
    </div>
  );
}
