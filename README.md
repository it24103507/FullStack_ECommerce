# Forever_App
A mobile application for a ecommerce website.

FULL STACK E-COMMERCE MOBILE APP
================================================================================
Group        : WD-IT-52
Project      : Full Stack E-Commerce Mobile Application
GitHub Repo  : https://github.com/it24103507/FullStack_ECommerce.git
Date         : May 2026

TECHNOLOGY STACK
--------------------------------------------------------------------------------
Frontend  : React Native, Expo, React Navigation
Backend   : Node.js, Express.js, REST API
Database  : MongoDB (NoSQL), Mongoose ODM
Auth      : Clerk Authentication (OAuth + Email)
Payments  : Stripe, Razorpay, Cash on Delivery
Storage   : Cloudinary (Product Images)
Deployment: Render / Railway (Backend), Expo / Vercel (Frontend)

PROJECT STRUCTURE
--------------------------------------------------------------------------------
/frontend          -> React Native + Expo mobile app
  /app
    /(tabs)        -> Bottom tab screens (Home, Shop, Cart, Profile)
    /product       -> Product detail screen
    /auth          -> Clerk authentication screens
  /components      -> Reusable UI components
  /context         -> Global state management
  /assets          -> Images, fonts, icons

/backend           -> Node.js + Express API server
  /config          -> Database connection, Cloudinary config
  /controllers     -> Route handlers (auth, product, cart, order, etc.)
  /models          -> Mongoose schemas (User, Product, Cart, Order, etc.)
  /routes          -> API route definitions
  /middleware      -> Auth middleware, error handlers, validators
  /utils           -> Helper functions, email service

/admin             -> Admin Dashboard (React.js web app)
  /pages           -> Products, Orders, Customers
  /components      -> Sidebar, Navbar, Data Tables

TEAM MEMBERS & RESPONSIBILITIES
--------------------------------------------------------------------------------
1. De Silva A K K G    (IT24103646) - Order Processing & Management
2. Avekshika A H E     (IT24200343) - Favourites / Wishlist Management
3. Laksiru J A E       (IT24101934) - Shopping Cart Management
4. Kunange K D D       (IT24103507) - Product Management (Admin Panel)
5. Shahly M S M        (IT24100322) - Shipping Address Management

