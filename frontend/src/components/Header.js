import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, Heart, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header-sticky" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-2 border-b border-[#EBECEE] text-xs">
          <div className="flex items-center gap-4 text-[#474A51]">
            <span>+380 (50) 123-45-67</span>
            <span className="hidden sm:inline">Пн-Пт: 9:00-18:00</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <span className="text-[#474A51]">Привет, {user?.name}</span>
            ) : (
              <Link to="/auth" className="text-[#474A51] hover:text-[#FF3B30]">
                Войти / Регистрация
              </Link>
            )}
          </div>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="bg-[#FF3B30] text-white font-black text-xl px-3 py-2">ЭЛЛ</div>
            <div className="hidden sm:block">
              <div className="font-bold text-lg tracking-tight">ЗАПЧАСТИ</div>
              <div className="text-xs text-[#474A51] uppercase tracking-wider">к технике</div>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Поиск по каталогу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 px-4 pr-12 border-2 border-[#0A0A0A] font-mono text-sm focus:ring-2 focus:ring-[#0055FF] outline-none"
                data-testid="search-input"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-12 w-12 bg-[#0A0A0A] text-white flex items-center justify-center hover:bg-[#FF3B30] transition-colors"
                data-testid="search-button"
              >
                <Search size={20} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link
                to="/favorites"
                className="p-3 hover:bg-[#F7F7F8] transition-colors relative"
                data-testid="favorites-link"
              >
                <Heart size={22} />
              </Link>
            )}

            <button
              onClick={() => isAuthenticated ? setIsCartOpen(true) : navigate('/auth')}
              className="p-3 hover:bg-[#F7F7F8] transition-colors relative"
              data-testid="cart-button"
            >
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF3B30] text-white text-xs font-bold w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-3 hover:bg-[#F7F7F8] transition-colors" data-testid="user-menu-button">
                    <User size={22} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-none border-[#EBECEE]">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer" data-testid="profile-link">
                      <User size={16} className="mr-2" />
                      Мой профиль
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer" data-testid="orders-link">
                      <ShoppingCart size={16} className="mr-2" />
                      Мои заказы
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="cursor-pointer" data-testid="favorites-menu-link">
                      <Heart size={16} className="mr-2" />
                      Избранное
                    </Link>
                  </DropdownMenuItem>
                  {user?.is_admin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer" data-testid="admin-link">
                          <Settings size={16} className="mr-2" />
                          Админ панель
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#FF3B30]" data-testid="logout-button">
                    <LogOut size={16} className="mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="p-3 hover:bg-[#F7F7F8] transition-colors" data-testid="login-link">
                <User size={22} />
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-3 hover:bg-[#F7F7F8] transition-colors"
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 py-3 border-t border-[#EBECEE]">
          <Link to="/catalog" className="nav-link" data-testid="catalog-nav-link">Каталог</Link>
          <Link to="/catalog?category=engines" className="nav-link">Двигатели</Link>
          <Link to="/catalog?category=transmission" className="nav-link">Трансмиссия</Link>
          <Link to="/catalog?category=hydraulics" className="nav-link">Гидравлика</Link>
          <Link to="/catalog?category=electrical" className="nav-link">Электрика</Link>
          <Link to="/catalog?category=chassis" className="nav-link">Ходовая</Link>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu md:hidden" data-testid="mobile-menu">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-lg">Меню</span>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="mb-6">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 px-4 border-2 border-[#0A0A0A] font-mono text-sm"
            />
          </form>

          <nav className="flex flex-col gap-4">
            <Link to="/catalog" className="nav-link text-lg" onClick={() => setMobileMenuOpen(false)}>Каталог</Link>
            <Link to="/catalog?category=engines" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Двигатели</Link>
            <Link to="/catalog?category=transmission" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Трансмиссия</Link>
            <Link to="/catalog?category=hydraulics" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Гидравлика</Link>
            <Link to="/catalog?category=electrical" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Электрика</Link>
            <Link to="/catalog?category=chassis" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Ходовая</Link>
          </nav>
        </div>
      )}
    </header>
  );
};
