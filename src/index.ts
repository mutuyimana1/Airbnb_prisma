import "dotenv/config";
import express from 'express';
import usersRouter from './routes/users.routes';
import authRouter from './routes/auth.routes';
import listingsRouter from './routes/listings.routes';
import bookingsRouter from './routes/booking.routes';
import { connectDb } from "./config/prisma";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use('/users',usersRouter);
app.use('/listings',listingsRouter);
app.use('/auth',authRouter);
app.use('/bookings',bookingsRouter);

app.use(errorHandler)
// Start the server
async function main(){
  await connectDb();
app.listen(PORT,()=>{
  console.log(`Server running on :${PORT}`);
})
}
main().catch((error)=>{
  console.error("Failed to connect to database",error);
  process.exit(1);
});