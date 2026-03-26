# Базовый Python образ
FROM python:3.14-slim

# Рабочая директория
WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY . .

# Открываем порт
EXPOSE 8000

# Команда запуска сервера
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
