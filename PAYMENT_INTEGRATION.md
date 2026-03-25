# Інструкції з підключення платіжних систем

## 1. Plata by Mono (monobank)

### Крок 1: Реєстрація
1. Перейдіть на https://api.monobank.ua/
2. Зареєструйте бізнес-акаунт
3. Заповніть всі необхідні дані про компанію

### Крок 2: Отримання токенів
1. У особистому кабінеті перейдіть в розділ "API"
2. Створіть новий токен для інтеграції
3. Скопіюйте `X-Token` (приватний ключ)

### Крок 3: Інтеграція в код
Додайте в `/app/backend/.env`:
```
MONO_TOKEN=ваш_токен
```

Приклад коду для створення інвойсу:
```python
import requests

async def create_mono_invoice(amount: int, order_id: str):
    headers = {"X-Token": os.environ["MONO_TOKEN"]}
    data = {
        "amount": amount * 100,  # в копійках
        "ccy": 980,  # UAH
        "merchantPaymInfo": {
            "reference": order_id,
            "destination": f"Оплата замовлення #{order_id[:8]}"
        },
        "redirectUrl": f"https://ваш-сайт.ua/orders?success=true",
        "webHookUrl": f"https://ваш-сайт.ua/api/webhooks/mono"
    }
    response = requests.post(
        "https://api.monobank.ua/api/merchant/invoice/create",
        json=data,
        headers=headers
    )
    return response.json()["pageUrl"]
```

---

## 2. LiqPay (ПриватБанк)

### Крок 1: Реєстрація
1. Перейдіть на https://www.liqpay.ua/
2. Зареєструйтесь як мерчант
3. Підтвердіть бізнес-дані

### Крок 2: Отримання ключів
1. Увійдіть в особистий кабінет LiqPay
2. Перейдіть в "Налаштування магазину"
3. Скопіюйте `public_key` та `private_key`

### Крок 3: Інтеграція в код
Додайте в `/app/backend/.env`:
```
LIQPAY_PUBLIC_KEY=ваш_public_key
LIQPAY_PRIVATE_KEY=ваш_private_key
```

Встановіть бібліотеку:
```bash
pip install liqpay-sdk-python3
```

Приклад коду:
```python
from liqpay import LiqPay
import os

liqpay = LiqPay(os.environ["LIQPAY_PUBLIC_KEY"], os.environ["LIQPAY_PRIVATE_KEY"])

def create_liqpay_form(amount: float, order_id: str):
    params = {
        "action": "pay",
        "amount": str(amount),
        "currency": "UAH",
        "description": f"Оплата замовлення #{order_id[:8]}",
        "order_id": order_id,
        "version": "3",
        "server_url": "https://ваш-сайт.ua/api/webhooks/liqpay",
        "result_url": "https://ваш-сайт.ua/orders?success=true"
    }
    
    return {
        "data": liqpay.cnb_data(params),
        "signature": liqpay.cnb_signature(params)
    }
```

HTML форма:
```html
<form method="POST" action="https://www.liqpay.ua/api/3/checkout">
    <input type="hidden" name="data" value="{data}" />
    <input type="hidden" name="signature" value="{signature}" />
    <button type="submit">Оплатити через LiqPay</button>
</form>
```

---

## 3. Platon

### Крок 1: Реєстрація
1. Перейдіть на https://platon.ua/
2. Зв'яжіться з менеджером для підключення
3. Надайте документи компанії

### Крок 2: Отримання ключів
1. Після підтвердження отримаєте:
   - `PLATON_KEY` (ключ мерчанта)
   - `PLATON_PASSWORD` (пароль для підпису)

### Крок 3: Інтеграція в код
Додайте в `/app/backend/.env`:
```
PLATON_KEY=ваш_ключ
PLATON_PASSWORD=ваш_пароль
```

Приклад коду:
```python
import hashlib
import os

def create_platon_payment(amount: float, order_id: str, description: str):
    key = os.environ["PLATON_KEY"]
    password = os.environ["PLATON_PASSWORD"]
    
    # Формуємо дані
    data = {
        "key": key,
        "payment": "CC",
        "amount": f"{amount:.2f}",
        "currency": "UAH",
        "order": order_id,
        "description": description,
        "url": "https://ваш-сайт.ua/api/webhooks/platon",
        "error_url": "https://ваш-сайт.ua/checkout?error=true"
    }
    
    # Створюємо підпис
    sign_string = f"{key}{amount:.2f}UAH{description}{password}"
    data["sign"] = hashlib.md5(sign_string.encode()).hexdigest()
    
    return data

# HTML форма
def get_platon_form(data):
    return f'''
    <form method="POST" action="https://secure.platon.ua/payment/auth">
        <input type="hidden" name="key" value="{data['key']}" />
        <input type="hidden" name="payment" value="{data['payment']}" />
        <input type="hidden" name="amount" value="{data['amount']}" />
        <input type="hidden" name="currency" value="{data['currency']}" />
        <input type="hidden" name="order" value="{data['order']}" />
        <input type="hidden" name="description" value="{data['description']}" />
        <input type="hidden" name="url" value="{data['url']}" />
        <input type="hidden" name="sign" value="{data['sign']}" />
        <button type="submit">Оплатити через Platon</button>
    </form>
    '''
```

---

## Загальні рекомендації

### Webhook обробка
Для кожної платіжної системи створіть endpoint для отримання callback:

```python
@api_router.post("/webhooks/mono")
async def mono_webhook(request: Request):
    data = await request.json()
    if data.get("status") == "success":
        order_id = data["reference"]
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"status": "paid"}}
        )
    return {"ok": True}

@api_router.post("/webhooks/liqpay")
async def liqpay_webhook(request: Request):
    form = await request.form()
    # Перевірка підпису та оновлення статусу
    return {"ok": True}

@api_router.post("/webhooks/platon")
async def platon_webhook(request: Request):
    form = await request.form()
    # Перевірка підпису та оновлення статусу
    return {"ok": True}
```

### Безпека
1. Завжди перевіряйте підпис webhook
2. Зберігайте ключі тільки в .env
3. Використовуйте HTTPS
4. Логуйте всі транзакції

### Тестування
- Mono: використовуйте тестовий токен
- LiqPay: sandbox режим в налаштуваннях
- Platon: тестовий мерчант від підтримки

---

## Контакти підтримки платіжних систем

- **Mono**: api@monobank.ua
- **LiqPay**: support@liqpay.ua  
- **Platon**: support@platon.ua

