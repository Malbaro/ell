import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Ласкаво просимо!');
      } else {
        if (!formData.name) {
          toast.error('Введіть ім\'я');
          setLoading(false);
          return;
        }
        await register(formData.email, formData.password, formData.name, formData.phone);
        toast.success('Реєстрація успішна!');
      }
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.detail || 'Помилка авторизації';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container" data-testid="auth-page">
      <div className="w-full max-w-md px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[#474A51] hover:text-[#0A0A0A] mb-8"
        >
          <ArrowLeft size={16} />
          На головну
        </Link>

        <div className="auth-form">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-[#FF3B30] text-white font-black text-xl px-3 py-2">ЕЛЛ</div>
              <div>
                <div className="font-bold text-lg tracking-tight">ЗАПЧАСТИНИ</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#EBECEE] mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                isLogin ? 'border-b-2 border-[#0A0A0A] text-[#0A0A0A]' : 'text-[#474A51]'
              }`}
              data-testid="login-tab"
            >
              Вхід
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                !isLogin ? 'border-b-2 border-[#0A0A0A] text-[#0A0A0A]' : 'text-[#474A51]'
              }`}
              data-testid="register-tab"
            >
              Реєстрація
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="label-industrial mb-2 block">Ім'я *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Іван Іванов"
                    className="w-full input-industrial"
                    required={!isLogin}
                    data-testid="name-input"
                  />
                </div>
                <div>
                  <label className="label-industrial mb-2 block">Телефон</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+380 (96) 567-43-76"
                    className="w-full input-industrial"
                    data-testid="phone-input"
                  />
                </div>
              </>
            )}

            <div>
              <label className="label-industrial mb-2 block">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full input-industrial"
                required
                data-testid="email-input"
              />
            </div>

            <div>
              <label className="label-industrial mb-2 block">Пароль *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full input-industrial pr-12"
                  required
                  minLength={6}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#474A51] hover:text-[#0A0A0A]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-12"
              data-testid="submit-btn"
            >
              {loading ? 'Завантаження...' : isLogin ? 'Увійти' : 'Зареєструватися'}
            </Button>
          </form>

          {/* Demo credentials */}
          {isLogin && (
            <div className="mt-6 p-4 bg-[#F7F7F8] border border-[#EBECEE]">
              <p className="label-industrial mb-2">Демо вхід (Адмін):</p>
              <p className="font-mono text-sm">admin@ell-parts.ua</p>
              <p className="font-mono text-sm">admin123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
