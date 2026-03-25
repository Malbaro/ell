import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Truck, CreditCard, MapPin, Phone, MessageSquare, Building, Package, Home } from 'lucide-react';
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

  const [deliveryType, setDeliveryType] = useState('branch'); // branch, postbox, courier
  const [paymentMethod, setPaymentMethod] = useState('mono');

  const [formData, setFormData] = useState({
    city: '',
    branch_number: '',
    postbox_number: '',
    courier_address: '',
    phone: user?.phone || '',
    comment: '',
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA').format(price);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getShippingAddress = () => {
    let address = `м. ${formData.city}, Нова Пошта: `;
    if (deliveryType === 'branch') {
      address += `Відділення №${formData.branch_number}`;
    } else if (deliveryType === 'postbox') {
      address += `Поштомат №${formData.postbox_number}`;
    } else {
      address += `Кур'єр, ${formData.courier_address}`;
    }
    return address;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.city || !formData.phone) {
      toast.error('Заповніть обов\'язкові поля');
      return;
    }

    if (deliveryType === 'branch' && !formData.branch_number) {
      toast.error('Вкажіть номер відділення');
      return;
    }
    if (deliveryType === 'postbox' && !formData.postbox_number) {
      toast.error('Вкажіть номер поштомату');
      return;
    }
    if (deliveryType === 'courier' && !formData.courier_address) {
      toast.error('Вкажіть адресу доставки');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shipping_address: getShippingAddress(),
        phone: formData.phone,
        comment: formData.comment ? `${formData.comment} | Оплата: ${paymentMethod}` : `Оплата: ${paymentMethod}`
      };
      
      const response = await axios.post(`${API}/orders`, orderData);
      toast.success('Замовлення успішно оформлено!');
      navigate(`/orders`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Помилка при оформленні замовлення');
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
        <h1 className="text-2xl font-bold mb-4">Кошик порожній</h1>
        <Link to="/catalog">
          <Button className="btn-primary">Перейти до каталогу</Button>
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
        Продовжити покупки
      </Link>

      <h1 className="text-3xl font-bold uppercase tracking-tight mb-8">Оформлення замовлення</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delivery - Nova Poshta */}
            <div className="bg-white border border-[#EBECEE] p-6">
              <h2 className="flex items-center gap-2 font-bold uppercase tracking-wider mb-4">
                <Truck size={20} className="text-[#FF3B30]" />
                Доставка Новою Поштою
              </h2>
              
              <div className="space-y-4">
                {/* City */}
                <div>
                  <label className="label-industrial mb-2 block">
                    <MapPin size={14} className="inline mr-1" />
                    Місто *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Київ, Харків, Одеса..."
                    className="w-full input-industrial"
                    required
                    data-testid="city-input"
                  />
                </div>

                {/* Delivery Type */}
                <div>
                  <label className="label-industrial mb-3 block">Спосіб отримання *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label 
                      className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                        deliveryType === 'branch' ? 'border-[#FF3B30] bg-red-50' : 'border-[#EBECEE] hover:border-[#0A0A0A]'
                      }`}
                      data-testid="delivery-branch"
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="branch"
                        checked={deliveryType === 'branch'}
                        onChange={(e) => setDeliveryType(e.target.value)}
                        className="w-5 h-5 accent-[#FF3B30]"
                      />
                      <div>
                        <Building size={20} className="text-[#FF3B30] mb-1" />
                        <p className="font-bold text-sm">Відділення</p>
                      </div>
                    </label>

                    <label 
                      className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                        deliveryType === 'postbox' ? 'border-[#FF3B30] bg-red-50' : 'border-[#EBECEE] hover:border-[#0A0A0A]'
                      }`}
                      data-testid="delivery-postbox"
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="postbox"
                        checked={deliveryType === 'postbox'}
                        onChange={(e) => setDeliveryType(e.target.value)}
                        className="w-5 h-5 accent-[#FF3B30]"
                      />
                      <div>
                        <Package size={20} className="text-[#FF3B30] mb-1" />
                        <p className="font-bold text-sm">Поштомат</p>
                      </div>
                    </label>

                    <label 
                      className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                        deliveryType === 'courier' ? 'border-[#FF3B30] bg-red-50' : 'border-[#EBECEE] hover:border-[#0A0A0A]'
                      }`}
                      data-testid="delivery-courier"
                    >
                      <input
                        type="radio"
                        name="deliveryType"
                        value="courier"
                        checked={deliveryType === 'courier'}
                        onChange={(e) => setDeliveryType(e.target.value)}
                        className="w-5 h-5 accent-[#FF3B30]"
                      />
                      <div>
                        <Home size={20} className="text-[#FF3B30] mb-1" />
                        <p className="font-bold text-sm">Кур'єр</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Branch Number */}
                {deliveryType === 'branch' && (
                  <div>
                    <label className="label-industrial mb-2 block">
                      <Building size={14} className="inline mr-1" />
                      Номер відділення *
                    </label>
                    <input
                      type="text"
                      name="branch_number"
                      value={formData.branch_number}
                      onChange={handleChange}
                      placeholder="Наприклад: 25"
                      className="w-full input-industrial"
                      required
                      data-testid="branch-number-input"
                    />
                  </div>
                )}

                {/* Postbox Number */}
                {deliveryType === 'postbox' && (
                  <div>
                    <label className="label-industrial mb-2 block">
                      <Package size={14} className="inline mr-1" />
                      Номер поштомату *
                    </label>
                    <input
                      type="text"
                      name="postbox_number"
                      value={formData.postbox_number}
                      onChange={handleChange}
                      placeholder="Наприклад: 1234"
                      className="w-full input-industrial"
                      required
                      data-testid="postbox-number-input"
                    />
                  </div>
                )}

                {/* Courier Address */}
                {deliveryType === 'courier' && (
                  <div>
                    <label className="label-industrial mb-2 block">
                      <Home size={14} className="inline mr-1" />
                      Адреса доставки *
                    </label>
                    <input
                      type="text"
                      name="courier_address"
                      value={formData.courier_address}
                      onChange={handleChange}
                      placeholder="вул. Хрещатик, 1, кв. 10"
                      className="w-full input-industrial"
                      required
                      data-testid="courier-address-input"
                    />
                  </div>
                )}

                {/* Phone */}
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
                    placeholder="+380 (96) 567-43-76"
                    className="w-full input-industrial"
                    required
                    data-testid="phone-input"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="label-industrial mb-2 block">
                    <MessageSquare size={14} className="inline mr-1" />
                    Коментар до замовлення
                  </label>
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    placeholder="Додаткова інформація"
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
                {/* Plata by Mono */}
                <label 
                  className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                    paymentMethod === 'mono' ? 'border-[#FF3B30] bg-red-50' : 'border-[#EBECEE] hover:border-[#0A0A0A]'
                  }`}
                  data-testid="payment-mono"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="mono"
                    checked={paymentMethod === 'mono'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 accent-[#FF3B30]"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Plata by Mono</p>
                    <p className="text-xs text-[#474A51]">Оплата карткою онлайн через monobank</p>
                  </div>
                  <div className="bg-black text-white px-3 py-1 text-sm font-bold rounded">
                    mono
                  </div>
                </label>

                {/* LiqPay */}
                <label 
                  className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                    paymentMethod === 'liqpay' ? 'border-[#FF3B30] bg-red-50' : 'border-[#EBECEE] hover:border-[#0A0A0A]'
                  }`}
                  data-testid="payment-liqpay"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="liqpay"
                    checked={paymentMethod === 'liqpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 accent-[#FF3B30]"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">LiqPay</p>
                    <p className="text-xs text-[#474A51]">Оплата карткою Visa/Mastercard</p>
                  </div>
                  <div className="bg-[#7AB72B] text-white px-3 py-1 text-sm font-bold rounded">
                    LiqPay
                  </div>
                </label>

                {/* Platon */}
                <label 
                  className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                    paymentMethod === 'platon' ? 'border-[#FF3B30] bg-red-50' : 'border-[#EBECEE] hover:border-[#0A0A0A]'
                  }`}
                  data-testid="payment-platon"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="platon"
                    checked={paymentMethod === 'platon'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 accent-[#FF3B30]"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">Platon</p>
                    <p className="text-xs text-[#474A51]">Безпечна оплата карткою</p>
                  </div>
                  <div className="bg-[#1E3A8A] text-white px-3 py-1 text-sm font-bold rounded">
                    Platon
                  </div>
                </label>
              </div>

              <p className="mt-4 text-xs text-[#474A51]">
                * Після оформлення замовлення ви отримаєте посилання для оплати
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-14 text-base"
              data-testid="place-order-btn"
            >
              {loading ? 'Оформлення...' : 'Оформити замовлення'}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#EBECEE] p-6 sticky top-24">
            <h2 className="font-bold uppercase tracking-wider mb-4">Ваше замовлення</h2>
            
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
                <span className="text-[#474A51]">Товари ({cart.items.length})</span>
                <span className="font-mono">{formatPrice(cart.total)} ₴</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#474A51]">Доставка</span>
                <span className="font-mono text-[#474A51]">За тарифами НП</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#EBECEE]">
                <span>Разом</span>
                <span className="font-mono" data-testid="order-total">{formatPrice(cart.total)} ₴</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
