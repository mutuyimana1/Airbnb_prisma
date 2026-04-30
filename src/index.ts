import "dotenv/config";
import express, { Request, Response } from 'express';
import usersRouter from './routes/users.routes';
import authRouter from './routes/auth.routes';
import listingsRouter from './routes/listings.routes';
import bookingsRouter from './routes/booking.routes';
import { connectDb } from "./config/prisma";
import { errorHandler } from "./middlewares/errorHandler";
import uploadRouter from "./routes/upload.routes"
import { setupSwagger } from "./config/swagger";
import path from "path";
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
setupSwagger(app);
app.use('/users',usersRouter);
app.use("/users",uploadRouter)
app.use('/listings',listingsRouter);
app.use('/auth',authRouter);
app.use('/bookings',bookingsRouter);
app.get('/', (req: Request, res: Response) => {
    // Send the actual HTML file
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

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