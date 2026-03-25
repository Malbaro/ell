import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`);
      setFavorites(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки избранного');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchFavorites();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="product-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="product-card">
              <div className="aspect-square bg-[#F7F7F8] skeleton" />
              <div className="h-4 bg-[#F7F7F8] skeleton w-1/3 mt-4" />
              <div className="h-5 bg-[#F7F7F8] skeleton w-full mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="favorites-page">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[#474A51] hover:text-[#0A0A0A] mb-8"
      >
        <ArrowLeft size={16} />
        На главную
      </Link>

      <h1 className="text-3xl font-bold uppercase tracking-tight mb-8">Избранное</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#EBECEE]">
          <Heart size={64} className="mx-auto text-[#D1D3D8] mb-4" />
          <p className="text-[#474A51] mb-4">В избранном пока ничего нет</p>
          <Link to="/catalog">
            <button className="btn-primary">Перейти в каталог</button>
          </Link>
        </div>
      ) : (
        <div className="product-grid" data-testid="favorites-grid">
          {favorites.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onFavoriteToggle={fetchFavorites}
            />
          ))}
        </div>
      )}
    </div>
  );
};
