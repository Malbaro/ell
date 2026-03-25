import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Headphones, Wrench, Cog, Droplet, Zap, Settings2 } from 'lucide-react';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { id: 'engines', name: 'Двигатели и комплектующие', icon: Wrench, image: 'https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 'transmission', name: 'Трансмиссия', icon: Cog, image: 'https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 'hydraulics', name: 'Гидравлика', icon: Droplet, image: 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 'electrical', name: 'Электрика', icon: Zap, image: 'https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 'chassis', name: 'Ходовая часть', icon: Settings2, image: 'https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=600' },
];

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Seed database first
        await axios.post(`${API}/seed`);
        const response = await axios.get(`${API}/products?limit=8`);
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section className="hero-section" data-testid="hero-section">
        <img
          src="https://images.pexels.com/photos/5158155/pexels-photo-5158155.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Engine parts"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="hero-overlay" />
        <div className="hero-content max-w-7xl mx-auto w-full px-4">
          <span className="label-industrial text-white/60 mb-4 block">
            Официальный поставщик
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight mb-6">
            Запчасти<br />для техники ЭЛЛ
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl">
            Оригинальные комплектующие и надежные аналоги. Цены от 500 до 30 000 грн. 
            Доставка по всей Украине.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/catalog">
              <Button className="btn-primary h-14 px-8 text-base" data-testid="hero-catalog-btn">
                Перейти в каталог
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="btn-secondary h-14 px-8 text-base border-white text-white hover:bg-white hover:text-[#0A0A0A]">
                Регистрация
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-[#EBECEE]" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4">
              <div className="w-14 h-14 bg-[#F7F7F8] flex items-center justify-center">
                <Truck size={24} className="text-[#FF3B30]" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase">Быстрая доставка</h3>
                <p className="text-sm text-[#474A51]">По всей Украине за 1-3 дня</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="w-14 h-14 bg-[#F7F7F8] flex items-center justify-center">
                <Shield size={24} className="text-[#FF3B30]" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase">Гарантия качества</h3>
                <p className="text-sm text-[#474A51]">Официальная гарантия от 12 мес</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="w-14 h-14 bg-[#F7F7F8] flex items-center justify-center">
                <Headphones size={24} className="text-[#FF3B30]" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase">Поддержка 24/7</h3>
                <p className="text-sm text-[#474A51]">Консультация специалистов</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12" data-testid="categories-section">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">Категории</h2>
          <Link to="/catalog" className="nav-link flex items-center gap-2">
            Все товары <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/catalog?category=${cat.id}`}
                className="category-card"
                data-testid={`category-card-${cat.id}`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="category-card-overlay" />
                <div className="relative z-10 w-full">
                  <Icon size={24} className="text-[#FF3B30] mb-2" />
                  <h3 className="text-white font-bold text-sm uppercase">{cat.name}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 py-12" data-testid="products-section">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">Популярные товары</h2>
          <Link to="/catalog" className="nav-link flex items-center gap-2">
            Смотреть все <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="product-card">
                <div className="aspect-square bg-[#F7F7F8] skeleton" />
                <div className="h-4 bg-[#F7F7F8] skeleton w-1/3 mt-4" />
                <div className="h-5 bg-[#F7F7F8] skeleton w-full mt-2" />
                <div className="h-4 bg-[#F7F7F8] skeleton w-1/2 mt-2" />
                <div className="h-10 bg-[#F7F7F8] skeleton w-full mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-[#0A0A0A] text-white" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-4">
                Нужна консультация?
              </h2>
              <p className="text-gray-400 mb-6">
                Наши специалисты помогут подобрать нужные запчасти и ответят на все вопросы. 
                Звоните или оставьте заявку.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="tel:+380501234567">
                  <Button className="btn-primary h-12">
                    +380 (50) 123-45-67
                  </Button>
                </a>
                <Link to="/catalog">
                  <Button className="btn-secondary border-white text-white hover:bg-white hover:text-[#0A0A0A] h-12">
                    Каталог товаров
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="bg-white/10 p-8 max-w-sm">
                <div className="font-mono text-5xl font-bold text-[#FF3B30] mb-2">500+</div>
                <p className="text-gray-400">товаров в наличии</p>
                <div className="font-mono text-5xl font-bold text-[#FF3B30] mb-2 mt-6">24/7</div>
                <p className="text-gray-400">поддержка клиентов</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
