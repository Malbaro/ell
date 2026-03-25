#!/usr/bin/env python3
"""
ELL Parts Store Backend API Testing Suite
Tests all backend endpoints for the e-commerce platform
"""

import requests
import sys
import json
from datetime import datetime

class ELLPartsAPITester:
    def __init__(self, base_url="https://ell-parts-store.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.admin_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_root_endpoint(self):
        """Test root API endpoint"""
        result = self.run_test("Root API Endpoint", "GET", "", 200)
        return result is not None

    def test_seed_database(self):
        """Test database seeding"""
        result = self.run_test("Seed Database", "POST", "seed", 200)
        return result is not None

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "testpass123",
            "name": "Test User",
            "phone": "+380501234567"
        }
        
        result = self.run_test("User Registration", "POST", "auth/register", 200, user_data)
        if result and 'access_token' in result:
            self.token = result['access_token']
            self.user_id = result['user']['id']
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        admin_data = {
            "email": "admin@ell-parts.ua",
            "password": "admin123"
        }
        
        result = self.run_test("Admin Login", "POST", "auth/login", 200, admin_data)
        if result and 'access_token' in result:
            self.admin_token = result['access_token']
            self.admin_id = result['user']['id']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        result = self.run_test("Get Current User", "GET", "auth/me", 200)
        return result is not None

    def test_get_categories(self):
        """Test get categories"""
        result = self.run_test("Get Categories", "GET", "categories", 200)
        if result and isinstance(result, list) and len(result) == 5:
            return True
        return False

    def test_get_products(self):
        """Test get products"""
        result = self.run_test("Get Products", "GET", "products", 200)
        if result and isinstance(result, list) and len(result) > 0:
            self.product_id = result[0]['id']  # Store for later tests
            return True
        return False

    def test_get_product_detail(self):
        """Test get single product"""
        if hasattr(self, 'product_id'):
            result = self.run_test("Get Product Detail", "GET", f"products/{self.product_id}", 200)
            return result is not None
        return False

    def test_product_search(self):
        """Test product search"""
        result = self.run_test("Product Search", "GET", "products?search=поршень", 200)
        return result is not None

    def test_product_filter_by_category(self):
        """Test product filtering by category"""
        result = self.run_test("Filter by Category", "GET", "products?category=engines", 200)
        return result is not None

    def test_product_filter_by_price(self):
        """Test product filtering by price"""
        result = self.run_test("Filter by Price", "GET", "products?min_price=1000&max_price=5000", 200)
        return result is not None

    def test_add_to_cart(self):
        """Test add product to cart"""
        if hasattr(self, 'product_id'):
            cart_data = {
                "product_id": self.product_id,
                "quantity": 2
            }
            result = self.run_test("Add to Cart", "POST", "cart/add", 200, cart_data)
            return result is not None
        return False

    def test_get_cart(self):
        """Test get cart"""
        result = self.run_test("Get Cart", "GET", "cart", 200)
        if result and 'items' in result and len(result['items']) > 0:
            return True
        return False

    def test_update_cart(self):
        """Test update cart item"""
        if hasattr(self, 'product_id'):
            cart_data = {
                "product_id": self.product_id,
                "quantity": 3
            }
            result = self.run_test("Update Cart", "PUT", "cart/update", 200, cart_data)
            return result is not None
        return False

    def test_add_to_favorites(self):
        """Test add to favorites"""
        if hasattr(self, 'product_id'):
            result = self.run_test("Add to Favorites", "POST", f"favorites/{self.product_id}", 200)
            return result is not None
        return False

    def test_get_favorites(self):
        """Test get favorites"""
        result = self.run_test("Get Favorites", "GET", "favorites", 200)
        return result is not None

    def test_check_favorite(self):
        """Test check if product is favorite"""
        if hasattr(self, 'product_id'):
            result = self.run_test("Check Favorite", "GET", f"favorites/check/{self.product_id}", 200)
            return result is not None
        return False

    def test_create_order(self):
        """Test create order"""
        order_data = {
            "shipping_address": "Киев, ул. Тестовая, 123",
            "phone": "+380501234567",
            "comment": "Тестовый заказ"
        }
        result = self.run_test("Create Order", "POST", "orders", 200, order_data)
        if result and 'id' in result:
            self.order_id = result['id']
            return True
        return False

    def test_get_orders(self):
        """Test get user orders"""
        result = self.run_test("Get Orders", "GET", "orders", 200)
        return result is not None

    def test_get_order_detail(self):
        """Test get single order"""
        if hasattr(self, 'order_id'):
            result = self.run_test("Get Order Detail", "GET", f"orders/{self.order_id}", 200)
            return result is not None
        return False

    def test_admin_stats(self):
        """Test admin statistics"""
        result = self.run_test("Admin Stats", "GET", "admin/stats", 200, use_admin=True)
        if result and 'total_products' in result:
            return True
        return False

    def test_admin_create_product(self):
        """Test admin create product"""
        product_data = {
            "name": "Тестовый товар",
            "description": "Описание тестового товара",
            "price": 1500,
            "category": "engines",
            "sku": "TEST-001",
            "stock": 10,
            "image_url": "https://example.com/image.jpg"
        }
        result = self.run_test("Admin Create Product", "POST", "admin/products", 200, product_data, use_admin=True)
        if result and 'id' in result:
            self.test_product_id = result['id']
            return True
        return False

    def test_admin_update_product(self):
        """Test admin update product"""
        if hasattr(self, 'test_product_id'):
            update_data = {
                "name": "Обновленный тестовый товар",
                "price": 1600
            }
            result = self.run_test("Admin Update Product", "PUT", f"admin/products/{self.test_product_id}", 200, update_data, use_admin=True)
            return result is not None
        return False

    def test_admin_get_orders(self):
        """Test admin get all orders"""
        result = self.run_test("Admin Get Orders", "GET", "admin/orders", 200, use_admin=True)
        return result is not None

    def test_admin_update_order_status(self):
        """Test admin update order status"""
        if hasattr(self, 'order_id'):
            result = self.run_test("Admin Update Order Status", "PUT", f"admin/orders/{self.order_id}/status?status=processing", 200, use_admin=True)
            return result is not None
        return False

    def test_admin_delete_product(self):
        """Test admin delete product"""
        if hasattr(self, 'test_product_id'):
            result = self.run_test("Admin Delete Product", "DELETE", f"admin/products/{self.test_product_id}", 200, use_admin=True)
            return result is not None
        return False

    def test_remove_from_favorites(self):
        """Test remove from favorites"""
        if hasattr(self, 'product_id'):
            result = self.run_test("Remove from Favorites", "DELETE", f"favorites/{self.product_id}", 200)
            return result is not None
        return False

    def test_remove_from_cart(self):
        """Test remove from cart"""
        if hasattr(self, 'product_id'):
            result = self.run_test("Remove from Cart", "DELETE", f"cart/remove/{self.product_id}", 200)
            return result is not None
        return False

    def test_clear_cart(self):
        """Test clear cart"""
        result = self.run_test("Clear Cart", "DELETE", "cart/clear", 200)
        return result is not None

    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting ELL Parts Store API Tests")
        print(f"📡 Base URL: {self.base_url}")
        print("=" * 60)

        # Basic tests
        self.test_root_endpoint()
        self.test_seed_database()
        self.test_get_categories()
        
        # User registration and auth
        if self.test_user_registration():
            self.test_get_me()
        
        # Admin login
        self.test_admin_login()
        
        # Product tests
        if self.test_get_products():
            self.test_get_product_detail()
            self.test_product_search()
            self.test_product_filter_by_category()
            self.test_product_filter_by_price()
        
        # Cart tests (requires user auth)
        if self.token:
            if self.test_add_to_cart():
                self.test_get_cart()
                self.test_update_cart()
            
            # Favorites tests
            if self.test_add_to_favorites():
                self.test_get_favorites()
                self.test_check_favorite()
            
            # Order tests
            if self.test_create_order():
                self.test_get_orders()
                self.test_get_order_detail()
        
        # Admin tests (requires admin auth)
        if self.admin_token:
            self.test_admin_stats()
            if self.test_admin_create_product():
                self.test_admin_update_product()
                self.test_admin_delete_product()
            self.test_admin_get_orders()
            if hasattr(self, 'order_id'):
                self.test_admin_update_order_status()
        
        # Cleanup tests
        if self.token:
            self.test_remove_from_favorites()
            self.test_remove_from_cart()
            self.test_clear_cart()

        # Print results
        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = ELLPartsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())