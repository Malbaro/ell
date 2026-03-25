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
              <div className="bg-[#FF3B30] text-white font-black text-xl px-3 py-2">ЕЛЛ</div>
              <div>
                <div className="font-bold text-lg tracking-tight">ЗАПЧАСТИНИ</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">до техніки</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Надійні запчастини для техніки ЕЛЛ. Гарантія якості та швидка доставка Новою Поштою по всій Україні.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Каталог</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/catalog?category=engines" className="text-gray-400 hover:text-white text-sm transition-colors">
                Двигуни та комплектуючі
              </Link>
              <Link to="/catalog?category=transmission" className="text-gray-400 hover:text-white text-sm transition-colors">
                Трансмісія
              </Link>
              <Link to="/catalog?category=hydraulics" className="text-gray-400 hover:text-white text-sm transition-colors">
                Гідравліка
              </Link>
              <Link to="/catalog?category=electrical" className="text-gray-400 hover:text-white text-sm transition-colors">
                Електрика
              </Link>
              <Link to="/catalog?category=chassis" className="text-gray-400 hover:text-white text-sm transition-colors">
                Ходова частина
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Покупцям</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/catalog" className="text-gray-400 hover:text-white text-sm transition-colors">
                Каталог товарів
              </Link>
              <Link to="/auth" className="text-gray-400 hover:text-white text-sm transition-colors">
                Реєстрація
              </Link>
              <span className="text-gray-400 text-sm">Доставка Новою Поштою</span>
              <span className="text-gray-400 text-sm">Гарантія</span>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Контакти</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+380965674376" className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors">
                <Phone size={16} />
                +380 (96) 567-43-76
              </a>
              <a href="mailto:info@ell-parts.ua" className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors">
                <Mail size={16} />
                info@ell-parts.ua
              </a>
              <div className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                м. Київ, вул. Промислова, 25
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
            © 2024 ЕЛЛ Запчастини. Всі права захищені.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">Приймаємо до оплати:</span>
            <div className="flex items-center gap-2">
              <div className="bg-black border border-gray-700 text-white px-2 py-1 text-xs font-bold rounded">mono</div>
              <div className="bg-[#7AB72B] text-white px-2 py-1 text-xs font-bold rounded">LiqPay</div>
              <div className="bg-[#1E3A8A] text-white px-2 py-1 text-xs font-bold rounded">Platon</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
