import React, { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp, Timestamp, onSnapshot, orderBy, addDoc, runTransaction, increment, deleteDoc } from 'firebase/firestore';
import { Home, Film, Tv, Crown, UserCircle2, Search, ArrowLeft, LogOut, Camera, Mic, MoreVertical, Trash2, ThumbsUp, MessageCircle, Link as LinkIcon, Bold, Italic, Underline, Strikethrough, Code } from 'lucide-react';

import { auth, db, fetchFromTMDB, formatTMDBData, uploadImage } from './services/api';
import { NotificationProvider, useNotification, Spinner, HeroCarousel, MediaCarousel, MediaCard, CropperModal } from './components/ui';
import type { FirebaseUser, UserProfile, Media, MediaFormatted, MediaDetails, Episode, Comment, ReactionCounts, ExternalIds, StreamApiResponse } from './types';

// --- AUTH CONTEXT ---
interface AuthContextType {
    user: FirebaseUser | null;
    profile: UserProfile | null;
    isAdmin: boolean;
    loading: boolean;
}
const AuthContext = createContext<AuthContextType>({ user: null, profile: null, isAdmin: false, loading: true });
const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const ADMIN_UIDS = ['YHBxowyZv0hzld7hypnEWHvx5K82', 'tMdWtkeZ7PYBk4l4UNKnbrLQ4i32'];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setIsAdmin(ADMIN_UIDS.includes(firebaseUser.uid));
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile);
                } else {
                    const newProfile: UserProfile = { 
                        displayName: firebaseUser.displayName || 'Usuário',
                        email: firebaseUser.email || '',
                    };
                    await setDoc(userDocRef, newProfile, { merge: true });
                    setProfile(newProfile);
                }
            } else {
                setUser(null);
                setProfile(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};


// --- LAYOUT COMPONENTS (HEADER, FOOTER) ---
const Header: React.FC = () => {
    const { user, isAdmin, profile } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/10">
                <nav className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-4 sm:gap-8">
                        <Link to="/" className="flex-shrink-0">
                            <img src="https://i.ibb.co/tPxYjZZ0/Gemini-Generated-Image-ejjiocejjiocejji-1.png" alt="Logo CineVEO" className="h-7 sm:h-8 w-auto"/>
                        </Link>
                        <div className="hidden md:flex items-center space-x-6">
                            <Link to="/" className="text-gray-300 font-medium hover:text-white">Início</Link>
                            <Link to="/filmes" className="text-gray-300 font-medium hover:text-white">Filmes</Link>
                            <Link to="/series" className="text-gray-300 font-medium hover:text-white">Séries</Link>
                            <Link to="/premium" className="text-gray-300 font-medium hover:text-white">👑 Premium</Link>
                            {isAdmin && <Link to="/admin" className="text-gray-300 font-medium hover:text-white">Admin</Link>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 justify-end">
                        <div className="relative flex items-center">
                             {user ? (
                                <div className="flex items-center gap-2">
                                     <Link to="/perfil" className="flex items-center gap-2 text-white font-semibold group">
                                         <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=1f2937&color=f3f4f6&size=64`} alt="Perfil" className="w-8 h-8 rounded-full object-cover border-2 border-gray-700 group-hover:border-yellow-500 transition-colors"/>
                                         <span className="hidden sm:inline-flex items-center group-hover:text-yellow-500 transition-colors">{user.displayName}</span>
                                     </Link>
                                     <button onClick={handleLogout} title="Sair" className="ml-2 p-2 text-gray-400 hover:text-white transition">
                                         <LogOut className="w-5 h-5"/>
                                     </button>
                                </div>
                            ) : (
                                <button onClick={() => setShowAuthModal(true)} className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition text-sm whitespace-nowrap">
                                    Entrar
                                </button>
                            )}
                        </div>
                    </div>
                </nav>
            </header>
            <AuthModal isVisible={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </>
    );
};

const Footer: React.FC = () => (
    <footer className="text-center py-12 px-4 text-gray-500 text-sm space-y-4 border-t border-white/10 mt-16 pb-24 lg:pb-12">
        <p>&copy; {new Date().getFullYear()} CineVEO. Todos os Direitos Reservados.</p>
        <p>Email para contato: <a href="mailto:cineveok@gmail.com" className="text-gray-400 hover:text-yellow-500 transition-colors">cineveok@gmail.com</a></p>
    </footer>
);

const MobileNav: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const getLinkClass = (path: string) => `flex flex-col items-center justify-center w-full p-1 transition-colors ${location.pathname === path ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`;
    
    return (
         <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 flex justify-around items-center py-2 z-40">
            <Link to="/" className={getLinkClass('/')}>
                <Home className="w-6 h-6 mb-1" />
                <span className="text-xs font-semibold">Início</span>
            </Link>
            <Link to="/filmes" className={getLinkClass('/filmes')}>
                <Film className="w-6 h-6 mb-1" />
                <span className="text-xs font-semibold">Filmes</span>
            </Link>
            <Link to="/series" className={getLinkClass('/series')}>
                <Tv className="w-6 h-6 mb-1" />
                <span className="text-xs font-semibold">Séries</span>
            </Link>
             <Link to="/premium" className={getLinkClass('/premium')}>
                <Crown className="w-6 h-6 mb-1" />
                <span className="text-xs font-semibold">Premium</span>
            </Link>
            {user && (
                 <Link to="/perfil" className={getLinkClass('/perfil')}>
                    <UserCircle2 className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Minha Conta</span>
                </Link>
            )}
        </nav>
    )
};


// --- LAYOUT ---
const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-20">
            {children}
        </main>
        <Footer />
        <MobileNav />
    </div>
);

// --- PAGES ---

const HomePage: React.FC = () => {
    const [heroItems, setHeroItems] = useState<MediaFormatted[]>([]);
    const [popularMovies, setPopularMovies] = useState<MediaFormatted[]>([]);
    const [popularSeries, setPopularSeries] = useState<MediaFormatted[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [moviesData, seriesData] = await Promise.all([
                fetchFromTMDB<{ results: Media[] }>('/movie/popular'),
                fetchFromTMDB<{ results: Media[] }>('/tv/popular')
            ]);
            
            if (moviesData) {
                const formattedMovies = moviesData.results.map(formatTMDBData);
                setPopularMovies(formattedMovies);
                setHeroItems(formattedMovies.filter(m => m.background).slice(0, 5));
            }
            if (seriesData) {
                setPopularSeries(seriesData.results.map(formatTMDBData));
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div className="pt-32"><Spinner /></div>;

    return (
        <>
            <HeroCarousel items={heroItems} />
            <div className="mt-8">
                <MediaCarousel title="Filmes Populares" items={popularMovies} viewMoreLink="/filmes" />
                <MediaCarousel title="Séries Populares" items={popularSeries} viewMoreLink="/series" />
            </div>
        </>
    );
};

const CatalogPage: React.FC<{type: 'movie' | 'tv'}> = ({ type }) => {
    const [items, setItems] = useState<MediaFormatted[]>([]);
    const [loading, setLoading] = useState(true);
    const pageTitle = type === 'movie' ? 'Filmes Populares' : 'Séries Populares';
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await fetchFromTMDB<{ results: Media[] }>(`/${type}/popular`);
            if (data) {
                setItems(data.results.map(formatTMDBData));
            }
            setLoading(false);
        };
        fetchData();
        window.scrollTo(0, 0);
    }, [type]);

    if (loading) return <div className="pt-32"><Spinner /></div>;
    
    return (
        <div className="container mx-auto px-4 sm:px-8 pt-12 md:pt-16">
            <h1 className="text-3xl font-bold text-white mb-8">{pageTitle}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                {items.map(item => <MediaCard key={item.id} item={item} />)}
            </div>
        </div>
    );
};

const PlayerPage: React.FC = () => {
    const { type, id, season, episode } = useParams();
    const [mediaDetails, setMediaDetails] = useState<MediaDetails | null>(null);
    const [recommendations, setRecommendations] = useState<MediaFormatted[]>([]);
    const [loading, setLoading] = useState(true);
    const [playerSrc, setPlayerSrc] = useState<string | null>(null);
    const [streamError, setStreamError] = useState<string | null>(null);

    const tmdbType = type === 'tv' ? 'tv' : 'movie';

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !type) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setPlayerSrc(null);
            setStreamError(null);
            const [details, recs] = await Promise.all([
                fetchFromTMDB<MediaDetails>(`/${tmdbType}/${id}`),
                fetchFromTMDB<{results: Media[]}>(`/${tmdbType}/${id}/recommendations`)
            ]);
            setMediaDetails(details);
            if(recs) {
                setRecommendations(recs.results.map(formatTMDBData));
            }
        };
        fetchData();
        window.scrollTo(0,0);
    }, [id, type, tmdbType]);
    
    useEffect(() => {
        const fetchStream = async () => {
            if (!mediaDetails || !id) return;

            try {
                const externalIds = await fetchFromTMDB<ExternalIds>(`/${tmdbType}/${id}/external_ids`);
                const imdbId = externalIds?.imdb_id;

                if (!imdbId) {
                    throw new Error("Não foi possível encontrar o ID do IMDb para este título.");
                }

                let streamApiUrl = '';
                if (tmdbType === 'movie') {
                    streamApiUrl = `/api/stream/movie/${imdbId}`;
                } else {
                    const s = season || '1';
                    const e = episode || '1';
                    streamApiUrl = `/api/stream/series/${imdbId}/${s}/${e}`;
                }

                const streamRes = await fetch(streamApiUrl);
                if (!streamRes.ok) {
                    throw new Error("O serviço de streaming não está respondendo.");
                }
                const streamData: StreamApiResponse = await streamRes.json();

                if (streamData.error || !streamData.streams || streamData.streams.length === 0) {
                    throw new Error(streamData.error || "Nenhum stream disponível encontrado.");
                }

                const firstStream = streamData.streams[0];
                let finalUrl = `/api/video-proxy?videoUrl=${encodeURIComponent(firstStream.url)}`;

                if (firstStream.proxyHeaders) {
                    const headers = firstStream.proxyHeaders.request || firstStream.proxyHeaders;
                    finalUrl += `&headers=${encodeURIComponent(JSON.stringify(headers))}`;
                }
                
                setPlayerSrc(finalUrl);

            } catch (error: any) {
                console.error("Erro ao buscar o stream:", error);
                setStreamError(error.message || "Ocorreu um erro ao carregar o vídeo.");
            } finally {
                setLoading(false);
            }
        };

        fetchStream();
    }, [mediaDetails, id, tmdbType, season, episode]);
    
    if (loading) return <div className="pt-32"><Spinner /></div>;
    if (!mediaDetails) return <div className="text-center pt-32">Conteúdo não encontrado.</div>;
    
    let title = (mediaDetails as any).title || (mediaDetails as any).name;
    if (type === 'tv') {
        const s = season || '1';
        const e = episode || '1';
        title += ` - T${s}:E${e}`;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 pt-8 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-9">
                    <div className="aspect-video w-full bg-black rounded-lg shadow-2xl shadow-yellow-500/10 overflow-hidden border border-white/10 mb-6">
                        {playerSrc ? (
                            <iframe src={playerSrc} allowFullScreen className="w-full h-full" frameBorder="0"></iframe>
                        ) : (
                             <div className="w-full h-full flex flex-col justify-center items-center">
                                {streamError ? (
                                    <p className="text-red-400 text-lg px-4 text-center">{streamError}</p>
                                ) : (
                                    <Spinner />
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
                        <p className="text-gray-400 text-sm md:text-base">{mediaDetails.overview}</p>
                    </div>
                    <section>
                         <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-yellow-500 pl-3">Recomendações</h2>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {recommendations.slice(0, 12).map(item => (
                                <MediaCard key={item.id} item={item} />
                            ))}
                         </div>
                    </section>
                </div>
                <div className="lg:col-span-3">
                     <div className="bg-gray-900 p-4 rounded-lg h-full max-h-[85vh] overflow-y-auto">
                        <p className="text-white">Em breve comentários...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlaceholderPage: React.FC<{title: string}> = ({title}) => (
    <div className="container mx-auto px-4 sm:px-8 pt-12 md:pt-16">
        <h1 className="text-3xl font-bold text-white mb-8">{title}</h1>
        <p className="text-gray-400">Esta página está em construção.</p>
    </div>
);


// --- AUTH MODAL ---
interface AuthModalProps {
    isVisible: boolean;
    onClose: () => void;
}
const AuthModal: React.FC<AuthModalProps> = ({ isVisible, onClose }) => {
    const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { email, password } = e.currentTarget.elements as any;
        try {
            await signInWithEmailAndPassword(auth, email.value, password.value);
            addNotification('Login bem-sucedido!', 'success');
            onClose();
        } catch (err: any) {
            setError('Email ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    };
    
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 w-full max-w-md rounded-2xl shadow-xl border border-white/10 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                
                {view === 'login' && (
                     <div className="p-8">
                        <h2 className="text-2xl font-bold text-white text-center mb-6">Entrar no CineVEO</h2>
                        {error && <p className="text-red-400 text-center text-sm mb-4 p-2 bg-red-900/50 rounded-lg">{error}</p>}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input name="email" type="email" className="bg-gray-800 border border-white/20 text-white text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full p-3" placeholder="Email" required />
                            <input name="password" type="password" className="bg-gray-800 border border-white/20 text-white text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block w-full p-3" placeholder="Senha" required />
                            <button type="submit" disabled={loading} className="w-full text-black bg-yellow-500 hover:bg-yellow-600 font-bold rounded-lg text-sm px-5 py-3 text-center disabled:bg-yellow-800">
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>
                        <p className="text-sm text-gray-400 text-center mt-6">Não tem uma conta? <button onClick={() => setView('register')} className="font-medium text-yellow-500 hover:underline">Cadastre-se</button></p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
function App() {
    return (
        <NotificationProvider>
            <AuthProvider>
                <HashRouter>
                    <Layout>
                        <Suspense fallback={<Spinner />}>
                             <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/filmes" element={<CatalogPage type="movie" />} />
                                <Route path="/series" element={<CatalogPage type="tv" />} />
                                <Route path="/player/:type/:id" element={<PlayerPage />} />
                                <Route path="/player/:type/:id/:season/:episode" element={<PlayerPage />} />
                                <Route path="/media/movie/:id" element={<PlaceholderPage title="Detalhes do Filme" />} />
                                <Route path="/media/series/:id" element={<PlaceholderPage title="Detalhes da Série" />} />
                                <Route path="/perfil" element={<PlaceholderPage title="Perfil" />} />
                                <Route path="/premium" element={<PlaceholderPage title="Premium" />} />
                                <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
                                <Route path="*" element={<PlaceholderPage title="Página não encontrada" />} />
                            </Routes>
                        </Suspense>
                    </Layout>
                </HashRouter>
            </AuthProvider>
        </NotificationProvider>
    );
}

export default App;