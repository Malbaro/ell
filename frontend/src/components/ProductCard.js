import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categoryNames = {
  engines: 'Двигатели',
  transmission: 'Трансмиссия',
  hydraulics: 'Гидравлика',
  electrical: 'Электрика',
  chassis: 'Ходовая',
};

export const ProductCard = ({ product, onFavoriteToggle }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA').format(price);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Войдите для добавления в корзину');
      return;
    }

    try {
      setLoading(true);
      await addToCart(product.id);
      toast.success('Добавлено в корзину');
    } catch (error) {
      toast.error('Ошибка при добавлении');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Войдите для добавления в избранное');
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`${API}/favorites/${product.id}`);
        setIsFavorite(false);
        toast.success('Удалено из избранного');
      } else {
        await axios.post(`${API}/favorites/${product.id}`);
        setIsFavorite(true);
        toast.success('Добавлено в избранное');
      }
      onFavoriteToggle?.();
    } catch (error) {
      if (error.response?.status === 400) {
        setIsFavorite(true);
      } else {
        toast.error('Ошибка');
      }
    }
  };

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="product-card group"
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#F7F7F8] overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#D1D3D8]">
            <ShoppingCart size={48} />
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleFavorite}
            className={`w-10 h-10 flex items-center justify-center transition-colors ${
              isFavorite 
                ? 'bg-[#FF3B30] text-white' 
                : 'bg-white border border-[#EBECEE] text-[#474A51] hover:text-[#FF3B30]'
            }`}
            data-testid={`favorite-btn-${product.id}`}
          >
            <Heart size={18} fill={isFavorite ? 'white' : 'none'} />
          </button>
          <button
            className="w-10 h-10 bg-white border border-[#EBECEE] flex items-center justify-center text-[#474A51] hover:text-[#0055FF] transition-colors"
            data-testid={`quick-view-btn-${product.id}`}
          >
            <Eye size={18} />
          </button>
        </div>

        {/* Stock Badge */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-2 left-2 bg-[#FFCC00] text-[#0A0A0A] px-2 py-1 text-xs font-bold uppercase">
            Осталось {product.stock} шт
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-2 left-2 bg-[#FF3B30] text-white px-2 py-1 text-xs font-bold uppercase">
            Нет в наличии
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        {/* Category */}
        <span className="category-badge self-start mb-2">
          {categoryNames[product.category] || product.category}
        </span>

        {/* Name */}
        <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-[#FF3B30] transition-colors">
          {product.name}
        </h3>

        {/* SKU */}
        <span className="font-mono text-xs text-[#474A51] mb-2">
          Артикул: {product.sku}
        </span>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="price-badge" data-testid={`price-${product.id}`}>
            {formatPrice(product.price)} ₴
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={loading || product.stock === 0}
            className={`flex items-center justify-center w-10 h-10 transition-colors ${
              product.stock === 0
                ? 'bg-[#D1D3D8] cursor-not-allowed'
                : 'bg-[#FF3B30] hover:bg-[#D92C23] text-white'
            }`}
            data-testid={`add-to-cart-btn-${product.id}`}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
};
