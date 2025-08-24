
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Media, MediaDetails, MediaFormatted } from '../types';

// --- CONFIGURATIONS ---
const firebaseConfig = {
    apiKey: "AIzaSyCNEGDpDLuWYrxTkoONy4oQujnatx6KIS8",
    authDomain: "cineveok.firebaseapp.com",
    projectId: "cineveok",
    storageBucket: "cineveok.appspot.com",
    appId: "1:805536124347:web:b408c28cb0a4dc914d089e"
};

const TMDB_API_KEY = '678cf2db5c3ab4a315d8ec632c493c7d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_URL = 'https://image.tmdb.org/t/p/w342';
const TMDB_IMG_ORIGINAL_URL = 'https://image.tmdb.org/t/p/original';
const IMGBB_API_KEY = '497da48eaf4aaa87f1f0b659ed76a605';

// --- FIREBASE INITIALIZATION ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- TMDB API SERVICE ---
export const fetchFromTMDB = async <T,>(endpoint: string, params: string = ''): Promise<T | null> => {
    const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=pt-BR${params}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`TMDB API request failed: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching from TMDB endpoint ${endpoint}:`, error);
        return null;
    }
};

export const formatTMDBData = (item: Media): MediaFormatted => {
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    return {
        id: item.id,
        title: (item as any).title || (item as any).name,
        poster: item.poster_path ? `${TMDB_IMG_URL}${item.poster_path}` : 'https://placehold.co/500x750/111111/1A1A1A?text=N/A',
        background: item.backdrop_path ? `${TMDB_IMG_ORIGINAL_URL}${item.backdrop_path}` : '',
        synopsis: item.overview,
        year: (item.release_date || item.first_air_date || '').substring(0, 4),
        type: type === 'tv' ? 'series' : 'movie',
    };
};

// --- IMAGE UPLOAD SERVICE ---
export const uploadImage = async (base64Image: string): Promise<string> => {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image.split(',')[1]);

    const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error?.message || 'Falha no upload da imagem.');
    }
    return result.data.url;
};
