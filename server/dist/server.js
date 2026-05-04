import "dotenv/config";
import express from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from '@clerk/express';
import { clerkWebhook } from "./controllers/webhooks.js";
import makeAdmin from "./scripts/makeAdmin.js";
import ProductRouter from "./routes/productsRoutes.js";
import AddressRouter from "./routes/addressesRoutes.js";
import CartRouter from "./routes/cartRoutes.js";
import WishlistRouter from "./routes/wishlistRoutes.js";
import OrderRouter from "./routes/ordersRoutes.js";
import AdminRouter from "./routes/adminRoutes.js";
const app = express();
//connect to mongoDB
await connectDB();
app.post('/api/clerk', express.raw({ type: "application/json" }), clerkWebhook);
// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Server is Live!');
});
app.get('/health', (req, res) => {
    res.json({ success: true });
});
// Routes
app.use('/api/products', ProductRouter);
app.use('/api/addresses', AddressRouter);
app.use('/api/cart', CartRouter);
app.use('/api/wishlist', WishlistRouter);
app.use('/api/orders', OrderRouter);
app.use('/api/admin', AdminRouter);
await makeAdmin();
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
