import { Book, ReadingList, Review, Recommendation } from '@/types';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * ============================================================================
 * API SERVICE LAYER - BACKEND COMMUNICATION
 * ============================================================================
 *
 * ⚠️ IMPORTANT: This file currently uses MOCK DATA for all API calls.
 *
 * TO IMPLEMENT AWS BACKEND:
 * Follow the step-by-step guide in IMPLEMENTATION_GUIDE.md
 *
 * Quick Reference:
 * - Week 2: Implement Books API (getBooks, getBook, createBook, etc.)
 * - Week 2: Implement Reading Lists API
 * - Week 3: Add Cognito authentication headers
 * - Week 4: Implement AI recommendations with Bedrock
 *
 * ============================================================================
 * IMPLEMENTATION CHECKLIST:
 * ============================================================================
 *
 * [ ] Week 1: Set up AWS account and first Lambda function
 * [ ] Week 2: Create DynamoDB tables (Books, ReadingLists)
 * [ ] Week 2: Deploy Lambda functions for Books API
 * [ ] Week 2: Deploy Lambda functions for Reading Lists API
 * [ ] Week 2: Set VITE_API_BASE_URL in .env file
 * [ ] Week 3: Set up Cognito User Pool
 * [ ] Week 3: Install aws-amplify: npm install aws-amplify
 * [ ] Week 3: Configure Amplify in src/main.tsx
 * [ ] Week 3: Update AuthContext with Cognito functions
 * [ ] Week 3: Implement getAuthHeaders() function below
 * [ ] Week 3: Add Cognito authorizer to API Gateway
 * [ ] Week 4: Deploy Bedrock recommendations Lambda
 * [ ] Week 4: Update getRecommendations() function
 * [ ] Week 4: Remove all mock data returns
 * [ ] Week 4: Delete src/services/mockData.ts
 *
 * ============================================================================
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Get the JWT token from Cognito and add it to API requests.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  } catch {
    return {
      'Content-Type': 'application/json',
    };
  }
}

/**
 * Get all books from the catalog
 */
export async function getBooks(): Promise<Book[]> {
  const response = await fetch(`${API_BASE_URL}/books`);
  if (!response.ok) throw new Error('Failed to fetch books');
  const data = await response.json();
  // Lambda response format: { statusCode, body } veya direkt array
  if (data.body) {
    const real_data = JSON.parse(data.body);
    return real_data.slice(1);
  }
  return Array.isArray(data) ? data : [];
}
/**
 * Get a single book by ID
 */
export async function getBook(id: string): Promise<Book | null> {
  const response = await fetch(`${API_BASE_URL}/books/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch book');
  const data = await response.json();
  // Lambda response format: { statusCode, body } veya direkt object
  if (data.body) {
    return JSON.parse(data.body);
  }
  return data;
}

/**
 * Create a new book (admin only)
 */
export async function createBook(book: Omit<Book, 'id'>): Promise<Book> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/books`, {
    method: 'POST',
    headers,
    body: JSON.stringify(book),
  });

  // Parse response body once
  let parsedData: unknown = null;
  let errorData: { error?: string } = {};
  try {
    const text = await response.text();
    if (text) {
      parsedData = JSON.parse(text);
      // Lambda response format: { statusCode, body } veya direkt object
      if (parsedData && typeof parsedData === 'object' && 'body' in parsedData) {
        const body = (parsedData as { body: string | object }).body;
        const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        errorData = parsedBody as { error?: string };
        parsedData = parsedBody; // Success durumu için de kullan
      } else {
        errorData = parsedData as { error?: string };
      }
    }
  } catch {
    // Response body is not JSON, ignore
  }

  if (response.status === 401) {
    throw new Error(errorData.error || 'Unauthorized: Please login again');
  }

  if (response.status === 403) {
    throw new Error(errorData.error || 'Forbidden: Admin access required');
  }

  if (response.status === 400) {
    throw new Error(errorData.error || 'Invalid request: Missing required fields');
  }

  if (response.status === 409) {
    throw new Error(errorData.error || 'Book with this id already exists');
  }

  if (!response.ok) {
    throw new Error(errorData.error || 'Failed to create book');
  }

  // Success durumu: parsedData zaten parse edildi ve Book tipinde olmalı
  return parsedData as Book;
}

/**
 * Update an existing book (admin only)
 */
export async function updateBook(id: string, book: Partial<Book>): Promise<Book> {
  if (!id) {
    throw new Error('Book ID is required');
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(book),
  });

  // Parse response body once
  let parsedData: unknown = null;
  let errorData: { error?: string } = {};
  try {
    const text = await response.text();
    if (text) {
      parsedData = JSON.parse(text);
      // Lambda response format: { statusCode, body } veya direkt object
      if (parsedData && typeof parsedData === 'object' && 'body' in parsedData) {
        const body = (parsedData as { body: string | object }).body;
        const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        errorData = parsedBody as { error?: string };
        parsedData = parsedBody; // Success durumu için de kullan
      } else {
        errorData = parsedData as { error?: string };
      }
    }
  } catch {
    // Response body is not JSON, ignore
  }

  if (response.status === 401) {
    throw new Error(errorData.error || 'Unauthorized: Please login again');
  }

  if (response.status === 403) {
    throw new Error(errorData.error || 'Forbidden: Admin access required');
  }

  if (response.status === 400) {
    throw new Error(errorData.error || 'Invalid request');
  }

  if (response.status === 404) {
    throw new Error(errorData.error || 'Book not found');
  }

  if (!response.ok) {
    throw new Error(errorData.error || 'Failed to update book');
  }

  // Success durumu: parsedData zaten parse edildi ve Book tipinde olmalı
  return parsedData as Book;
}

