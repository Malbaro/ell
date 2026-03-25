import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Truck, CreditCard, MapPin, Phone, MessageSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    shipping_address: '',
    phone: user?.phone || '',
    comment: '',
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA').format(price);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.shipping_address || !formData.phone) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/orders`, formData);
      toast.success('Заказ успешно оформлен!');
      navigate(`/orders`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
        <Link to="/catalog">
          <Button className="btn-primary">Перейти в каталог</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="checkout-page">
      <Link
        to="/catalog"
        className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[#474A51] hover:text-[#0A0A0A] mb-8"
      >
        <ArrowLeft size={16} />
        Продолжить покупки
      </Link>

      <h1 className="text-3xl font-bold uppercase tracking-tight mb-8">Оформление заказа</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping */}
            <div className="bg-white border border-[#EBECEE] p-6">
              <h2 className="flex items-center gap-2 font-bold uppercase tracking-wider mb-4">
                <Truck size={20} className="text-[#FF3B30]" />
                Доставка
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label-industrial mb-2 block">
                    <MapPin size={14} className="inline mr-1" />
                    Адрес доставки *
                  </label>
                  <textarea
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleChange}
                    placeholder="Город, улица, дом, квартира"
                    rows={3}
                    className="w-full input-industrial resize-none"
                    required
                    data-testid="shipping-address-input"
                  />
                </div>

                <div>
                  <label className="label-industrial mb-2 block">
                    <Phone size={14} className="inline mr-1" />
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+380 (50) 123-45-67"
                    className="w-full input-industrial"
                    required
                    data-testid="phone-input"
                  />
                </div>

                <div>
                  <label className="label-industrial mb-2 block">
                    <MessageSquare size={14} className="inline mr-1" />
                    Комментарий к заказу
                  </label>
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    placeholder="Дополнительная информация"
                    rows={2}
                    className="w-full input-industrial resize-none"
                    data-testid="comment-input"
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white border border-[#EBECEE] p-6">
              <h2 className="flex items-center gap-2 font-bold uppercase tracking-wider mb-4">
                <CreditCard size={20} className="text-[#FF3B30]" />
                Оплата
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-[#EBECEE] cursor-pointer hover:border-[#0A0A0A] transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    defaultChecked
                    className="w-5 h-5 accent-[#FF3B30]"
                  />
                  <div>
                    <p className="font-bold text-sm">Оплата при получении</p>
                    <p className="text-xs text-[#474A51]">Наличными или картой курьеру</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-[#EBECEE] cursor-pointer hover:border-[#0A0A0A] transition-colors opacity-60">
                  <input
                    type="radio"
                    name="payment"
                    value="mono"
                    disabled
                    className="w-5 h-5 accent-[#FF3B30]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">Plata by Mono</p>
                      <span className="bg-[#F7F7F8] px-2 py-0.5 text-xs uppercase font-bold text-[#474A51]">
                        Скоро
                      </span>
                    </div>
                    <p className="text-xs text-[#474A51]">Оплата картой онлайн</p>
                  </div>
                  <div className="bg-black text-white px-3 py-1 text-sm font-bold">
                    mono
                  </div>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-14 text-base"
              data-testid="place-order-btn"
            >
              {loading ? 'Оформление...' : 'Оформить заказ'}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#EBECEE] p-6 sticky top-24">
            <h2 className="font-bold uppercase tracking-wider mb-4">Ваш заказ</h2>
            
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.product_id} className="flex gap-3" data-testid={`order-item-${item.product_id}`}>
                  <div className="w-16 h-16 bg-[#F7F7F8] flex-shrink-0">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-[#474A51]">{item.quantity} шт</p>
                    <p className="font-mono font-bold text-sm">{formatPrice(item.price * item.quantity)} ₴</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EBECEE] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#474A51]">Товары ({cart.items.length})</span>
                <span className="font-mono">{formatPrice(cart.total)} ₴</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#474A51]">Доставка</span>
                <span className="font-mono text-[#34C759]">Бесплатно</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#EBECEE]">
                <span>Итого</span>
                <span className="font-mono" data-testid="order-total">{formatPrice(cart.total)} ₴</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
