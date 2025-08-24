import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import type { Swiper as SwiperCore } from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import type Cropper from 'cropperjs';
import type { MediaFormatted } from '../types';

// --- HERO CAROUSEL ---
interface HeroCarouselProps {
    items: MediaFormatted[];
}
export const HeroCarousel: React.FC<HeroCarouselProps> = ({ items }) => {
    if (!items || items.length === 0) return null;

    return (
        <section className="h-[90vh] relative -mt-16">
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                loop={true}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                navigation={true}
                className="h-full hero-carousel"
            >
                {items.map(item => (
                    <SwiperSlide key={item.id}>
                        <img src={item.background} className="absolute inset-0 w-full h-full object-cover filter brightness-50" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
                        <div className="container mx-auto px-6 md:px-8 h-full flex items-end pb-24 relative z-10">
                            <div className="max-w-2xl text-white">
                                <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">{item.title}</h1>
                                <p className="text-gray-300 mb-8 line-clamp-3 md:text-lg">{item.synopsis || 'Sinopse não disponível.'}</p>
                                <div className="flex flex-wrap items-center gap-4">
                                    <Link to={`/media/${item.type}/${item.id}`} className="bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg flex items-center gap-2 text-base w-max hover:bg-yellow-600 transition-colors">
                                        <Info className="w-5 h-5" /> Informações
                                    </Link>
                                    <Link to={`/player/${item.type.replace('series', 'tv')}/${item.id}`} className="bg-white/90 text-black font-bold py-3 px-6 rounded-lg flex items-center gap-2 text-base w-max hover:bg-white transition-colors">
                                        <Play className="w-5 h-5" /> Assistir
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
};


// --- MEDIA CARD & CAROUSEL ---
interface MediaCardProps {
    item: MediaFormatted;
}
export const MediaCard: React.FC<MediaCardProps> = ({ item }) => (
    <Link to={`/media/${item.type}/${item.id}`} className="group block">
        <div className="relative aspect-[2/3] bg-surface rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl">
            <img loading="lazy" src={item.poster} alt={item.title} className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-75" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-14 h-14 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center">
                    <Play className="w-7 h-7 text-white ml-1" />
                </div>
            </div>
            <img src="https://i.ibb.co/PGJ87dN5/cineveo-logo-r.png" alt="CineVEO Logo" className="absolute bottom-2 right-2 w-auto h-4 opacity-60 z-10" />
        </div>
        <h3 className="font-semibold text-white/90 truncate mt-2 text-sm group-hover:text-yellow-400">{item.title}</h3>
        <p className="text-xs text-gray-400">{item.year}</p>
    </Link>
);

interface MediaCarouselProps {
    title: string;
    items: MediaFormatted[];
    viewMoreLink?: string;
}
export const MediaCarousel: React.FC<MediaCarouselProps> = ({ title, items, viewMoreLink }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex justify-between items-baseline mb-4 px-4 sm:px-8">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                {viewMoreLink && <Link to={viewMoreLink} className="text-yellow-400 font-semibold hover:underline text-sm">Ver todos</Link>}
            </div>
            <div className="flex overflow-x-auto py-4 -mb-4 pl-4 sm:pl-8 gap-x-4 sm:gap-x-5" style={{ scrollbarWidth: 'none' }}>
                {items.map(item => (
                    <div key={item.id} className="flex-shrink-0 w-36 sm:w-44">
                      <MediaCard item={item} />
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- SPINNER ---
export const Spinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="border-4 border-gray-700 border-t-yellow-500 rounded-full w-12 h-12 animate-spin"></div>
    </div>
);


// --- NOTIFICATIONS ---
type NotificationType = 'info' | 'success' | 'error';
interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}
interface NotificationContextType {
    addNotification: (message: string, type?: NotificationType) => void;
}
const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (message: string, type: NotificationType = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <div className="fixed top-20 right-4 z-50 space-y-2">
                {notifications.map(n => (
                    <div key={n.id} className={`notification-item shadow-lg rounded-lg p-4 text-white animate-fade-in-right 
                        ${n.type === 'success' ? 'bg-green-600' : n.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
                        {n.message}
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotification must be used within a NotificationProvider");
    return context;
};

// --- CROPPER MODAL ---
interface CropperModalProps {
    imageSrc: string | null;
    onConfirm: (cropper: Cropper) => void;
    onCancel: () => void;
}
export const CropperModal: React.FC<CropperModalProps> = ({ imageSrc, onConfirm, onCancel }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [cropper, setCropper] = useState<Cropper | null>(null);
    
    useEffect(() => {
        if (imgRef.current && imageSrc) {
            const cropperInstance = new (window as any).Cropper(imgRef.current, {
                aspectRatio: 1,
                viewMode: 1,
                background: false,
                autoCropArea: 1,
            });
            setCropper(cropperInstance);
            
            return () => {
                cropperInstance.destroy();
            };
        }
    }, [imageSrc]);

    if (!imageSrc) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-lg max-w-sm w-full border border-white/10">
                <h3 className="text-white text-lg font-bold mb-4">Cortar Imagem</h3>
                <div className="mb-4 max-h-64">
                    <img ref={imgRef} src={imageSrc} alt="Imagem para cortar" style={{ maxWidth: '100%' }} />
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={() => cropper && onConfirm(cropper)} className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg">Confirmar</button>
                </div>
            </div>
        </div>
    );
};