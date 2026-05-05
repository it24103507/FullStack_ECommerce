# Quick Setup & Usage Guide - Product Management System

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB Atlas account
- Cloudinary account
- Clerk authentication setup

### Backend Setup

1. **Install Dependencies**
```bash
cd server
npm install
```

2. **Create .env file**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/forever_app
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret
CLERK_SECRET_KEY=your_clerk_secret
PORT=3000
```

3. **Create MongoDB Index** (Run in MongoDB Compass or Atlas UI)
```javascript
db.products.createIndex({ "name": "text", "description": "text" })
```

4. **Start Server**
```bash
npm run dev
```
Server will run on `http://localhost:3000`

### Frontend Setup

1. **Install Dependencies**
```bash
cd client
npm install
```

2. **Create .env.local**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

3. **Start Development**
```bash
npm start
# or
expo start
```

## 📱 Testing the System

### Admin Product Management

#### 1. Add a Product
```
1. Navigate to Admin → Products
2. Click "Add Product"
3. Fill in:
   - Product Name: "Winter Jacket"
   - Description: "Premium quality winter jacket made..."
   - Price: 149.99
   - Compare Price: 199.99
   - Stock: 50
   - Category: Men
   - Select Sizes: S, M, L, XL
   - Upload Images (2-5)
   - Toggle Featured if needed
4. Click "Create Product"
```

#### 2. View Products
```
1. Go to Admin → Products
2. See all products in list
3. Try filtering:
   - By Category: Select Men, Women, Kids, etc.
   - By Status: Active, Inactive
   - By Stock: Low, Out of Stock
4. Try sorting:
   - By Name
   - By Price
   - By Stock
5. Try searching:
   - Type product name or description
```

#### 3. Edit a Product
```
1. Click edit icon on any product
2. Modify any field
3. Add new images if needed
4. Remove existing images by clicking X
5. Click "Update Product"
```

#### 4. Delete a Product
```
1. Click trash icon on any product
2. Confirm deletion
3. Product removed from list
4. Images deleted from Cloudinary
```

#### 5. Toggle Product Status
```
1. Click eye/eye-off icon to toggle active status
2. Inactive products won't show to users
3. You can still see them in admin panel
```

### User Product Viewing

#### 1. View Featured Products
```
1. Open app and go to Home
2. See "Featured Products" section
3. Featured products from admin appear here
4. Click on any product to view details
```

#### 2. Browse Shop
```
1. Go to Shop tab
2. See all active products
3. Use search to find products
4. Use filter icon for advanced filtering
5. Try category filtering by clicking categories
```

## 🔧 API Usage Examples

### Using cURL

**Get Products**
```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create Product**
```bash
curl -X POST "http://localhost:3000/api/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=T-Shirt" \
  -F "description=Cotton T-Shirt" \
  -F "price=29.99" \
  -F "category=Men" \
  -F "stock=100" \
  -F "sizes=S,M,L,XL" \
  -F "images=@/path/to/image.jpg"
```

**Update Product**
```bash
curl -X PUT "http://localhost:3000/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "price=24.99" \
  -F "stock=80"
```

**Delete Product**
```bash
curl -X DELETE "http://localhost:3000/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Toggle Status**
```bash
curl -X PATCH "http://localhost:3000/api/products/PRODUCT_ID/toggle-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Stats**
```bash
curl -X GET "http://localhost:3000/api/products/stats/admin" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 Troubleshooting

### Issue: Images not uploading
**Solution:**
1. Check Cloudinary credentials in .env
2. Verify API keys are correct
3. Check image file size (< 5MB recommended)
4. Test Cloudinary connection separately

### Issue: Products not showing
**Solution:**
1. Ensure `isActive: true` in database
2. Check product exists for current user type
3. Clear app cache: `npm start -- --clear`
4. Verify API URL in .env.local

### Issue: Search not working
**Solution:**
1. Create MongoDB text index:
   ```javascript
   db.products.createIndex({ "name": "text", "description": "text" })
   ```
2. Restart server
3. Test search again

### Issue: Validation errors
**Solution:**
1. Check all required fields are filled
2. Verify field lengths:
   - Name: 2+ characters
   - Description: 10+ characters
   - Price: > 0
3. Select at least one size
4. Upload at least one image

### Issue: Admin not able to create products
**Solution:**
1. Check user role in database (should be "admin")
2. Verify Clerk auth token is valid
3. Test with makeAdmin script:
   ```bash
   node server/scripts/makeAdmin.ts YOUR_USER_ID
   ```

### Issue: Pagination not working
**Solution:**
1. Check page parameter is >= 1
2. Check limit is 1-100
3. Verify products exist in database
4. Test with different page numbers

## 📊 Database Queries

### View all products
```javascript
db.products.find().pretty()
```

### Check product count
```javascript
db.products.countDocuments()
```

### Find products by category
```javascript
db.products.find({ category: "Men" }).pretty()
```

### Find low stock products
```javascript
db.products.find({ stock: { $lt: 10, $gt: 0 } }).pretty()
```

### Find out of stock products
```javascript
db.products.find({ stock: 0 }).pretty()
```

### Find featured products
```javascript
db.products.find({ isFeatured: true }).pretty()
```

### Update multiple products
```javascript
db.products.updateMany(
  { category: "Men" },
  { $set: { isFeatured: false } }
)
```

## 📈 Performance Tips

1. **Optimize Images**
   - Compress before upload
   - Use JPEG for photos, PNG for graphics
   - Max 5 images per product

2. **Database**
   - Ensure text index exists
   - Monitor query performance
   - Use proper pagination

3. **Frontend**
   - Use infinite scroll for large lists
   - Implement lazy loading
   - Cache responses when appropriate

## 🔐 Security Checklist

- [ ] API URL in .env not exposed
- [ ] Cloudinary credentials secure
- [ ] MongoDB credentials encrypted
- [ ] Clerk secret properly configured
- [ ] HTTPS enabled in production
- [ ] CORS configured properly
- [ ] Input validation enabled
- [ ] Rate limiting implemented
- [ ] Admin role verification working
- [ ] Image uploads secure

## 📚 File Reference

### Key Files to Understand

1. **productService.ts** - API client
   - Handles all API calls
   - Token management
   - Error handling

2. **productController.ts** - Business logic
   - CRUD operations
   - Validation application
   - Statistics calculation

3. **validation.ts** - Input validation
   - Field validation rules
   - Error messages

4. **productHelpers.ts** - Utility functions
   - Image management
   - Query building
   - Data parsing

## 🆘 Getting Help

1. Check error messages in console
2. Review API responses
3. Check MongoDB logs
4. Verify Cloudinary dashboard
5. Review implementation guide

## 📝 Notes

- All timestamps are in UTC
- Images stored in Cloudinary "forever-app/products" folder
- Database uses UTC for all date operations
- Token-based authentication is required for admin endpoints
- Passwords and secrets should never be committed

## 🎉 Success Indicators

You'll know the system is working when:
- ✅ Can create products in admin panel
- ✅ Products appear in user shop/home
- ✅ Search and filters work
- ✅ Images display correctly
- ✅ Can edit/delete products
- ✅ Status toggles work
- ✅ No console errors
- ✅ API responses are fast

---

For more details, see `PRODUCT_MANAGEMENT.md` and `IMPLEMENTATION_SUMMARY.md`
