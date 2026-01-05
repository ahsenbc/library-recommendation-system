import { useState, useEffect } from 'react';
import { BookSearch } from '@/components/books/BookSearch';
import { BookGrid } from '@/components/books/BookGrid';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getBooks } from '@/services/api';
import { Book } from '@/types';
import { handleApiError } from '@/utils/errorHandling';

/**
 * Books page component with search and filtering
 */
export function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('title');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
      // filteredBooks will be updated by useEffect when books changes
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort books based on selected criteria
  const sortBooks = (booksToSort: Book[], sortValue: string): Book[] => {
    const sorted = [...booksToSort];

    switch (sortValue) {
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'author':
        return sorted.sort((a, b) => a.author.localeCompare(b.author));
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating); // Highest first
      case 'year':
        return sorted.sort((a, b) => b.publishedYear - a.publishedYear); // Newest first
      default:
        return sorted;
    }
  };

  // Apply search and sort to books
  useEffect(() => {
    let result = books;

    // Apply search filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(lowercaseQuery) ||
          book.author.toLowerCase().includes(lowercaseQuery) ||
          book.genre.toLowerCase().includes(lowercaseQuery)
      );
    }

    // Apply sorting
    result = sortBooks(result, sortBy);
    setFilteredBooks(result);
  }, [books, searchQuery, sortBy]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            <span className="gradient-text">Book Catalog</span>
          </h1>
          <p className="text-slate-600 text-xl">
            Browse our collection of{' '}
            <span className="font-bold text-violet-600">{books.length}</span> amazing books
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <BookSearch onSearch={handleSearch} />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="glass-effect px-4 py-2 rounded-xl border border-white/20">
            <p className="text-slate-700 font-semibold">
              Showing <span className="text-violet-600">{filteredBooks.length}</span>{' '}
              {filteredBooks.length === 1 ? 'book' : 'books'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-700 font-semibold">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="input-modern px-4 py-2.5 text-sm font-medium"
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="rating">Rating</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>

        {/* Book Grid */}
        <BookGrid books={filteredBooks} />

        {filteredBooks.length > 12 && (
          <div className="mt-12 flex justify-center">
            <div className="glass-effect px-6 py-3 rounded-xl border border-white/20">
              <span className="text-slate-600 font-medium">Pagination coming soon...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
