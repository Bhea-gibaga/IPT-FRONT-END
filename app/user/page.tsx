"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppProvider";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ArrowPathIcon, BookOpenIcon, ClockIcon, UserCircleIcon, CheckCircleIcon, PlusIcon, ExclamationCircleIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import ProfileModal from "@/components/ProfileModal";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  description: string;
  available_copies: number;
  total_copies: number;
  borrowed_at?: string;
  due_date?: string;
  returned_date?: string;
  added_by?: string;
  user?: {
    name: string;
  };
  transaction_id: number;
  unique_key?: string;
  status?: string;
}

const UserDashboard = () => {
  const { authToken, user, isLoading } = useAppContext();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "available" | "borrowed">("all");
  const [loading, setLoading] = useState({
    books: false,
    borrowed: false,
    action: false,
    refreshing: false
  });
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      setLastUpdated(new Date().toLocaleTimeString());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (authToken) {
      fetchBooks();
      fetchBorrowedBooks();
    }
  }, [authToken]);

  const fetchBooks = async () => {
    setLoading(prev => ({...prev, books: true}));
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/books`,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      const data = Array.isArray(response.data) ? response.data : 
                  response.data.books ? response.data.books : 
                  response.data.data ? response.data.data : [];
      
      const formattedBooks = data.map((book: any) => ({
        id: book.id,
        title: book.title || 'No Title',
        author: book.author || 'Unknown Author',
        genre: book.genre || 'Uncategorized',
        description: book.description || 'No description available',
        available_copies: book.available_copies || 0,
        total_copies: book.total_copies || 0,
        added_by: book.user?.name || 'Admin'
      }));
      
      setBooks(formattedBooks);
    } catch (error: any) {
      console.error('Book fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to load books"
      );
    } finally {
      setLoading(prev => ({...prev, books: false}));
    }
  };

  const fetchBorrowedBooks = async () => {
    setLoading(prev => ({...prev, borrowed: true}));
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/borrowed-books`,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
      
      const data = Array.isArray(response.data) ? response.data : 
                  response.data.books ? response.data.books : 
                  response.data.data ? response.data.data : [];
      
      const formattedBooks = data.map((book: any) => {
        console.log('Raw book data:', book); // Debug log
        const formatted = {
          id: book.id,
          title: book.title || 'No Title',
          author: book.author || 'Unknown Author',
          genre: book.genre || 'Uncategorized',
          description: book.description || 'No description available',
          available_copies: book.available_copies || 0,
          total_copies: book.total_copies || 0,
          transaction_id: book.transaction_id || book.id,
          status: book.status || 'borrowed',
          due_date: book.due_date || null,
          borrowed_at: book.borrowed_at || null,
          returned_date: book.returned_date || null,
          unique_key: `${book.id}-${book.transaction_id || book.id}-${Date.now()}`
        };
        console.log('Formatted book:', formatted); // Debug log
        return formatted;
      });
      
      console.log('All formatted books:', formattedBooks); // Debug log
      setBorrowedBooks(formattedBooks);
    } catch (error: any) {
      console.error('Borrowed books fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to load borrowed books"
      );
    } finally {
      setLoading(prev => ({...prev, borrowed: false}));
    }
  };

  const refreshData = async () => {
    setLoading(prev => ({...prev, refreshing: true}));
    try {
      await Promise.all([fetchBooks(), fetchBorrowedBooks()]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(prev => ({...prev, refreshing: false}));
    }
  };

  const handleBorrow = async (bookId: number) => {
    if (!dueDate) {
      toast.error("Please select a return date");
      return;
    }

    const today = new Date();
    const maxDueDate = new Date();
    maxDueDate.setDate(today.getDate() + 7);

    if (dueDate > maxDueDate) {
      toast.error("Maximum borrowing period is 1 week");
      return;
    }

    if (dueDate < today) {
      toast.error("Return date cannot be in the past");
      return;
    }

    setLoading(prev => ({...prev, action: true}));
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/books/${bookId}/borrow`,
        { due_date: dueDate.toISOString().split('T')[0] },
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      toast.success(response.data?.message || "Book borrowed successfully");
      setDueDate(null);
      setSelectedBookId(null);
      await Promise.all([fetchBooks(), fetchBorrowedBooks()]);
    } catch (error: any) {
      console.error('Borrow error:', error);
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to borrow book"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleReturn = async (transactionId: number, bookTitle: string) => {
    if (!authToken) {
      toast.error("Authentication required");
      return;
    }

    try {
      const result = await Swal.fire({
        title: "Confirm Return",
        text: `Are you sure you want to return "${bookTitle}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, return it",
      });

      if (result.isConfirmed) {
        setLoading(prev => ({...prev, action: true}));
        
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/return`,
            {},
            {
              headers: { 
                Authorization: `Bearer ${authToken}`,
                Accept: 'application/json',
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data?.success) {
            toast.success(response.data.message || "Book returned successfully");
            await Promise.all([fetchBooks(), fetchBorrowedBooks()]);
          } else {
            throw new Error(response.data?.message || "Failed to process return");
          }
        } catch (error: any) {
          console.error('Return error:', error);
          let errorMessage = "Failed to return book";
          
          if (error.response) {
            if (error.response.status === 404) {
              errorMessage = "Transaction not found";
            } else if (error.response.status === 403) {
              errorMessage = "You are not authorized to return this book";
            } else if (error.response.status === 400) {
              errorMessage = error.response.data?.message || "This book was already returned";
            } else if (error.response.data?.message) {
              errorMessage = error.response.data.message;
            }
          }
          
          toast.error(errorMessage);
        } finally {
          setLoading(prev => ({...prev, action: false}));
        }
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      toast.error("An error occurred during confirmation");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return "Invalid Date";
    }
  };

  const formatReturnDate = (dateString?: string) => {
    if (!dateString) return "Not returned yet";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return "Invalid Date";
    }
  };

  const isBookOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    return dueDate < new Date();
  };

  if (isLoading || !authToken || (user?.role === 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredBooks = activeTab === "available" 
    ? books.filter(book => book.available_copies > 0)
    : activeTab === "borrowed" 
      ? borrowedBooks 
      : books;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-slate-900">Digital Library Hub</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
                title="My Profile"
              >
                <UserCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowProfileModal(true)}
                className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-indigo-500/20"
                title="Update Your Profile"
              >
                {user?.profile_image ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${user.profile_image}`} 
                    alt={user.name}
                    className="h-14 w-14 rounded-xl object-cover ring-2 ring-indigo-500/20"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4B5563&color=fff`;
                    }}
                  />
                ) : (
                  <span className="text-white text-xl font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Hello, {user?.name}!
                </h2>
                <p className="text-sm text-slate-500">Member since {formatDate(user?.created_at)}</p>
              </div>
            </div>

            <button
              onClick={refreshData}
              disabled={loading.refreshing}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all duration-200"
              title="Update Your Library Status"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading.refreshing ? 'animate-spin' : ''}`} />
              {loading.refreshing ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-xl p-3 shadow-lg">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Your Collection</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-slate-900">{borrowedBooks.length}</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-slate-500">
                        <span>active loans</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-rose-500 rounded-xl p-3 shadow-lg">
                  <ExclamationCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Overdue Books</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-slate-900">
                        {borrowedBooks.filter(book => isBookOverdue(book.due_date)).length}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-slate-500">
                        <span>need attention</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Tips */}
        <div className="mb-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Quick Guide</h3>
          <ul className="text-sm text-slate-600 space-y-2">
            <li className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Books can be borrowed for up to 7 days
            </li>
            <li className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Return books on time to maintain good standing
            </li>
            <li className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Use the refresh button to update your reading status
            </li>
            <li className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Click your profile picture to update your information
            </li>
          </ul>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`${
                activeTab === "all"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center`}
              disabled={loading.books || loading.borrowed}
            >
              <BookOpenIcon className="h-5 w-5 mr-2" />
              All Books
              {loading.books && (
                <span className="ml-2 inline-block animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-indigo-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("available")}
              className={`${
                activeTab === "available"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center`}
              disabled={loading.books || loading.borrowed}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Available Now
              {loading.books && (
                <span className="ml-2 inline-block animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-indigo-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("borrowed")}
              className={`${
                activeTab === "borrowed"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center`}
              disabled={loading.borrowed}
            >
              <BookmarkIcon className="h-5 w-5 mr-2" />
              My Books
              {loading.borrowed && (
                <span className="ml-2 inline-block animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-indigo-400"></span>
              )}
            </button>
          </nav>
        </div>

        {/* Book List or Borrowed Books Table */}
        {activeTab !== "borrowed" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {loading.books ? (
              <div className="col-span-full">
                <div className="bg-white rounded-xl p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-slate-500">Loading your reading options...</p>
                </div>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="col-span-full">
                <div className="bg-white rounded-xl p-6 text-center">
                  <BookOpenIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No books available at the moment.</p>
                </div>
              </div>
            ) : (
              filteredBooks.map(book => (
                <div key={`book-${book.id}`} className="bg-white rounded-lg overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1 border border-slate-200">
                  <div className="p-4">
                    <div className="flex flex-col h-full">
                      {/* Book Title and Author */}
                      <div className="mb-2">
                        <h3 className="text-base font-semibold text-slate-900 line-clamp-1 mb-1 hover:text-indigo-600 transition-colors duration-200">{book.title}</h3>
                        <h4 className="text-xs font-medium text-slate-500 line-clamp-1">by {book.author}</h4>
                      </div>

                      {/* Book Description */}
                      <div className="text-xs text-slate-600 line-clamp-2 min-h-[2.5rem] mb-2">
                        {book.description || 'No description available'}
                      </div>

                      {/* Book Details */}
                      <div className="space-y-1 text-xs mt-2">
                        <div className="flex items-center text-slate-500">
                          <BookmarkIcon className="h-3 w-3 mr-1 text-indigo-500" />
                          <span className="line-clamp-1">{book.genre}</span>
                        </div>
                        <div className="flex items-center text-slate-500">
                          <PlusIcon className="h-3 w-3 mr-1 text-indigo-500" />
                          <span>{book.available_copies}/{book.total_copies}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                    {selectedBookId === book.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Return date (max 1 week)
                          </label>
                          <DatePicker
                            selected={dueDate}
                            onChange={(date) => setDueDate(date)}
                            minDate={new Date()}
                            maxDate={new Date(new Date().setDate(new Date().getDate() + 7))}
                            className="w-full px-2 py-1.5 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                            placeholderText="Select return date"
                            dateFormat="MMM d, yyyy"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-indigo-500/20"
                            onClick={() => handleBorrow(book.id)}
                            disabled={loading.action}
                          >
                            {loading.action ? (
                              <>
                                <span className="animate-spin mr-1 h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                                Processing...
                              </>
                            ) : (
                              'Confirm'
                            )}
                          </button>
                          <button
                            className="px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                            onClick={() => {
                              setSelectedBookId(null);
                              setDueDate(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className={`w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg transition-all duration-200 ${
                          book.available_copies > 0
                            ? 'text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:-translate-y-0.5 shadow-lg hover:shadow-indigo-500/20'
                            : 'text-slate-400 bg-slate-100 cursor-not-allowed'
                        }`}
                        onClick={() => book.available_copies > 0 && setSelectedBookId(book.id)}
                        disabled={book.available_copies <= 0 || loading.action}
                      >
                        {book.available_copies > 0 ? 'Borrow' : 'Unavailable'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {loading.borrowed ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-indigo-400"></div>
                          <span className="text-slate-500">Loading your reading list...</span>
                        </div>
                      </td>
                    </tr>
                  ) : borrowedBooks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center py-8">
                          <BookOpenIcon className="h-12 w-12 text-slate-400 mb-4" />
                          <p>Your reading list is empty. Start exploring our collection!</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    borrowedBooks.map(book => (
                      <tr key={book.unique_key} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{book.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{book.author}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            book.status === 'returned' 
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {book.status === 'returned' ? 'Returned' : 'Currently Reading'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {book.status !== 'returned' ? (
                            <button
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-indigo-500/20"
                              onClick={() => handleReturn(book.transaction_id, book.title)}
                              disabled={loading.action}
                            >
                              {loading.action ? (
                                <>
                                  <span className="animate-spin mr-2 h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                                  Returning...
                                </>
                              ) : (
                                'Return Book'
                              )}
                            </button>
                          ) : (
                            <button 
                              className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-lg text-slate-400 bg-slate-100 cursor-not-allowed"
                              disabled
                            >
                              Already Returned
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
    </div>
  );
};

export default UserDashboard;