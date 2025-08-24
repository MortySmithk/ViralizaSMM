import { Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";

export interface Media {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  vote_average?: number;
}

export interface MediaFormatted {
  id: number;
  title: string;
  poster: string;
  background: string;
  synopsis: string;
  year: string;
  type: 'movie' | 'series';
}

export interface CastMember {
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Season {
  season_number: number;
  name: string;
  episode_count: number;
}

export interface Episode {
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
}

export interface MediaDetails extends Media {
    genres?: { name: string }[];
    runtime?: number;
    episode_run_time?: number[];
    credits?: { cast: CastMember[] };
    seasons?: Season[];
}

export type FirebaseUser = User;

export interface UserProfile {
    username?: string;
    displayName: string;
    email: string;
    premium?: {
        plan: 'premium' | 'lifetime';
        expiresAt?: Timestamp;
    };
}

export interface Comment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorPhotoURL: string;
    createdAt: Timestamp;
}

export interface ReactionCounts {
    upvote: number;
    funny: number;
    love: number;
    surprised: number;
    angry: number;
    sad: number;
}

// --- NOVOS TIPOS ADICIONADOS ---

export interface ExternalIds {
  imdb_id?: string;
  tvdb_id?: number;
  wikidata_id?: string;
}

export interface Stream {
    name: string;
    description: string;
    url: string;
    proxyHeaders?: { request: Record<string, string> };
}

export interface StreamApiResponse {
    streams: Stream[];
    error?: string;
}