"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppProvider";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  UserCircleIcon,
  XMarkIcon,
  BookOpenIcon as BookIcon,
  UsersIcon,
  ClockIcon as ClockOutlineIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon as SearchIcon,
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon as TrashOutlineIcon,
  ArrowPathIcon as ArrowPathOutlineIcon,
  HomeIcon as HomeOutlineIcon,
  ChartBarIcon as ChartBarOutlineIcon,
  CogIcon as CogOutlineIcon,
  UserCircleIcon as UserCircleOutlineIcon,
  XMarkIcon as XMarkOutlineIcon,
  BookmarkIcon,
  UserPlusIcon,
  BookmarkSlashIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon as EditIcon,
  TrashIcon as DeleteIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import ProfileModal from "@/components/ProfileModal";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  description: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
  added_by?: string;
  publisher: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  profile_image?: string;
}
//
interface Transaction {
  id: number;
  book_id: number;
  user_id: number;
  borrowed_date: string;
  due_date: string;
  returned_date: string | null;
  status: 'borrowed' | 'returned';
  book: {
    title: string;
    author: string;
  };
  user: {
    name: string;
    email: string;
  };
}

interface DashboardStats {
  books_count: number;
  users_count: number;
  transactions_count: number;
  overdue_count: number;
  recent_transactions: {
    id: number;
    user_name: string;
    book_title: string;
    borrowed_date: string;
    due_date: string;
    returned_date?: string;
    status: string;
  }[];
}

