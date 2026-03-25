import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#0A0A0A] text-white mt-16" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#FF3B30] text-white font-black text-xl px-3 py-2">ЭЛЛ</div>
              <div>
                <div className="font-bold text-lg tracking-tight">ЗАПЧАСТИ</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">к технике</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Надежные запчасти для техники ЭЛЛ. Гарантия качества и быстрая доставка по всей Украине.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Каталог</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/catalog?category=engines" className="text-gray-400 hover:text-white text-sm transition-colors">
                Двигатели и комплектующие
              </Link>
              <Link to="/catalog?category=transmission" className="text-gray-400 hover:text-white text-sm transition-colors">
                Трансмиссия
              </Link>
              <Link to="/catalog?category=hydraulics" className="text-gray-400 hover:text-white text-sm transition-colors">
                Гидравлика
              </Link>
              <Link to="/catalog?category=electrical" className="text-gray-400 hover:text-white text-sm transition-colors">
                Электрика
              </Link>
              <Link to="/catalog?category=chassis" className="text-gray-400 hover:text-white text-sm transition-colors">
                Ходовая часть
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Покупателям</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/catalog" className="text-gray-400 hover:text-white text-sm transition-colors">
                Каталог товаров
              </Link>
              <Link to="/auth" className="text-gray-400 hover:text-white text-sm transition-colors">
                Регистрация
              </Link>
              <span className="text-gray-400 text-sm">Доставка и оплата</span>
              <span className="text-gray-400 text-sm">Гарантия</span>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Контакты</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+380501234567" className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors">
                <Phone size={16} />
                +380 (50) 123-45-67
              </a>
              <a href="mailto:info@ell-parts.ua" className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors">
                <Mail size={16} />
                info@ell-parts.ua
              </a>
              <div className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                г. Киев, ул. Промышленная, 25
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <Clock size={16} />
                Пн-Пт: 9:00-18:00
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 ЭЛЛ Запчасти. Все права защищены.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-xs">Принимаем к оплате:</span>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded">
              <span className="font-bold text-sm">mono</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
