"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppProvider";
import { useState, useCallback } from "react";
import { 
  HomeIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BookOpenIcon,
  BellIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { logout, authToken, user, isLoading } = useAppContext();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, router]);

  const handleDashboardClick = useCallback((e: React.MouseEvent) => {
    if (!authToken) {
      e.preventDefault();
      router.push('/auth');
    }
  }, [authToken, router]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  if (isLoading) {
    return (
      <nav className="bg-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpenIcon className="h-8 w-8" />
              <span className="ml-2 text-lg font-semibold">Digital Library</span>
            </div>
            <div className="animate-pulse h-4 w-24 bg-purple-500 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center hover:text-purple-200 transition-colors"
              aria-label="Home"
            >
              <BookOpenIcon className="h-8 w-8" />
              <span className="ml-2 text-lg font-semibold">Digital Library</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {authToken ? (
              <>
                <Link 
                  href="/" 
                  className="flex items-center px-3 py-2 text-sm font-medium hover:bg-purple-700 rounded-md transition-colors"
                  aria-label="Home"
                >
                  <HomeIcon className="h-5 w-5 mr-1" />
                  Home
                </Link>
                {user?.role === 'admin' && (
                  <Link 
                    href="/dashboard" 
                    className="flex items-center px-3 py-2 text-sm font-medium hover:bg-purple-700 rounded-md transition-colors"
                    onClick={handleDashboardClick}
                    aria-label="Dashboard"
                  >
                    <BookOpenIcon className="h-5 w-5 mr-1" />
                    Dashboard
                  </Link>
                )}
                <Link 
                  href="/notifications" 
                  className="flex items-center px-3 py-2 text-sm font-medium hover:bg-purple-700 rounded-md transition-colors"
                  aria-label="Notifications"
                >
                  <BellIcon className="h-5 w-5 mr-1" />
                  <span className="relative">
                    Notifications
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      3
                    </span>
                  </span>
                </Link>
                <Link 
                  href="/messages" 
                  className="flex items-center px-3 py-2 text-sm font-medium hover:bg-purple-700 rounded-md transition-colors"
                  aria-label="Messages"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-1" />
                  Messages
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center ml-4 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                  aria-label="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <Link 
                href="/auth" 
                className="flex items-center px-4 py-2 text-sm font-medium bg-purple-500 hover:bg-purple-700 rounded-md transition-colors"
                aria-label="Login"
              >
                <UserCircleIcon className="h-5 w-5 mr-1" />
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-purple-700 transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="mobile-menu-button"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {authToken ? (
                <>
                  <Link 
                    href="/" 
                    className="flex items-center px-3 py-2 text-base font-medium hover:bg-purple-700 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                    aria-label="Home"
                  >
                    <HomeIcon className="h-5 w-5 mr-2" />
                    Home
                  </Link>
                  {user?.role === 'admin' && (
                    <Link 
                      href="/dashboard" 
                      className="flex items-center px-3 py-2 text-base font-medium hover:bg-purple-700 rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                      role="menuitem"
                      aria-label="Dashboard"
                    >
                      <BookOpenIcon className="h-5 w-5 mr-2" />
                      Dashboard
                    </Link>
                  )}
                  <Link 
                    href="/notifications" 
                    className="flex items-center px-3 py-2 text-base font-medium hover:bg-purple-700 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                    aria-label="Notifications"
                  >
                    <BellIcon className="h-5 w-5 mr-2" />
                    <span className="relative">
                      Notifications
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                        3
                      </span>
                    </span>
                  </Link>
                  <Link 
                    href="/messages" 
                    className="flex items-center px-3 py-2 text-base font-medium hover:bg-purple-700 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                    aria-label="Messages"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    Messages
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-base font-medium bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                    role="menuitem"
                    aria-label="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth" 
                  className="flex items-center px-3 py-2 text-base font-medium bg-purple-500 hover:bg-purple-700 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                  role="menuitem"
                  aria-label="Login"
                >
                  <UserCircleIcon className="h-5 w-5 mr-2" />
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;