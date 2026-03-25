import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

export const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, loading } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA').format(price);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 rounded-none border-l border-[#EBECEE]" data-testid="cart-drawer">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b border-[#EBECEE]">
            <SheetTitle className="flex items-center gap-2 text-left font-bold uppercase tracking-wide">
              <ShoppingBag size={20} />
              Корзина ({cart.items.length})
            </SheetTitle>
          </SheetHeader>

          {cart.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <ShoppingBag size={64} className="text-[#D1D3D8] mb-4" />
              <p className="text-[#474A51] mb-4">Ваша корзина пуста</p>
              <Button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/catalog');
                }}
                className="btn-secondary"
                data-testid="continue-shopping-btn"
              >
                Перейти в каталог
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {cart.items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex gap-4 p-4 border border-[#EBECEE] mb-3 bg-white"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    <div className="w-20 h-20 bg-[#F7F7F8] flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#D1D3D8]">
                          <ShoppingBag size={24} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1 truncate">{item.name}</h4>
                      <p className="font-mono font-bold text-[#FF3B30]">
                        {formatPrice(item.price)} ₴
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 border border-[#EBECEE] flex items-center justify-center hover:bg-[#F7F7F8]"
                          data-testid={`decrease-qty-${item.product_id}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-mono w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="w-8 h-8 border border-[#EBECEE] flex items-center justify-center hover:bg-[#F7F7F8]"
                          data-testid={`increase-qty-${item.product_id}`}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="ml-auto w-8 h-8 text-[#FF3B30] hover:bg-red-50 flex items-center justify-center"
                          data-testid={`remove-item-${item.product_id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#EBECEE] p-6 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="label-industrial">Итого:</span>
                  <span className="font-mono font-bold text-2xl" data-testid="cart-total">
                    {formatPrice(cart.total)} ₴
                  </span>
                </div>
                
                <Button
                  onClick={handleCheckout}
                  className="w-full btn-primary h-12"
                  data-testid="checkout-btn"
                >
                  Оформить заказ
                </Button>
                
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full mt-2 text-center text-sm text-[#474A51] hover:text-[#0A0A0A] py-2"
                >
                  Продолжить покупки
                </button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
