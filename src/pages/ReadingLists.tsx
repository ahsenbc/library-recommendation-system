import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BookCard } from '@/components/books/BookCard';
import { getReadingLists, createReadingList, getBook, updateReadingList, deleteReadingList } from '@/services/api';
import { ReadingList, Book } from '@/types';
import { formatDate } from '@/utils/formatters';
import { handleApiError, showSuccess } from '@/utils/errorHandling';
import { useConfirmation } from '@/contexts/ConfirmationContext';

/**
 * ReadingLists page component
 */
export function ReadingLists() {
  const navigate = useNavigate();
  const { confirm } = useConfirmation();
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedList, setSelectedList] = useState<ReadingList | null>(null);
  const [listBooks, setListBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isBooksModalOpen, setIsBooksModalOpen] = useState(false);
  const [removingBookId, setRemovingBookId] = useState<string | null>(null);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with DynamoDB query
      const data = await getReadingLists();
      setLists(data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      alert('Please enter a list name');
      return;
    }

    try {
      const newList = await createReadingList({
        userId: '1', // TODO: Get from auth context
        name: newListName,
        description: newListDescription,
        bookIds: [],
      });
      setLists([...lists, newList]);
      setIsModalOpen(false);
      setNewListName('');
      setNewListDescription('');
      showSuccess('Reading list created successfully!');
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleListClick = async (list: ReadingList) => {
    setSelectedList(list);
    setIsBooksModalOpen(true);
    await loadListBooks(list.bookIds);
  };

  const loadListBooks = async (bookIds: string[]) => {
    setIsLoadingBooks(true);
    try {
      // Load all books in parallel
      const bookPromises = bookIds.map((bookId) => getBook(bookId));
      const books = await Promise.all(bookPromises);
      // Filter out null values (books that don't exist)
      setListBooks(books.filter((book): book is Book => book !== null));
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!selectedList) return;

    setRemovingBookId(bookId);
    try {
      // Remove book from list
      const updatedBookIds = selectedList.bookIds.filter((id) => id !== bookId);
      const updatedList = await updateReadingList(selectedList.id, {
        bookIds: updatedBookIds,
      });

      // Update local state
      setSelectedList(updatedList);
      setListBooks(listBooks.filter((book) => book.id !== bookId));
      setLists(lists.map((l) => (l.id === selectedList.id ? updatedList : l)));

      showSuccess('Book removed from reading list successfully!');
    } catch (error) {
      handleApiError(error);
    } finally {
      setRemovingBookId(null);
    }
  };

  const handleDeleteList = async (listId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal when clicking delete

    const confirmed = await confirm({
      title: 'Delete Reading List',
      message: 'Are you sure you want to delete this reading list? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) {
      return;
    }

    setDeletingListId(listId);
    try {
      await deleteReadingList(listId);
      // Remove from local state
      setLists(lists.filter((l) => l.id !== listId));
      // If deleted list was selected, close modal
      if (selectedList?.id === listId) {
        setIsBooksModalOpen(false);
        setSelectedList(null);
        setListBooks([]);
      }
      showSuccess('Reading list deleted successfully!');
    } catch (error) {
      handleApiError(error);
    } finally {
      setDeletingListId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">My Reading Lists</h1>
            <p className="text-slate-600 text-lg">Organize your books into custom lists</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => setIsModalOpen(true)}>
            Create New List
          </Button>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200">
            <svg
              className="w-16 h-16 text-slate-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No reading lists yet</h3>
            <p className="text-slate-600 mb-4">
              Create your first list to start organizing your books
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Create Your First List
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 relative group"
              >
                <div
                  onClick={() => handleListClick(list)}
                  className="cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{list.name}</h3>
                  <p className="text-slate-600 mb-4 line-clamp-2">{list.description}</p>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{list.bookIds.length} {list.bookIds.length === 1 ? 'book' : 'books'}</span>
                    <span>Created {formatDate(list.createdAt)}</span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteList(list.id, e)}
                  disabled={deletingListId === list.id}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete reading list"
                >
                  {deletingListId === list.id ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Reading List Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Reading List"
        >
          <div>
            <Input
              label="List Name"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., Summer Reading 2024"
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="What's this list about?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleCreateList} className="flex-1">
                Create List
              </Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Reading List Books Modal */}
        <Modal
          isOpen={isBooksModalOpen}
          onClose={() => {
            setIsBooksModalOpen(false);
            setSelectedList(null);
            setListBooks([]);
          }}
          title={selectedList ? selectedList.name : 'Reading List'}
          size="xl"
        >
          <div className="space-y-6">
            {/* Description Section */}
            {selectedList && selectedList.description && (
              <div className="bg-gradient-to-r from-violet-50/50 to-indigo-50/50 rounded-xl p-4 border border-violet-100/50">
                <p className="text-slate-700 leading-relaxed">{selectedList.description}</p>
              </div>
            )}

            {/* Books Count Badge */}
            {selectedList && (
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 font-semibold border border-violet-200">
                  {selectedList.bookIds.length} {selectedList.bookIds.length === 1 ? 'book' : 'books'}
                </span>
                <span className="text-slate-500">
                  Created {formatDate(selectedList.createdAt)}
                </span>
              </div>
            )}

            {/* Content */}
            {isLoadingBooks ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : listBooks.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-violet-50/30 rounded-xl border border-slate-200">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 mb-4">
                  <svg
                    className="w-10 h-10 text-violet-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <p className="text-slate-700 text-lg font-semibold mb-2">No books in this list yet</p>
                <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                  Start building your collection by adding books from the book detail page
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsBooksModalOpen(false);
                    navigate('/books');
                  }}
                  className="btn-gradient"
                >
                  Browse Books
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listBooks.map((book) => (
                  <div key={book.id} className="relative group">
                    <BookCard book={book} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBook(book.id);
                      }}
                      disabled={removingBookId === book.id}
                      className="absolute top-2 left-2 z-10 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from list"
                    >
                      {removingBookId === book.id ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
