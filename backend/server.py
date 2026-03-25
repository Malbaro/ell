from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'ell-parts-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="ELL Parts Store API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    is_admin: bool = False
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float = Field(ge=500, le=30000)
    category: str
    sku: str
    stock: int = 0
    image_url: Optional[str] = None
    specifications: Optional[dict] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=500, le=30000)
    category: Optional[str] = None
    sku: Optional[str] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    specifications: Optional[dict] = None

class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    price: float
    category: str
    sku: str
    stock: int
    image_url: Optional[str] = None
    specifications: Optional[dict] = None
    created_at: str

class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(ge=1)

class CartItemResponse(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image_url: Optional[str] = None

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float

class OrderCreate(BaseModel):
    shipping_address: str
    phone: str
    comment: Optional[str] = None

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    items: List[CartItemResponse]
    total: float
    status: str
    shipping_address: str
    phone: str
    comment: Optional[str] = None
    created_at: str

class FavoriteResponse(BaseModel):
    product_id: str
    added_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, is_admin: bool = False) -> str:
    payload = {
        'user_id': user_id,
        'is_admin': is_admin,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user: dict = Depends(get_current_user)):
    if not user.get('is_admin', False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "phone": data.phone,
        "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Initialize empty cart
    await db.carts.insert_one({"user_id": user_id, "items": []})
    
    token = create_token(user_id)
    user_response = UserResponse(
        id=user_id,
        email=data.email,
        name=data.name,
        phone=data.phone,
        is_admin=False,
        created_at=user_doc["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user.get("is_admin", False))
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        phone=user.get("phone"),
        is_admin=user.get("is_admin", False),
        created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        phone=user.get("phone"),
        is_admin=user.get("is_admin", False),
        created_at=user["created_at"]
    )

# ==================== PRODUCTS ROUTES ====================

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    
    if category:
        query["category"] = category
    
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/categories")
async def get_categories():
    categories = [
        {"id": "engines", "name": "Двигатели и комплектующие", "icon": "engine"},
        {"id": "transmission", "name": "Трансмиссия", "icon": "cog"},
        {"id": "hydraulics", "name": "Гидравлика", "icon": "droplet"},
        {"id": "electrical", "name": "Электрика", "icon": "zap"},
        {"id": "chassis", "name": "Ходовая часть", "icon": "truck"}
    ]
    return categories

# ==================== CART ROUTES ====================

@api_router.get("/cart", response_model=CartResponse)
async def get_cart(user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        return CartResponse(items=[], total=0)
    
    items = []
    total = 0
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item_response = CartItemResponse(
                product_id=item["product_id"],
                name=product["name"],
                price=product["price"],
                quantity=item["quantity"],
                image_url=product.get("image_url")
            )
            items.append(item_response)
            total += product["price"] * item["quantity"]
    
    return CartResponse(items=items, total=total)

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart = await db.carts.find_one({"user_id": user["id"]})
    if not cart:
        await db.carts.insert_one({
            "user_id": user["id"],
            "items": [{"product_id": item.product_id, "quantity": item.quantity}]
        })
    else:
        existing_item = next((i for i in cart["items"] if i["product_id"] == item.product_id), None)
        if existing_item:
            await db.carts.update_one(
                {"user_id": user["id"], "items.product_id": item.product_id},
                {"$inc": {"items.$.quantity": item.quantity}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["id"]},
                {"$push": {"items": {"product_id": item.product_id, "quantity": item.quantity}}}
            )
    
    return {"message": "Added to cart"}

@api_router.put("/cart/update")
async def update_cart_item(item: CartItem, user: dict = Depends(get_current_user)):
    result = await db.carts.update_one(
        {"user_id": user["id"], "items.product_id": item.product_id},
        {"$set": {"items.$.quantity": item.quantity}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not in cart")
    return {"message": "Cart updated"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Removed from cart"}

@api_router.delete("/cart/clear")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$set": {"items": []}}
    )
    return {"message": "Cart cleared"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(data: OrderCreate, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    items = []
    total = 0
    for item in cart["items"]:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item_response = CartItemResponse(
                product_id=item["product_id"],
                name=product["name"],
                price=product["price"],
                quantity=item["quantity"],
                image_url=product.get("image_url")
            )
            items.append(item_response)
            total += product["price"] * item["quantity"]
    
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "user_id": user["id"],
        "items": [item.model_dump() for item in items],
        "total": total,
        "status": "pending",
        "shipping_address": data.shipping_address,
        "phone": data.phone,
        "comment": data.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    # Clear cart after order
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}})
    
    return OrderResponse(**order_doc)

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ==================== FAVORITES ROUTES ====================

@api_router.get("/favorites", response_model=List[ProductResponse])
async def get_favorites(user: dict = Depends(get_current_user)):
    favorites = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    product_ids = [f["product_id"] for f in favorites]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(100)
    return products

@api_router.post("/favorites/{product_id}")
async def add_to_favorites(product_id: str, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = await db.favorites.find_one({"user_id": user["id"], "product_id": product_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    await db.favorites.insert_one({
        "user_id": user["id"],
        "product_id": product_id,
        "added_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{product_id}")
async def remove_from_favorites(product_id: str, user: dict = Depends(get_current_user)):
    await db.favorites.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"message": "Removed from favorites"}

@api_router.get("/favorites/check/{product_id}")
async def check_favorite(product_id: str, user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["id"], "product_id": product_id})
    return {"is_favorite": existing is not None}

# ==================== ADMIN ROUTES ====================

@api_router.post("/admin/products", response_model=ProductResponse)
async def create_product(data: ProductCreate, admin: dict = Depends(get_admin_user)):
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    return ProductResponse(**product_doc)

@api_router.put("/admin/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, data: ProductUpdate, admin: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return ProductResponse(**product)

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@api_router.get("/admin/orders", response_model=List[OrderResponse])
async def get_all_orders(admin: dict = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, admin: dict = Depends(get_admin_user)):
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Calculate total revenue
    orders = await db.orders.find({"status": {"$ne": "cancelled"}}, {"_id": 0, "total": 1}).to_list(1000)
    total_revenue = sum(o.get("total", 0) for o in orders)
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_users": total_users,
        "total_revenue": total_revenue
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    # Check if already seeded
    existing = await db.products.count_documents({})
    if existing > 0:
        return {"message": "Database already seeded"}
    
    products = [
        # Двигатели
        {"id": str(uuid.uuid4()), "name": "Поршень двигателя ЭЛЛ-1000", "description": "Оригинальный поршень для двигателя ЭЛЛ серии 1000. Высокое качество, долговечность.", "price": 2500, "category": "engines", "sku": "ELL-P-1001", "stock": 15, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"diameter": "95mm", "material": "алюминий"}},
        {"id": str(uuid.uuid4()), "name": "Коленвал ЭЛЛ-2000", "description": "Коленчатый вал для двигателей ЭЛЛ серии 2000. Кованая сталь.", "price": 15000, "category": "engines", "sku": "ELL-CV-2001", "stock": 5, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"weight": "18kg", "material": "сталь"}},
        {"id": str(uuid.uuid4()), "name": "Комплект прокладок ГБЦ", "description": "Полный комплект прокладок головки блока цилиндров.", "price": 3200, "category": "engines", "sku": "ELL-GK-3001", "stock": 25, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"type": "полный комплект"}},
        {"id": str(uuid.uuid4()), "name": "Турбина ЭЛЛ-GT35", "description": "Турбокомпрессор повышенной производительности.", "price": 28000, "category": "engines", "sku": "ELL-TB-GT35", "stock": 3, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"boost": "1.2 bar"}},
        
        # Трансмиссия
        {"id": str(uuid.uuid4()), "name": "Сцепление ЭЛЛ-380", "description": "Комплект сцепления: диск, корзина, выжимной подшипник.", "price": 8500, "category": "transmission", "sku": "ELL-CL-380", "stock": 10, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"diameter": "380mm"}},
        {"id": str(uuid.uuid4()), "name": "КПП в сборе ЭЛЛ-6S", "description": "6-ступенчатая коробка передач в сборе.", "price": 25000, "category": "transmission", "sku": "ELL-GB-6S", "stock": 2, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"gears": "6", "type": "механика"}},
        {"id": str(uuid.uuid4()), "name": "Вал карданный", "description": "Карданный вал с крестовинами.", "price": 6800, "category": "transmission", "sku": "ELL-DS-001", "stock": 8, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"length": "1200mm"}},
        
        # Гидравлика
        {"id": str(uuid.uuid4()), "name": "Гидронасос НШ-100", "description": "Шестеренный гидравлический насос.", "price": 12000, "category": "hydraulics", "sku": "ELL-HP-100", "stock": 7, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"flow": "100 л/мин"}},
        {"id": str(uuid.uuid4()), "name": "Гидроцилиндр подъема", "description": "Силовой гидроцилиндр для подъемного механизма.", "price": 9500, "category": "hydraulics", "sku": "ELL-HC-LFT", "stock": 12, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"stroke": "500mm", "bore": "80mm"}},
        {"id": str(uuid.uuid4()), "name": "РВД высокого давления", "description": "Рукав высокого давления с фитингами.", "price": 1800, "category": "hydraulics", "sku": "ELL-HH-001", "stock": 30, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"pressure": "350 bar", "length": "2m"}},
        
        # Электрика
        {"id": str(uuid.uuid4()), "name": "Генератор 28V 100A", "description": "Генератор переменного тока повышенной мощности.", "price": 7500, "category": "electrical", "sku": "ELL-GEN-28", "stock": 6, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"voltage": "28V", "amperage": "100A"}},
        {"id": str(uuid.uuid4()), "name": "Стартер ЭЛЛ-24", "description": "Стартер электрический 24V.", "price": 6200, "category": "electrical", "sku": "ELL-STR-24", "stock": 9, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"voltage": "24V", "power": "5.5kW"}},
        {"id": str(uuid.uuid4()), "name": "Блок управления двигателем", "description": "ЭБУ для электронного управления двигателем.", "price": 18000, "category": "electrical", "sku": "ELL-ECU-001", "stock": 4, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"compatibility": "ЭЛЛ-2000/3000"}},
        
        # Ходовая часть
        {"id": str(uuid.uuid4()), "name": "Ступица переднего колеса", "description": "Ступица в сборе с подшипниками.", "price": 4500, "category": "chassis", "sku": "ELL-HUB-F", "stock": 14, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"position": "передняя"}},
        {"id": str(uuid.uuid4()), "name": "Амортизатор задний", "description": "Масляный амортизатор усиленный.", "price": 3800, "category": "chassis", "sku": "ELL-SHK-R", "stock": 20, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"type": "масляный", "position": "задний"}},
        {"id": str(uuid.uuid4()), "name": "Рессора задняя", "description": "Комплект рессор для заднего моста.", "price": 5500, "category": "chassis", "sku": "ELL-SPR-R", "stock": 11, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"leaves": "12", "load": "8 тонн"}},
        {"id": str(uuid.uuid4()), "name": "Тормозные колодки комплект", "description": "Комплект тормозных колодок на ось.", "price": 2200, "category": "chassis", "sku": "ELL-BRK-001", "stock": 35, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"type": "барабанные"}},
    ]
    
    for p in products:
        p["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_many(products)
    
    # Create admin user
    admin_id = str(uuid.uuid4())
    admin_doc = {
        "id": admin_id,
        "email": "admin@ell-parts.ua",
        "password": hash_password("admin123"),
        "name": "Администратор",
        "phone": "+380501234567",
        "is_admin": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_doc)
    await db.carts.insert_one({"user_id": admin_id, "items": []})
    
    return {"message": "Database seeded successfully", "products_count": len(products)}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "ELL Parts Store API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