const AdminDashboard = () => {
  const { authToken, user, isLoading } = useAppContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "books" | "users" | "transactions">("dashboard");
  const [loading, setLoading] = useState({
    dashboard: false,
    books: false,
    users: false,
    transactions: false,
    action: false
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({
    books: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    users: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    transactions: { current_page: 1, last_page: 1, per_page: 10, total: 0 }
  });
  const [searchTerm, setSearchTerm] = useState({
    books: "",
    users: "",
    transactions: ""
  });
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    genre: "",
    description: "",
    total_copies: 1,
    publisher: ""
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New book added: The Great Gatsby", time: "2 hours ago", read: false },
    { id: 2, message: "Overdue book reminder: To Kill a Mockingbird", time: "5 hours ago", read: false },
    { id: 3, message: "New user registration: John Doe", time: "1 day ago", read: true },
  ]);
  const [showProfileModal, setShowProfileModal] = useState(false);
//
  useEffect(() => {
    if (!isLoading) {
      if (!authToken) {
        router.push("/auth");
      } else if (user?.role !== 'admin') {
        router.push("/");
      } else {
        // Only fetch data if we're authenticated and have admin role
        fetchDashboardStats();
      }
    }
  }, [authToken, isLoading, router, user]);

  useEffect(() => {
    if (authToken && user?.role === 'admin') {
      switch (activeTab) {
        case "dashboard":
          fetchDashboardStats();
          break;
        case "books":
          fetchBooks();
          break;
        case "users":
          fetchUsers();
          break;
        case "transactions":
          fetchTransactions();
          break;
      }
    }
  }, [activeTab, authToken, user]);

  const fetchDashboardStats = async () => {
    setLoading(prev => ({...prev, dashboard: true}));
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard-stats`,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Dashboard stats fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to load dashboard statistics"
      );
    } finally {
      setLoading(prev => ({...prev, dashboard: false}));
    }
  };

  const fetchBooks = async (page = 1, search = "") => {
    setLoading(prev => ({...prev, books: true}));
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/books`,
        {
          params: {
            page,
            search: search || undefined,
            per_page: pagination.books.per_page
          },
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      setBooks(response.data.data);
      setPagination(prev => ({
        ...prev,
        books: {
          current_page: response.data.meta?.current_page || 1,
          last_page: response.data.meta?.last_page || 1,
          per_page: response.data.meta?.per_page || 10,
          total: response.data.meta?.total || 0
        }
      }));
    } catch (error: any) {
      console.error('Books fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to load books"
      );
    } finally {
      setLoading(prev => ({...prev, books: false}));
    }
  };

  const fetchUsers = async (page = 1, search = "") => {
    setLoading(prev => ({...prev, users: true}));
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
        {
          params: {
            page,
            search: search || undefined,
            per_page: pagination.users.per_page
          },
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      setUsers(response.data.data);
      setPagination(prev => ({
        ...prev,
        users: {
          current_page: response.data.meta?.current_page || 1,
          last_page: response.data.meta?.last_page || 1,
          per_page: response.data.meta?.per_page || 10,
          total: response.data.meta?.total || 0
        }
      }));
    } catch (error: any) {
      console.error('Users fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to load users"
      );
    } finally {
      setLoading(prev => ({...prev, users: false}));
    }
  };

  const fetchTransactions = async (page = 1, search = "") => {
    setLoading(prev => ({...prev, transactions: true}));
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/transactions`,
        {
          params: {
            page,
            search: search || undefined,
            per_page: pagination.transactions.per_page
          },
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      setTransactions(response.data.data);
      setPagination(prev => ({
        ...prev,
        transactions: {
          current_page: response.data.meta?.current_page || 1,
          last_page: response.data.meta?.last_page || 1,
          per_page: response.data.meta?.per_page || 10,
          total: response.data.meta?.total || 0
        }
      }));
    } catch (error: any) {
      console.error('Transactions fetch error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to load transactions"
      );
    } finally {
      setLoading(prev => ({...prev, transactions: false}));
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({...prev, action: true}));
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/books`,
        {
          ...newBook,
          available_copies: newBook.total_copies
        },
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      setBooks(prev => [...prev, response.data.data]);
      setShowAddBookModal(false);
      setNewBook({
        title: "",
        author: "",  
        genre: "",
        description: "",
        total_copies: 1,
        publisher: ""
      });
      
      toast.success("Book added successfully");
      fetchDashboardStats();
    } catch (error: any) {
      console.error('Add book error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to add book"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleUpdateBook = async (bookId: number, bookData: Partial<Book>) => {
    setLoading(prev => ({...prev, action: true}));
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/books/${bookId}`,
        bookData,
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        }
      );
      
      toast.success("Book updated successfully");
      fetchBooks();
      fetchDashboardStats();
      setShowEditBookModal(false);
    } catch (error: any) {
      console.error('Update book error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to update book"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        setLoading(prev => ({...prev, action: true}));
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/books/${bookId}`,
          { 
            headers: { 
              Authorization: `Bearer ${authToken}`,
              Accept: 'application/json'
            }
          }
        );
        
        setBooks(prev => prev.filter(book => book.id !== bookId));
        toast.success("Book deleted successfully");
        fetchDashboardStats();
      }
    } catch (error: any) {
      console.error('Delete book error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to delete book"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        setLoading(prev => ({...prev, action: true}));
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
          { 
            headers: { 
              Authorization: `Bearer ${authToken}`,
              Accept: 'application/json'
            }
          }
        );
        
        setUsers(prev => prev.filter(user => user.id !== userId));
        toast.success("User deleted successfully");
        fetchDashboardStats();
      }
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast.error(
        error.response?.data?.message || 
        "Failed to delete user"
      );
    } finally {
      setLoading(prev => ({...prev, action: false}));
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

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Time formatting error:', error);
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-violet-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
          <p className="text-violet-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!authToken) {
    router.push("/auth");
    return null;
  }

  if (user?.role !== 'admin') {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-slate-900">Digital Library Hub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
                title="My Profile"
              >
                <UserCircleOutlineIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "dashboard", label: "Home", icon: HomeOutlineIcon },
                { id: "books", label: "Library", icon: BookOpenIcon },
                { id: "users", label: "Members", icon: UserPlusIcon },
                { id: "transactions", label: "Borrowings", icon: BookmarkSlashIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                      <BookIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">Total Books</dt>
                        <dd className="text-lg font-semibold text-slate-900">{stats?.books_count}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-emerald-500 rounded-md p-3">
                      <UserPlusIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">Total Members</dt>
                        <dd className="text-lg font-semibold text-slate-900">{stats?.users_count}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
                      <BookmarkSlashIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">Active Loans</dt>
                        <dd className="text-lg font-semibold text-slate-900">{stats?.transactions_count}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-rose-500 rounded-md p-3">
                      <ExclamationCircleIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">Overdue Items</dt>
                        <dd className="text-lg font-semibold text-slate-900">{stats?.overdue_count}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                <h3 className="text-lg font-medium text-slate-900">Latest Activities</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-slate-200">
                    {stats?.recent_transactions.map((tx) => (
                      <li key={tx.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              tx.status === 'borrowed' ? 'bg-amber-100' : 'bg-emerald-100'
                            }`}>
                              {tx.status === 'borrowed' ? (
                                <BookmarkSlashIcon className="h-5 w-5 text-amber-600" />
                              ) : (
                                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {tx.user_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {tx.status === 'borrowed' ? 'borrowed' : 'returned'} {tx.book_title}
                            </p>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tx.status === 'borrowed' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Books Tab Content */}
        {activeTab === "books" && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-slate-900">Book Collection</h3>
              <button
                onClick={() => setShowAddBookModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Add New Book
              </button>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by title, author, or genre..."
                    value={searchTerm.books}
                    onChange={(e) => {
                      setSearchTerm(prev => ({...prev, books: e.target.value}));
                      fetchBooks(1, e.target.value);
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </div>

              {loading.books ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No books found in the collection</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Author</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Available</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {books.map(book => (
                        <tr key={book.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{book.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{book.author}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {book.available_copies} of {book.total_copies}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => {
                                  setCurrentBook(book);
                                  setShowEditBookModal(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit Book"
                              >
                                <DocumentDuplicateIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBook(book.id)}
                                className="text-rose-600 hover:text-rose-900"
                                title="Remove Book"
                              >
                                <ArchiveBoxIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {books.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => fetchBooks(pagination.books.current_page - 1, searchTerm.books)}
                      disabled={pagination.books.current_page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({length: pagination.books.last_page}, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => fetchBooks(page, searchTerm.books)}
                        className={`relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium ${
                          pagination.books.current_page === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => fetchBooks(pagination.books.current_page + 1, searchTerm.books)}
                      disabled={pagination.books.current_page === pagination.books.last_page}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab Content */}
        {activeTab === "users" && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Member Directory</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by name or email..."
                    value={searchTerm.users}
                    onChange={(e) => {
                      setSearchTerm(prev => ({...prev, users: e.target.value}));
                      fetchUsers(1, e.target.value);
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </div>

              {loading.users ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No members found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {user.role === 'admin' ? 'Administrator' : 'Member'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-rose-600 hover:text-rose-900"
                              title="Remove Member"
                            >
                              <ArchiveBoxIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {users.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => fetchUsers(pagination.users.current_page - 1, searchTerm.users)}
                      disabled={pagination.users.current_page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({length: pagination.users.last_page}, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => fetchUsers(page, searchTerm.users)}
                        className={`relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium ${
                          pagination.users.current_page === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => fetchUsers(pagination.users.current_page + 1, searchTerm.users)}
                      disabled={pagination.users.current_page === pagination.users.last_page}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab Content */}
        {activeTab === "transactions" && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Borrowing History</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by member or book..."
                    value={searchTerm.transactions}
                    onChange={(e) => {
                      setSearchTerm(prev => ({...prev, transactions: e.target.value}));
                      fetchTransactions(1, e.target.value);
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </div>

              {loading.transactions ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No borrowing records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Book</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{tx.user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{tx.book.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              tx.status === 'returned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {tx.status === 'returned' ? 'Returned' : 'On Loan'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(tx.due_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {transactions.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => fetchTransactions(pagination.transactions.current_page - 1, searchTerm.transactions)}
                      disabled={pagination.transactions.current_page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({length: pagination.transactions.last_page}, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => fetchTransactions(page, searchTerm.transactions)}
                        className={`relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium ${
                          pagination.transactions.current_page === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => fetchTransactions(pagination.transactions.current_page + 1, searchTerm.transactions)}
                      disabled={pagination.transactions.current_page === pagination.transactions.last_page}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-900">Add New Book</h3>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <XMarkOutlineIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddBook}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700">Book Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newBook.title}
                    onChange={(e) => setNewBook(prev => ({...prev, title: e.target.value}))}
                  />
                </div>
                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-slate-700">Author Name</label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newBook.author}
                    onChange={(e) => setNewBook(prev => ({...prev, author: e.target.value}))}
                  />
                </div>
                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-slate-700">Genre</label>
                  <input
                    type="text"
                    id="genre"
                    name="genre"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newBook.genre}
                    onChange={(e) => setNewBook(prev => ({...prev, genre: e.target.value}))}
                  />
                </div>
                <div>
                  <label htmlFor="total_copies" className="block text-sm font-medium text-slate-700">Number of Copies</label>
                  <input
                    type="number"
                    id="total_copies"
                    name="total_copies"
                    min="1"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newBook.total_copies}
                    onChange={(e) => setNewBook(prev => ({...prev, total_copies: parseInt(e.target.value)}))}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.action}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading.action ? (
                    <div className="flex items-center">
                      <ArrowPathOutlineIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Adding...
                    </div>
                  ) : (
                    'Add Book'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditBookModal && currentBook && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-900">Update Book Details</h3>
              <button
                onClick={() => {
                  setShowEditBookModal(false);
                  setCurrentBook(null);
                }}
                className="text-slate-400 hover:text-slate-500"
              >
                <XMarkOutlineIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateBook(currentBook.id, {
                title: currentBook.title,
                author: currentBook.author,
                genre: currentBook.genre,
                description: currentBook.description,
                total_copies: currentBook.total_copies,
                publisher: currentBook.publisher
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700">Book Title</label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={currentBook.title}
                    onChange={(e) => setCurrentBook(prev => prev ? {...prev, title: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-author" className="block text-sm font-medium text-slate-700">Author Name</label>
                  <input
                    type="text"
                    id="edit-author"
                    name="author"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={currentBook.author}
                    onChange={(e) => setCurrentBook(prev => prev ? {...prev, author: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-genre" className="block text-sm font-medium text-slate-700">Genre</label>
                  <input
                    type="text"
                    id="edit-genre"
                    name="genre"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={currentBook.genre}
                    onChange={(e) => setCurrentBook(prev => prev ? {...prev, genre: e.target.value} : null)}
                  />
                </div>
                <div>
                  <label htmlFor="edit-total-copies" className="block text-sm font-medium text-slate-700">Number of Copies</label>
                  <input
                    type="number"
                    id="edit-total-copies"
                    name="total_copies"
                    min="1"
                    required
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={currentBook.total_copies}
                    onChange={(e) => setCurrentBook(prev => prev ? {...prev, total_copies: parseInt(e.target.value)} : null)}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBookModal(false);
                    setCurrentBook(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.action}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading.action ? (
                    <div className="flex items-center">
                      <ArrowPathOutlineIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Updating...
                    </div>
                  ) : (
                    'Update Book'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default AdminDashboard;