/**
 * Delete a book (admin only)
 */
export async function deleteBook(id: string): Promise<void> {
  if (!id) {
    throw new Error('Book ID is required');
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/books/${id}`, {
    method: 'DELETE',
    headers,
  });

  // Parse response body for error messages
  let errorData: { error?: string } = {};
  try {
    const text = await response.text();
    if (text) {
      const parsed = JSON.parse(text);
      // Lambda response format: { statusCode, body } veya direkt object
      if (parsed.body) {
        errorData = typeof parsed.body === 'string' ? JSON.parse(parsed.body) : parsed.body;
      } else {
        errorData = parsed;
      }
    }
  } catch {
    // Response body is not JSON, ignore
  }

  if (response.status === 401) {
    throw new Error(errorData.error || 'Unauthorized: Please login again');
  }

  if (response.status === 403) {
    throw new Error(errorData.error || 'Forbidden: Admin access required');
  }

  if (response.status === 400) {
    throw new Error(errorData.error || 'Invalid request: Missing path param: id');
  }

  if (response.status === 404) {
    throw new Error(errorData.error || 'Book not found');
  }

  if (!response.ok) {
    throw new Error(errorData.error || 'Failed to delete book');
  }

  // DELETE request successful (200 status with { success: true })
}

/**
 * Get AI-powered book recommendations using Amazon Bedrock
 */
export async function getRecommendations(query: string): Promise<Recommendation[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/recommendations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error('Failed to get recommendations');
  const data = await response.json();
  console.log(data);
  // API returns array directly or wrapped in recommendations property
  return Array.isArray(data) ? data : (data.recommendations || []);
}

/**
 * Get user's reading lists
 */
export async function getReadingLists(): Promise<ReadingList[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/reading-lists`, {
    headers,
  });
  if (!response.ok) throw new Error('Failed to fetch reading lists');
  const data = await response.json();
  // Lambda response format: { statusCode, body } veya direkt array
  if (data.body) {
    return JSON.parse(data.body);
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Create a new reading list
 */
export async function createReadingList(
  list: Omit<ReadingList, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ReadingList> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/reading-lists`, {
    method: 'POST',
    headers,
    body: JSON.stringify(list),
  });
  if (!response.ok) throw new Error('Failed to create reading list');
  const data = await response.json();
  // Lambda response format: { statusCode, body } veya direkt object
  if (data.body) {
    return JSON.parse(data.body);
  }
  return data;
}
/**
 * Update a reading list
 *
 * Lambda expects:
 * - Path parameter: id
 * - Body: { name?: string, bookIds?: string[] }
 * - Authorization header with JWT token (userId extracted from token)
 */
export async function updateReadingList(
  id: string,
  updates: { name?: string; bookIds?: string[] }
): Promise<ReadingList> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/reading-lists/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
  });

  if (response.status === 401) {
    throw new Error('Unauthorized: Please login again');
  }

  if (response.status === 404) {
    throw new Error('Reading list not found');
  }

  if (response.status === 400) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Invalid request');
  }

  if (!response.ok) {
    throw new Error('Failed to update reading list');
  }

  const data = await response.json();
  // Lambda response format: { statusCode, body } veya direkt object
  if (data.body) {
    return JSON.parse(data.body);
  }
  return data;
}

/**
 * Delete a reading list
 *
 * Lambda expects:
 * - Path parameter: id
 * - Authorization header with JWT token (userId extracted from token)
 * - Returns: { success: true } on success
 */
/**
 * Delete a reading list
 *
 * Lambda expects:
 * - Path parameter: id
 * - Authorization header with JWT token (userId extracted from token)
 * - Returns: { success: true } on success
 */
export async function deleteReadingList(id: string): Promise<void> {
  if (!id) {
    throw new Error('Reading list ID is required');
  }

  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/reading-lists/${id}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  // Parse response body for error messages
  let errorData: { error?: string } = {};
  try {
    const text = await response.text();
    if (text) {
      // Lambda response format: { statusCode, body } veya direkt object
      const parsed = JSON.parse(text);
      if (parsed.body) {
        errorData = JSON.parse(parsed.body);
      } else {
        errorData = parsed;
      }
    }
  } catch {
    // Response body is not JSON, ignore
  }

  if (response.status === 401) {
    throw new Error(errorData.error || 'Unauthorized: Please login again');
  }

  if (response.status === 404) {
    throw new Error(errorData.error || 'Reading list not found');
  }

  if (response.status === 400) {
    throw new Error(errorData.error || 'Invalid request');
  }

  if (!response.ok) {
    throw new Error(errorData.error || 'Failed to delete reading list');
  }

  // DELETE request successful
}

/**
 * Get reviews for a book
 * TODO: Replace with GET /books/:id/reviews API call
 */
export async function getReviews(bookId: string): Promise<Review[]> {
  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockReviews: Review[] = [
        {
          id: '1',
          bookId,
          userId: '1',
          rating: 5,
          comment: 'Absolutely loved this book! A must-read.',
          createdAt: '2024-11-01T10:00:00Z',
        },
      ];
      resolve(mockReviews);
    }, 500);
  });
}

/**
 * Create a new review
 * TODO: Replace with POST /books/:bookId/reviews API call
 */
export async function createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      const newReview: Review = {
        ...review,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      resolve(newReview);
    }, 500);
  });
}
