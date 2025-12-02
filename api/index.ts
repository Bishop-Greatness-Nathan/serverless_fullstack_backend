import express, { Request, Response } from 'express';
import 'express-async-errors';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import serverless from 'serverless-http';

dotenv.config();

import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import ExpressMongoSanitize from 'express-mongo-sanitize';

// middlewares
import notFoundError from '../src/middleware/notFound';
import errorHandler from '../src/middleware/errorHandler';
import { authenticateUser } from '../src/middleware/authMiddleware';

// routers
import authRouter from '../src/routes/authRoutes';
import userRouter from '../src/routes/userRoutes';
import productRouter from '../src/routes/productRoutes';
import orderRouter from '../src/routes/orderRoutes';
import expenseRouter from '../src/routes/expenseRoutes';
import storeRouter from '../src/routes/storeRoutes';
import customerRouter from '../src/routes/customerRoutes';
import cashRouter from '../src/routes/cashRoutes';
import bankRouter from '../src/routes/bankRoutes';
import categoryRouter from '../src/routes/categoryRoutes';
import endOfDayRouter from '../src/routes/endOfDayRoutes';

const app = express();

// allow netlify frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(ExpressMongoSanitize());

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', authenticateUser, userRouter);
app.use('/api/v1/product', authenticateUser, productRouter);
app.use('/api/v1/order', authenticateUser, orderRouter);
app.use('/api/v1/expense', authenticateUser, expenseRouter);
app.use('/api/v1/store', authenticateUser, storeRouter);
app.use('/api/v1/customer', authenticateUser, customerRouter);
app.use('/api/v1/cash', authenticateUser, cashRouter);
app.use('/api/v1/bank', authenticateUser, bankRouter);
app.use('/api/v1/category', authenticateUser, categoryRouter);
app.use('/api/v1/endofday', authenticateUser, endOfDayRouter);

// 404 + error handlers

app.use(notFoundError);
app.use(errorHandler);

// connect to MongoDB lazily (serverless required)
let isConnected = false;

async function connectDB() {
  console.log('started...');
  if (isConnected) return;

  await mongoose.connect(process.env.MONGO_URL as string);
  isConnected = true;

  console.log('MongoDB connected (serverless)');
}

// wrap Express with serverless-http

const handler = serverless(app);

// final export for vercel
export default async function (req: any, res: any) {
  try {
    await connectDB();
    return handler(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}
