import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, ShoppingCart, Heart, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

export const Profile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="profile-page">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[#474A51] hover:text-[#0A0A0A] mb-8"
      >
        <ArrowLeft size={16} />
        На главную
      </Link>

      <h1 className="text-3xl font-bold uppercase tracking-tight mb-8">Мой профиль</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* User Info */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#EBECEE] p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#EBECEE]">
              <div className="w-20 h-20 bg-[#F7F7F8] flex items-center justify-center">
                <User size={40} className="text-[#474A51]" />
              </div>
              <div>
                <h2 className="text-xl font-bold" data-testid="user-name">{user?.name}</h2>
                {user?.is_admin && (
                  <span className="bg-[#FF3B30] text-white px-2 py-0.5 text-xs font-bold uppercase">
                    Администратор
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-[#474A51]" />
                <div>
                  <p className="label-industrial">Email</p>
                  <p className="font-mono" data-testid="user-email">{user?.email}</p>
                </div>
              </div>

              {user?.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-[#474A51]" />
                  <div>
                    <p className="label-industrial">Телефон</p>
                    <p className="font-mono" data-testid="user-phone">{user?.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-[#474A51]" />
                <div>
                  <p className="label-industrial">Дата регистрации</p>
                  <p className="font-mono">{formatDate(user?.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#EBECEE]">
              <Button
                onClick={handleLogout}
                className="btn-secondary text-[#FF3B30] border-[#FF3B30] hover:bg-[#FF3B30] hover:text-white"
                data-testid="logout-btn"
              >
                <LogOut size={18} className="mr-2" />
                Выйти из аккаунта
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-1 space-y-4">
          <Link
            to="/orders"
            className="flex items-center gap-4 p-4 bg-white border border-[#EBECEE] hover:border-[#0A0A0A] transition-colors"
            data-testid="orders-quick-link"
          >
            <div className="w-12 h-12 bg-[#F7F7F8] flex items-center justify-center">
              <ShoppingCart size={24} className="text-[#FF3B30]" />
            </div>
            <div>
              <h3 className="font-bold">Мои заказы</h3>
              <p className="text-sm text-[#474A51]">История покупок</p>
            </div>
          </Link>

          <Link
            to="/favorites"
            className="flex items-center gap-4 p-4 bg-white border border-[#EBECEE] hover:border-[#0A0A0A] transition-colors"
            data-testid="favorites-quick-link"
          >
            <div className="w-12 h-12 bg-[#F7F7F8] flex items-center justify-center">
              <Heart size={24} className="text-[#FF3B30]" />
            </div>
            <div>
              <h3 className="font-bold">Избранное</h3>
              <p className="text-sm text-[#474A51]">Сохранённые товары</p>
            </div>
          </Link>

          {user?.is_admin && (
            <Link
              to="/admin"
              className="flex items-center gap-4 p-4 bg-[#0A0A0A] text-white hover:bg-[#FF3B30] transition-colors"
              data-testid="admin-quick-link"
            >
              <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold">Админ панель</h3>
                <p className="text-sm text-gray-300">Управление магазином</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
