import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft, Check, Package, Truck, Shield, Minus, Plus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categoryNames = {
  engines: 'Двигатели и комплектующие',
  transmission: 'Трансмиссия',
  hydraulics: 'Гидравлика',
  electrical: 'Электрика',
  chassis: 'Ходовая часть',
};

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API}/products/${id}`);
        setProduct(response.data);
        
        if (isAuthenticated) {
          try {
            const favResponse = await axios.get(`${API}/favorites/check/${id}`);
            setIsFavorite(favResponse.data.is_favorite);
          } catch (e) {}
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Товар не найден');
        navigate('/catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, isAuthenticated, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA').format(price);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Войдите для добавления в корзину');
      navigate('/auth');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product.id, quantity);
      toast.success('Добавлено в корзину');
    } catch (error) {
      toast.error('Ошибка при добавлении');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
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
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-[#F7F7F8] mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-[#F7F7F8]" />
            <div className="space-y-4">
              <div className="h-8 w-full bg-[#F7F7F8]" />
              <div className="h-6 w-1/3 bg-[#F7F7F8]" />
              <div className="h-24 w-full bg-[#F7F7F8]" />
              <div className="h-12 w-full bg-[#F7F7F8]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="product-detail-page">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-8">
        <Link to="/" className="text-[#474A51] hover:text-[#0A0A0A]">Главная</Link>
        <span className="text-[#D1D3D8]">/</span>
        <Link to="/catalog" className="text-[#474A51] hover:text-[#0A0A0A]">Каталог</Link>
        <span className="text-[#D1D3D8]">/</span>
        <Link to={`/catalog?category=${product.category}`} className="text-[#474A51] hover:text-[#0A0A0A]">
          {categoryNames[product.category]}
        </Link>
        <span className="text-[#D1D3D8]">/</span>
        <span className="text-[#0A0A0A] font-medium truncate">{product.name}</span>
      </nav>

      {/* Back Link */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[#474A51] hover:text-[#0A0A0A] mb-6"
      >
        <ArrowLeft size={16} />
        Назад в каталог
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="aspect-square bg-[#F7F7F8] border border-[#EBECEE] relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              data-testid="product-image"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#D1D3D8]">
              <Package size={96} />
            </div>
          )}
          
          {/* Stock Badge */}
          <div className="absolute top-4 left-4">
            {product.stock > 0 ? (
              <div className="bg-[#34C759] text-white px-3 py-1 text-xs font-bold uppercase flex items-center gap-1">
                <Check size={14} />
                В наличии
              </div>
            ) : (
              <div className="bg-[#FF3B30] text-white px-3 py-1 text-xs font-bold uppercase">
                Нет в наличии
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          {/* Category */}
          <span className="category-badge mb-3 inline-block">
            {categoryNames[product.category]}
          </span>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="product-name">
            {product.name}
          </h1>

          {/* SKU */}
          <p className="font-mono text-sm text-[#474A51] mb-4" data-testid="product-sku">
            Артикул: {product.sku}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-mono font-bold" data-testid="product-price">
              {formatPrice(product.price)}
            </span>
            <span className="text-xl text-[#474A51]">₴</span>
          </div>

          {/* Description */}
          <p className="text-[#474A51] mb-6 leading-relaxed" data-testid="product-description">
            {product.description}
          </p>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="border border-[#EBECEE] p-4 mb-6">
              <h3 className="label-industrial mb-3">Характеристики</h3>
              <dl className="grid grid-cols-2 gap-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <dt className="text-[#474A51] text-sm capitalize">{key}:</dt>
                    <dd className="font-mono text-sm font-medium">{value}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center border border-[#EBECEE]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 flex items-center justify-center hover:bg-[#F7F7F8]"
                data-testid="decrease-qty"
              >
                <Minus size={18} />
              </button>
              <span className="w-12 text-center font-mono font-bold" data-testid="quantity-display">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 flex items-center justify-center hover:bg-[#F7F7F8]"
                data-testid="increase-qty"
              >
                <Plus size={18} />
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
              className="btn-primary flex-1 h-12 min-w-[200px]"
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart size={20} className="mr-2" />
              {addingToCart ? 'Добавление...' : 'В корзину'}
            </Button>

            <button
              onClick={handleToggleFavorite}
              className={`w-12 h-12 border flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-[#FF3B30] border-[#FF3B30] text-white'
                  : 'border-[#EBECEE] text-[#474A51] hover:text-[#FF3B30] hover:border-[#FF3B30]'
              }`}
              data-testid="favorite-btn"
            >
              <Heart size={20} fill={isFavorite ? 'white' : 'none'} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#EBECEE] pt-6">
            <div className="flex items-center gap-3">
              <Truck size={24} className="text-[#FF3B30]" />
              <div>
                <p className="font-bold text-sm">Доставка</p>
                <p className="text-xs text-[#474A51]">1-3 рабочих дня</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-[#FF3B30]" />
              <div>
                <p className="font-bold text-sm">Гарантия</p>
                <p className="text-xs text-[#474A51]">12 месяцев</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package size={24} className="text-[#FF3B30]" />
              <div>
                <p className="font-bold text-sm">Наличие</p>
                <p className="text-xs text-[#474A51]">{product.stock} шт на складе</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
