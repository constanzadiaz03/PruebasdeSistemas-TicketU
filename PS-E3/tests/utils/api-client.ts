import { APIRequestContext, request } from '@playwright/test';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface EventData {
  eventId: string;
  title: string;
  startDate: string;
  endDate?: string;
  status: string;
}

export interface ReviewData {
  eventId: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsSummary {
  count: number;
  average: number;
  distribution: Record<string, number>;
  reviews: ReviewResponse[];
}

/**
 * Cliente API para interactuar con el backend de TicketU
 * Usado para setup/teardown y validaciones de estado
 */
export class ApiClient {
  private apiContext: APIRequestContext;
  private baseUrl: string;

  constructor(apiContext: APIRequestContext, baseUrl = 'https://pruebasdesistemauv.com/ticketu/api') {
    this.apiContext = apiContext;
    this.baseUrl = baseUrl;
  }

  static async create(baseUrl = 'https://pruebasdesistemauv.com/ticketu/api'): Promise<ApiClient> {
    const apiContext = await request.newContext({
      baseURL: baseUrl,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    return new ApiClient(apiContext, baseUrl);
  }

  async login(credentials: UserCredentials): Promise<AuthTokens> {
    const response = await this.apiContext.post('/auth/login', {
      data: credentials,
    });

    if (!response.ok()) {
      const error = await response.text();
      throw new Error(`Login failed: ${response.status()} - ${error}`);
    }

    const data = await response.json();
    return {
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  }

  async getReviewsSummary(eventId: string, token?: string): Promise<ReviewsSummary> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await this.apiContext.get(`/reviews/events/${eventId}`, { headers });
    if (!response.ok()) {
      throw new Error(`Failed to get reviews summary: ${response.status()}`);
    }
    return response.json();
  }

  async getPendingReviews(token: string): Promise<EventData[]> {
    const response = await this.apiContext.get('/reviews/pending', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok()) {
      throw new Error(`Failed to get pending reviews: ${response.status()}`);
    }
    return response.json();
  }

  async getMyReviews(token: string): Promise<ReviewResponse[]> {
    const response = await this.apiContext.get('/reviews/mine', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok()) {
      throw new Error(`Failed to get my reviews: ${response.status()}`);
    }
    return response.json();
  }

  async createReview(token: string, review: ReviewData): Promise<ReviewResponse> {
    const response = await this.apiContext.post('/reviews/reviews', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: review,
    });
    const data = await response.json();
    if (!response.ok()) {
      throw new Error(`Create review failed: ${response.status()} - ${data.message || JSON.stringify(data)}`);
    }
    return data;
  }

  async deleteReview(token: string, reviewId: string): Promise<void> {
    const response = await this.apiContext.delete(`/reviews/reviews/${reviewId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok() && response.status() !== 404) {
      const data = await response.json();
      throw new Error(`Delete review failed: ${response.status()} - ${data.message || JSON.stringify(data)}`);
    }
  }

  async getEventFromCatalog(eventId: string): Promise<EventData> {
    const response = await this.apiContext.get(`/catalog/events/${eventId}`);
    if (!response.ok()) {
      throw new Error(`Failed to get event: ${response.status()}`);
    }
    return response.json();
  }

  async dispose(): Promise<void> {
    await this.apiContext.dispose();
  }
}

/**
 * Credenciales de prueba conocidas (del ambiente de pruebas)
 */
export const TEST_USERS = {
  beto: {
    email: 'beto@ticketu.cl',
    password: 'Ticketu2026',
    role: 'student',
    description: 'Estudiante con check-in en eventos terminados',
  },
  ana: {
    email: 'ana@ticketu.cl',
    password: 'Ticketu2026',
    role: 'student',
    description: 'Estudiante sin check-in',
  },
  organizador1: {
    email: 'cealumnos@ticketu.cl',
    password: 'Ticketu2026',
    role: 'organizer',
    description: 'Organizador principal',
  },
  organizador2: {
    email: 'deportes@ticketu.cl',
    password: 'Ticketu2026',
    role: 'organizer',
    description: 'Segundo organizador',
  },
} as const;

/**
 * Datos de prueba para reseñas
 */
export const REVIEW_TEST_DATA = {
  valid: {
    rating: 4,
    comment: 'Excelente evento, muy bien organizado',
  },
  minRating: {
    rating: 1,
    comment: 'Mínimo aceptable',
  },
  maxRating: {
    rating: 5,
    comment: 'Perfecto, lo mejor',
  },
  longComment: {
    rating: 3,
    comment: 'a'.repeat(501), // Excede límite de 500
  },
  maxLengthComment: {
    rating: 3,
    comment: 'a'.repeat(500), // Exacto límite
  },
  emptyComment: {
    rating: 3,
    comment: '',
  },
  noComment: {
    rating: 3,
  },
  inappropriateComment: {
    rating: 3,
    comment: 'Este evento es una mierda, muy malo', // Lenguaje inapropiado
  },
  invalidRatings: [
    { rating: 0, comment: 'Rating 0' },
    { rating: 6, comment: 'Rating 6' },
    { rating: 3.5, comment: 'Rating decimal' },
    { rating: -1, comment: 'Rating negativo' },
    { rating: 'cinco' as any, comment: 'Rating texto' },
    { rating: null as any, comment: 'Rating null' },
    { comment: 'Sin rating' },
  ],
} as const;