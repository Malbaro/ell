import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Calendar, MapPin, Phone, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusLabels = {
  pending: { label: 'Ожидает', class: 'status-pending' },
  processing: { label: 'Обработка', class: 'status-processing' },
  shipped: { label: 'Отправлен', class: 'status-shipped' },
  delivered: { label: 'Доставлен', class: 'status-delivered' },
  cancelled: { label: 'Отменён', class: 'status-cancelled' },
};

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API}/orders`);
        setOrders(response.data);
      } catch (error) {
        toast.error('Ошибка загрузки заказов');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA').format(price);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-[#F7F7F8]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="orders-page">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[#474A51] hover:text-[#0A0A0A] mb-8"
      >
        <ArrowLeft size={16} />
        На главную
      </Link>

      <h1 className="text-3xl font-bold uppercase tracking-tight mb-8">Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#EBECEE]">
          <Package size={64} className="mx-auto text-[#D1D3D8] mb-4" />
          <p className="text-[#474A51] mb-4">У вас пока нет заказов</p>
          <Link to="/catalog">
            <button className="btn-primary">Перейти в каталог</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-[#EBECEE] p-6"
              data-testid={`order-card-${order.id}`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4 pb-4 border-b border-[#EBECEE]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-mono font-bold">#{order.id.slice(0, 8).toUpperCase()}</h3>
                    <span className={statusLabels[order.status]?.class || 'status-pending'}>
                      {statusLabels[order.status]?.label || order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-[#474A51]">
                    <Calendar size={14} />
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="label-industrial">Сумма заказа</p>
                  <p className="font-mono font-bold text-xl">{formatPrice(order.total)} ₴</p>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-wrap gap-3 mb-4">
                {order.items.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="w-16 h-16 bg-[#F7F7F8] border border-[#EBECEE]">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D1D3D8]">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="w-16 h-16 bg-[#F7F7F8] border border-[#EBECEE] flex items-center justify-center">
                    <span className="font-mono text-sm font-bold">+{order.items.length - 4}</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-[#474A51] mt-0.5 flex-shrink-0" />
                  <span className="text-[#474A51]">{order.shipping_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-[#474A51]" />
                  <span className="text-[#474A51]">{order.phone}</span>
                </div>
              </div>

              {/* Items List */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-bold uppercase text-[#474A51] hover:text-[#0A0A0A] flex items-center gap-1">
                  Товары ({order.items.length})
                  <ChevronRight size={16} className="transition-transform" />
                </summary>
                <div className="mt-3 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-[#EBECEE] last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-[#474A51]">× {item.quantity}</span>
                      </div>
                      <span className="font-mono font-bold">{formatPrice(item.price * item.quantity)} ₴</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
