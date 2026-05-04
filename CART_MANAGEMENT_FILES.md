# Shopping Cart Management - Files List

## Frontend Files (Client)

### Context & State Management
- **`client/context/CartContext.tsx`**
  - Manages global cart state using React Context API
  - Provides cart hooks and functions for add/remove/update operations
  - Syncs with server cart data

### UI Components
- **`client/components/cartItem.tsx`**
  - Individual cart item card component
  - Displays product image, name, size, price
  - Includes quantity controls and delete button

### Screen/Page
- **`client/app/(tabs)/cart.tsx`**
  - Main cart screen showing all items
  - Displays cart total, shipping, and final amount
  - Checkout button and empty state handling

### Services
- **`client/services/storeService.ts`**
  - API calls for cart operations (getCart, addToCart, removeCartItem, updateCartItem, clearCart)
  - Communication layer between frontend and backend

### Types & Constants
- **`client/constants/types.ts`**
  - TypeScript interfaces for CartItem, Product, and related types
- **`client/constants/index.ts`**
  - Color constants and other app-wide configurations

---

## Backend Files (Server)

### Models
- **`server/models/Cart.ts`**
  - MongoDB schema for cart collection
  - Defines cart structure (user, items, totalAmount)
  - Includes automatic total calculation logic

- **`server/models/Products.ts`**
  - Product schema (referenced in cart items)

- **`server/models/User.ts`**
  - User schema (cart is linked to user)

### Controllers
- **`server/controllers/cartController.ts`**
  - Business logic for cart operations:
    - `getCart()` - Fetch user's cart
    - `addToCart()` - Add/increment product to cart
    - `updateCartItem()` - Update item quantity
    - `removeCartItem()` - Delete item from cart
    - `clearCart()` - Empty entire cart

### Routes
- **`server/routes/cartRoutes.ts`**
  - API endpoints for cart operations
  - GET `/` - Get cart
  - POST `/items` - Add to cart
  - PATCH `/items/:itemId` - Update quantity
  - DELETE `/items/:itemId` - Remove item
  - DELETE `/` - Clear cart

### Middleware
- **`server/middleware/auth.ts`**
  - Authentication protection for cart routes
  - Ensures only authorized users access their cart

### Database
- **`server/config/db.ts`**
  - MongoDB connection configuration

### Types
- **`server/types/index.ts`**
  - TypeScript interface for Cart (ICart)

---

## Configuration Files

- **`client/package.json`** - Frontend dependencies
- **`server/package.json`** - Backend dependencies
- **`client/tsconfig.json`** - TypeScript configuration (client)
- **`server/tsconfig.json`** - TypeScript configuration (server)

---

## API Endpoints Summary

| Method | Route | Function | Auth Required |
|--------|-------|----------|----------------|
| GET | `/api/cart` | Fetch user's cart | ✅ Yes |
| POST | `/api/cart/items` | Add product to cart | ✅ Yes |
| PATCH | `/api/cart/items/:itemId` | Update item quantity | ✅ Yes |
| DELETE | `/api/cart/items/:itemId` | Remove cart item | ✅ Yes |
| DELETE | `/api/cart` | Clear entire cart | ✅ Yes |

---

## Data Flow

```
User Action (App) 
    ↓
CartContext Hook (useCart())
    ↓
storeService API Call
    ↓
Express Server Route
    ↓
Authentication Middleware
    ↓
Cart Controller Logic
    ↓
MongoDB Cart Model
    ↓
Response → UI Update
```

---

## Key Features by File

| Feature | Frontend File | Backend File |
|---------|---------------|--------------|
| State Management | CartContext.tsx | - |
| UI Display | cart.tsx, cartItem.tsx | - |
| API Communication | storeService.ts | cartRoutes.ts |
| Business Logic | - | cartController.ts |
| Data Storage | - | Cart.ts (Model) |
| Authentication | - | auth.ts (Middleware) |

---

## File Statistics

- **Total Files**: 14+
- **Frontend Components**: 3
- **Backend Controllers**: 1
- **Backend Routes**: 1
- **Database Models**: 3 (Cart, Product, User)
- **Configuration Files**: 6
