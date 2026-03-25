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
    email: str
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
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
        # =============== ДВИГУ|ни (engines) ===============
        # Для тракторів МТЗ Беларус
        {"id": str(uuid.uuid4()), "name": "Поршень Д-240 МТЗ-80/82", "description": "Поршень для двигуна Д-240 тракторів МТЗ-80, МТЗ-82. Діаметр 110 мм. Виробник - Кострома.", "price": 1850, "category": "engines", "sku": "D240-PORSH-110", "stock": 25, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"діаметр": "110 мм", "матеріал": "алюміній", "сумісність": "МТЗ-80/82"}},
        {"id": str(uuid.uuid4()), "name": "Гільза циліндра Д-240", "description": "Гільза циліндра для двигуна Д-240. Чавун високоміцний. Оригінал ММЗ.", "price": 2200, "category": "engines", "sku": "D240-GILZA", "stock": 18, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"діаметр": "110 мм", "матеріал": "чавун"}},
        {"id": str(uuid.uuid4()), "name": "Колінвал Д-240 МТЗ", "description": "Колінчастий вал для двигуна Д-240. Кований, азотований. Виробництво Білорусь.", "price": 12500, "category": "engines", "sku": "D240-KOLINVAL", "stock": 4, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"вага": "52 кг", "обробка": "азотування"}},
        {"id": str(uuid.uuid4()), "name": "Турбокомпресор ТКР-6 МТЗ", "description": "Турбіна ТКР-6 для тракторів МТЗ-80/82 з двигуном Д-240/243. Підвищує потужність на 20%.", "price": 8900, "category": "engines", "sku": "TKR6-MTZ", "stock": 7, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"тиск": "0.7 бар", "витрата": "до 400 м³/год"}},
        {"id": str(uuid.uuid4()), "name": "Головка блоку Д-240 в зборі", "description": "ГБЦ для двигуна Д-240 в зборі з клапанами. Оригінал ММЗ.", "price": 15800, "category": "engines", "sku": "D240-GBC-ZBIRKA", "stock": 3, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"комплектація": "повна", "клапани": "8 шт"}},
        
        # Для комбайнів Дон, Нива
        {"id": str(uuid.uuid4()), "name": "Поршнева група СМД-31 Дон-1500", "description": "Комплект поршневої групи для двигуна СМД-31 комбайна Дон-1500. 6 циліндрів.", "price": 18500, "category": "engines", "sku": "SMD31-PORSH-KIT", "stock": 5, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"циліндрів": "6", "діаметр": "130 мм"}},
        {"id": str(uuid.uuid4()), "name": "ТНВД СМД-18 Нива СК-5", "description": "Паливний насос високого тиску для двигуна СМД-18 комбайна Нива СК-5.", "price": 9800, "category": "engines", "sku": "SMD18-TNVD", "stock": 6, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"тип": "рядний", "секцій": "4"}},
        {"id": str(uuid.uuid4()), "name": "Форсунка Д-260 МТЗ-1221", "description": "Форсунка паливна для двигуна Д-260 трактора МТЗ-1221. Оригінал ЯЗДА.", "price": 2400, "category": "engines", "sku": "D260-FORSUNKA", "stock": 20, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"тиск": "220 бар", "тип": "механічна"}},
        {"id": str(uuid.uuid4()), "name": "Прокладка ГБЦ Д-240", "description": "Прокладка головки блоку циліндрів Д-240. Безазбестова, металоармована.", "price": 850, "category": "engines", "sku": "D240-PROKLADKA-GBC", "stock": 40, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"матеріал": "металоармована"}},
        {"id": str(uuid.uuid4()), "name": "Вкладиші корінні Д-240 Н1", "description": "Комплект корінних вкладишів Д-240 перший ремонтний розмір.", "price": 1200, "category": "engines", "sku": "D240-VKLAD-KOR-N1", "stock": 15, "image_url": "https://images.pexels.com/photos/190539/pexels-photo-190539.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"розмір": "Н1 (+0.25)", "комплект": "5 пар"}},
        
        # =============== ТРАНСМІСІЯ (transmission) ===============
        {"id": str(uuid.uuid4()), "name": "Диск зчеплення МТЗ-80 посилений", "description": "Диск зчеплення для МТЗ-80/82. Посилені накладки, підвищений ресурс.", "price": 3200, "category": "transmission", "sku": "MTZ80-DISK-ZCHEP", "stock": 12, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"діаметр": "340 мм", "тип": "посилений"}},
        {"id": str(uuid.uuid4()), "name": "Кошик зчеплення МТЗ-80", "description": "Корзина зчеплення (натискний диск) для тракторів МТЗ-80/82.", "price": 4500, "category": "transmission", "sku": "MTZ80-KOSHIK", "stock": 8, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"тип": "пелюстковий"}},
        {"id": str(uuid.uuid4()), "name": "КПП МТЗ-80 в зборі", "description": "Коробка передач МТЗ-80 в зборі. Після капітального ремонту з гарантією.", "price": 28000, "category": "transmission", "sku": "MTZ80-KPP-ZBIRKA", "stock": 2, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"передач": "18+4", "гарантія": "6 міс"}},
        {"id": str(uuid.uuid4()), "name": "Вал первинний КПП МТЗ", "description": "Первинний вал коробки передач МТЗ-80/82. Загартована сталь.", "price": 5800, "category": "transmission", "sku": "MTZ-VAL-PERV", "stock": 6, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"матеріал": "сталь 40Х"}},
        {"id": str(uuid.uuid4()), "name": "Підшипник вижимний МТЗ", "description": "Вижимний підшипник зчеплення МТЗ-80/82. SKF оригінал.", "price": 1800, "category": "transmission", "sku": "MTZ-PODSH-VIZH", "stock": 18, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"виробник": "SKF", "тип": "кульковий"}},
        {"id": str(uuid.uuid4()), "name": "Редуктор ПВМ МТЗ-82", "description": "Редуктор переднього ведучого моста МТЗ-82. Новий, заводський.", "price": 22000, "category": "transmission", "sku": "MTZ82-RED-PVM", "stock": 3, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"передатне число": "5.1"}},
        {"id": str(uuid.uuid4()), "name": "Кардан МТЗ-82 переднього моста", "description": "Карданний вал переднього моста МТЗ-82. В зборі з хрестовинами.", "price": 7500, "category": "transmission", "sku": "MTZ82-KARDAN-PER", "stock": 5, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"довжина": "850 мм"}},
        {"id": str(uuid.uuid4()), "name": "Синхронізатор КПП МТЗ 3-4 передачі", "description": "Синхронізатор 3-4 передачі КПП МТЗ-80/82. Оригінал.", "price": 2800, "category": "transmission", "sku": "MTZ-SINHR-34", "stock": 10, "image_url": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"передачі": "3-4"}},
        
        # =============== ГІДРАВЛІКА (hydraulics) ===============
        {"id": str(uuid.uuid4()), "name": "Насос НШ-32 МТЗ", "description": "Шестеренний гідронасос НШ-32 для МТЗ-80/82. Правого обертання.", "price": 4200, "category": "hydraulics", "sku": "NSH32-MTZ-PRAV", "stock": 14, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"продуктивність": "32 л/хв", "тиск": "160 бар"}},
        {"id": str(uuid.uuid4()), "name": "Насос НШ-100 Дон-1500", "description": "Гідронасос НШ-100 для комбайна Дон-1500. Висока продуктивність.", "price": 8500, "category": "hydraulics", "sku": "NSH100-DON", "stock": 4, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"продуктивність": "100 л/хв", "тиск": "200 бар"}},
        {"id": str(uuid.uuid4()), "name": "Гідроциліндр ЦС-100 МТЗ", "description": "Гідроциліндр силовий ЦС-100 для навісного обладнання МТЗ.", "price": 6800, "category": "hydraulics", "sku": "CS100-MTZ", "stock": 9, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"діаметр": "100 мм", "хід": "400 мм"}},
        {"id": str(uuid.uuid4()), "name": "Гідроциліндр підйому кузова ГАЗ-САЗ", "description": "Гідроциліндр підйому кузова самоскида ГАЗ-САЗ 3507.", "price": 9200, "category": "hydraulics", "sku": "GC-GAZ-SAZ", "stock": 5, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"хід": "1200 мм", "зусилля": "12 т"}},
        {"id": str(uuid.uuid4()), "name": "Розподільник Р-80 МТЗ", "description": "Гідророзподільник Р-80 3/1-222 для МТЗ-80/82. Три секції.", "price": 5500, "category": "hydraulics", "sku": "R80-MTZ-3SEK", "stock": 7, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"секцій": "3", "тиск": "160 бар"}},
        {"id": str(uuid.uuid4()), "name": "Фільтр гідравлічний МТЗ", "description": "Фільтр масляний гідросистеми МТЗ-80/82. Фільтруючий елемент.", "price": 650, "category": "hydraulics", "sku": "FILTR-GID-MTZ", "stock": 50, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"тонкість": "25 мкм"}},
        {"id": str(uuid.uuid4()), "name": "РВД 16х800 DK з гайками", "description": "Рукав високого тиску 16 мм, довжина 800 мм. З гайками під ключ 24.", "price": 580, "category": "hydraulics", "sku": "RVD-16-800", "stock": 35, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"діаметр": "16 мм", "довжина": "800 мм", "тиск": "250 бар"}},
        {"id": str(uuid.uuid4()), "name": "Гідрозамок односторонній", "description": "Гідрозамок односторонньої дії для фіксації гідроциліндрів.", "price": 1200, "category": "hydraulics", "sku": "GZ-ODNOSTOR", "stock": 20, "image_url": "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"тиск": "320 бар"}},
        
        # =============== ЕЛЕКТРИКА (electrical) ===============
        {"id": str(uuid.uuid4()), "name": "Генератор Г-464 МТЗ 14В 1кВт", "description": "Генератор Г-464.3701 для МТЗ-80/82. 14 Вольт, 1000 Ватт.", "price": 4800, "category": "electrical", "sku": "G464-MTZ-14V", "stock": 8, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"напруга": "14 В", "потужність": "1000 Вт"}},
        {"id": str(uuid.uuid4()), "name": "Стартер СТ-212 МТЗ 12В", "description": "Стартер СТ-212 для МТЗ-80/82. Редукторний, підвищена потужність.", "price": 5200, "category": "electrical", "sku": "ST212-MTZ-12V", "stock": 6, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"напруга": "12 В", "потужність": "3.5 кВт"}},
        {"id": str(uuid.uuid4()), "name": "Стартер СТ-142 ЗІЛ/МАЗ 24В", "description": "Стартер СТ-142 для вантажівок ЗІЛ, МАЗ. 24 Вольт.", "price": 7800, "category": "electrical", "sku": "ST142-ZIL-24V", "stock": 4, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"напруга": "24 В", "потужність": "8.2 кВт"}},
        {"id": str(uuid.uuid4()), "name": "Реле-регулятор напруги РР-362", "description": "Реле-регулятор РР-362 для генератора МТЗ. Підтримує 14В.", "price": 850, "category": "electrical", "sku": "RR362-MTZ", "stock": 15, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"напруга": "14 В"}},
        {"id": str(uuid.uuid4()), "name": "Свічка розжарювання СР-65 Д-240", "description": "Свічка розжарювання для дизеля Д-240. Комплект 4 шт.", "price": 1100, "category": "electrical", "sku": "SR65-D240-4SHT", "stock": 22, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"комплект": "4 шт", "напруга": "12 В"}},
        {"id": str(uuid.uuid4()), "name": "Щітки генератора МТЗ комплект", "description": "Комплект щіток для генератора Г-464 МТЗ-80/82.", "price": 320, "category": "electrical", "sku": "SHITKY-G464", "stock": 30, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"комплект": "2 шт"}},
        {"id": str(uuid.uuid4()), "name": "Датчик тиску масла ММ-358 МТЗ", "description": "Датчик аварійного тиску масла ММ-358 для МТЗ.", "price": 280, "category": "electrical", "sku": "MM358-MTZ", "stock": 25, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"тиск спрацювання": "0.4-0.8 кгс/см²"}},
        {"id": str(uuid.uuid4()), "name": "Проводка МТЗ-80 повний комплект", "description": "Джгут проводів МТЗ-80 повний комплект. Мідь, якісна ізоляція.", "price": 3500, "category": "electrical", "sku": "PROVODKA-MTZ80", "stock": 5, "image_url": "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"матеріал": "мідь", "комплектація": "повна"}},
        
        # =============== ХОДОВА ЧАСТИНА (chassis) ===============
        {"id": str(uuid.uuid4()), "name": "Шина 15.5R38 Ф-2А передня МТЗ", "description": "Шина передня 15.5R38 Ф-2А для МТЗ-80/82. Волтайр, новая.", "price": 8500, "category": "chassis", "sku": "SHINA-155R38-F2A", "stock": 8, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"розмір": "15.5R38", "малюнок": "Ф-2А"}},
        {"id": str(uuid.uuid4()), "name": "Шина 9.00-20 В-103 ведуча МТЗ", "description": "Шина задня ведуча 9.00-20 В-103 для МТЗ-80. Посилений корд.", "price": 4200, "category": "chassis", "sku": "SHINA-900-20-V103", "stock": 12, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"розмір": "9.00-20", "шарів": "10"}},
        {"id": str(uuid.uuid4()), "name": "Ступиця заднього колеса МТЗ", "description": "Ступиця заднього колеса МТЗ-80/82 в зборі з підшипниками.", "price": 6500, "category": "chassis", "sku": "STUPICA-ZAD-MTZ", "stock": 6, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"комплектація": "з підшипниками"}},
        {"id": str(uuid.uuid4()), "name": "Підшипник маточини 7516 МТЗ", "description": "Підшипник маточини заднього колеса 7516 для МТЗ. ГПЗ.", "price": 1400, "category": "chassis", "sku": "PODSH-7516-MTZ", "stock": 16, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"номер": "7516", "тип": "роликовий"}},
        {"id": str(uuid.uuid4()), "name": "Гальмівні колодки МТЗ комплект", "description": "Комплект гальмівних колодок МТЗ-80/82. На одну вісь.", "price": 1800, "category": "chassis", "sku": "KOLODKY-MTZ-OSI", "stock": 20, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"комплект": "4 шт", "тип": "барабанні"}},
        {"id": str(uuid.uuid4()), "name": "Ресора передня ГАЗ-53", "description": "Ресора передня ГАЗ-53, ГАЗ-3307. 12 листів, посилена.", "price": 3200, "category": "chassis", "sku": "RESORA-GAZ53-PER", "stock": 10, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"листів": "12", "вантажність": "2.5 т"}},
        {"id": str(uuid.uuid4()), "name": "Амортизатор ЗІЛ-130 передній", "description": "Амортизатор передньої підвіски ЗІЛ-130. Масляний, посилений.", "price": 1600, "category": "chassis", "sku": "AMORT-ZIL130-PER", "stock": 14, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"тип": "масляний", "хід": "220 мм"}},
        {"id": str(uuid.uuid4()), "name": "Палець ресори МТЗ-80", "description": "Палець ресори переднього моста МТЗ-80. Загартована сталь.", "price": 450, "category": "chassis", "sku": "PALEC-RESORY-MTZ", "stock": 30, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"діаметр": "30 мм", "матеріал": "сталь 45"}},
        {"id": str(uuid.uuid4()), "name": "Гальмівний барабан МТЗ", "description": "Гальмівний барабан заднього моста МТЗ-80/82. Чавун.", "price": 2800, "category": "chassis", "sku": "BARABAN-GALM-MTZ", "stock": 8, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"діаметр": "380 мм", "матеріал": "чавун"}},
        {"id": str(uuid.uuid4()), "name": "Сайлентблок важеля МТЗ", "description": "Сайлентблок переднього моста МТЗ-80. Посилена гума.", "price": 380, "category": "chassis", "sku": "SAILENT-MTZ-PER", "stock": 40, "image_url": "https://images.pexels.com/photos/36650737/pexels-photo-36650737.jpeg?auto=compress&cs=tinysrgb&w=400", "specifications": {"матеріал": "гума/метал"}},
    ]
    
    for p in products:
        p["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_many(products)
    
    # Create admin user with new credentials
    admin_id = str(uuid.uuid4())
    admin_doc = {
        "id": admin_id,
        "email": "bomjik",
        "password": hash_password("nihuyasebe"),
        "name": "Адміністратор",
        "phone": "+380965674376",
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
