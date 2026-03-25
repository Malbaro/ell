import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, 
  Plus, Edit2, Trash2, Search, ChevronDown, Loader2, X 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { id: 'engines', name: 'Двигатели' },
  { id: 'transmission', name: 'Трансмиссия' },
  { id: 'hydraulics', name: 'Гидравлика' },
  { id: 'electrical', name: 'Электрика' },
  { id: 'chassis', name: 'Ходовая' },
];

const statusLabels = {
  pending: { label: 'Ожидает', class: 'status-pending' },
  processing: { label: 'Обработка', class: 'status-processing' },
  shipped: { label: 'Отправлен', class: 'status-shipped' },
  delivered: { label: 'Доставлен', class: 'status-delivered' },
  cancelled: { label: 'Отменён', class: 'status-cancelled' },
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/admin/stats`);
        setStats(response.data);
      } catch (error) {
        toast.error('Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatPrice = (price) => new Intl.NumberFormat('uk-UA').format(price);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" size={40} /></div>;
  }

  return (
    <div data-testid="admin-dashboard">
      <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Панель управления</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#EBECEE] p-6">
          <p className="label-industrial mb-2">Товаров</p>
          <p className="font-mono text-3xl font-bold" data-testid="stats-products">{stats?.total_products || 0}</p>
        </div>
        <div className="bg-white border border-[#EBECEE] p-6">
          <p className="label-industrial mb-2">Заказов</p>
          <p className="font-mono text-3xl font-bold" data-testid="stats-orders">{stats?.total_orders || 0}</p>
        </div>
        <div className="bg-white border border-[#EBECEE] p-6">
          <p className="label-industrial mb-2">Пользователей</p>
          <p className="font-mono text-3xl font-bold" data-testid="stats-users">{stats?.total_users || 0}</p>
        </div>
        <div className="bg-white border border-[#EBECEE] p-6">
          <p className="label-industrial mb-2">Выручка</p>
          <p className="font-mono text-3xl font-bold text-[#34C759]" data-testid="stats-revenue">
            {formatPrice(stats?.total_revenue || 0)} ₴
          </p>
        </div>
      </div>
    </div>
  );
};

// Products Component
const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: 500, category: 'engines', sku: '', stock: 0, image_url: ''
  });

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`${API}/admin/products/${editingProduct.id}`, formData);
        toast.success('Товар обновлён');
      } else {
        await axios.post(`${API}/admin/products`, formData);
        toast.success('Товар создан');
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: 500, category: 'engines', sku: '', stock: 0, image_url: '' });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      sku: product.sku,
      stock: product.stock,
      image_url: product.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await axios.delete(`${API}/admin/products/${id}`);
      toast.success('Товар удалён');
      fetchProducts();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('uk-UA').format(price);

  return (
    <div data-testid="admin-products">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-tight">Товары</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="btn-primary"
              onClick={() => {
                setEditingProduct(null);
                setFormData({ name: '', description: '', price: 500, category: 'engines', sku: '', stock: 0, image_url: '' });
              }}
              data-testid="add-product-btn"
            >
              <Plus size={18} className="mr-2" />
              Добавить товар
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-none">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Редактировать товар' : 'Новый товар'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-industrial mb-1 block">Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full input-industrial"
                  required
                  data-testid="product-name-input"
                />
              </div>
              <div>
                <label className="label-industrial mb-1 block">Описание *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full input-industrial resize-none"
                  rows={3}
                  required
                  data-testid="product-description-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-industrial mb-1 block">Цена (₴) *</label>
                  <input
                    type="number"
                    min="500"
                    max="30000"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full input-industrial"
                    required
                    data-testid="product-price-input"
                  />
                </div>
                <div>
                  <label className="label-industrial mb-1 block">Категория *</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger className="rounded-none" data-testid="product-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-industrial mb-1 block">Артикул *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full input-industrial"
                    required
                    data-testid="product-sku-input"
                  />
                </div>
                <div>
                  <label className="label-industrial mb-1 block">Наличие (шт)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    className="w-full input-industrial"
                    data-testid="product-stock-input"
                  />
                </div>
              </div>
              <div>
                <label className="label-industrial mb-1 block">URL изображения</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full input-industrial"
                  placeholder="https://..."
                  data-testid="product-image-input"
                />
              </div>
              <Button type="submit" className="w-full btn-primary" data-testid="save-product-btn">
                {editingProduct ? 'Сохранить' : 'Создать'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" size={40} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="products-table">
            <thead>
              <tr>
                <th>Артикул</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Наличие</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} data-testid={`product-row-${p.id}`}>
                  <td>{p.sku}</td>
                  <td className="max-w-xs truncate">{p.name}</td>
                  <td>{categories.find(c => c.id === p.category)?.name}</td>
                  <td>{formatPrice(p.price)} ₴</td>
                  <td>{p.stock} шт</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="p-2 hover:bg-[#F7F7F8]" data-testid={`edit-btn-${p.id}`}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 text-[#FF3B30]" data-testid={`delete-btn-${p.id}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Orders Component
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/admin/orders`);
      setOrders(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/admin/orders/${orderId}/status?status=${status}`);
      toast.success('Статус обновлён');
      fetchOrders();
    } catch (error) {
      toast.error('Ошибка обновления');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('uk-UA').format(price);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('uk-UA');

  return (
    <div data-testid="admin-orders">
      <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Заказы</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" size={40} /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#EBECEE]">
          <p className="text-[#474A51]">Заказов пока нет</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Дата</th>
                <th>Товаров</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Адрес</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} data-testid={`order-row-${order.id}`}>
                  <td className="font-mono">#{order.id.slice(0, 8)}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{order.items.length}</td>
                  <td className="font-bold">{formatPrice(order.total)} ₴</td>
                  <td>
                    <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                      <SelectTrigger className="w-32 rounded-none h-8 text-xs" data-testid={`status-select-${order.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="pending">Ожидает</SelectItem>
                        <SelectItem value="processing">Обработка</SelectItem>
                        <SelectItem value="shipped">Отправлен</SelectItem>
                        <SelectItem value="delivered">Доставлен</SelectItem>
                        <SelectItem value="cancelled">Отменён</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="max-w-xs truncate">{order.shipping_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Main Admin Component
export const Admin = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  if (!user?.is_admin) return null;

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
    { path: '/admin/products', icon: Package, label: 'Товары' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Заказы' },
  ];

  return (
    <div className="min-h-screen flex" data-testid="admin-panel">
      {/* Sidebar */}
      <aside className="admin-sidebar hidden md:flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="bg-[#FF3B30] text-white font-black px-2 py-1">ЭЛЛ</div>
            <span className="font-bold text-sm">АДМИН</span>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link to="/" className="admin-nav-item">
            <LogOut size={20} />
            На сайт
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#F7F7F8]">
        {/* Mobile Header */}
        <div className="md:hidden bg-[#0A0A0A] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#FF3B30] text-white font-black px-2 py-1">ЭЛЛ</div>
            <span className="font-bold text-sm">АДМИН</span>
          </div>
          <Link to="/" className="text-sm">На сайт</Link>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex border-b border-[#EBECEE] bg-white overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap ${
                  isActive ? 'text-[#FF3B30] border-b-2 border-[#FF3B30]' : 'text-[#474A51]'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<AdminOrders />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};
