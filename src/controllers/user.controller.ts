import { NextFunction, Request, Response } from "express";
import { User, users } from "../models/user.model";
import prisma from "../config/prisma";
import z from "zod";

//get users
export const getAllUsers=async (req:Request,res:Response)=>{
    const page=parseInt(req.query["page"] as string) ||1;
    const limit=parseInt(req.query["limit"] as string) ||20;
    const skip=(page-1)*limit;
    const [users,total] =await Promise.all([
prisma.user.findMany({skip,take:limit}),
prisma.user.count(),
    ]);
  // meta tells the client how many page exist so that to take control.
res.json({data:users,meta:{total,page,limit,totalPages:Math.ceil(total/limit)}});
}
// get all users by using cursor which is good for large dataset

// export async function getAllUsersx(req: Request, res: Response) {
//   const cursor = req.query["cursor"]  as string| undefined;
//   const limit = parseInt(req.query["limit"] as string) || 20;

//   const users = await prisma.user.findMany({
//     take: limit,
//     skip: cursor ? 1 : 0,
//     cursor: cursor ? { id: cursor } : undefined,
//     orderBy:[
//         {createdAt:"desc"},
//         { id: "asc" }],
//   });

//   const nextCursor = users.length === limit ? users[users.length - 1]?.id : null;

//   res.json({ data: users, nextCursor });
// }

//Get User by id

export const getUserById=async(req:Request,res:Response)=>{
    const id=req.params["id"] as string;
    const userById=await prisma.user.findUnique({where:{id},
    include:{
        listings:true,
        bookings:{
            include:{listing:true}
        }
    }
    });
if(!userById){
    return res.status(404).json({error:`User with id ${id} not found`})
}
const { password: _, ...userWithoutPassword } = userById;
  res.json({message:"User retrieved successfully",userWithoutPassword, status:200});
}

//Create User
const createUserSchema=z.object({
    name:z.string().min(2,"Name must be at least 2 characters long"),
    email:z.string().email("Invalid email address"),
})
export const createUser=async(req:Request,res:Response,next:NextFunction)=>{
    const {name,email,username,password,phone,role,bio,avatar}=req.body;;
    if(!name ||!email){
        return res.status(400).json({error:'Name and email are required'})
    }
    try{
        const data=createUserSchema.parse(req.body);
         const newUser=await prisma.user.create({data:{name,email,username,password,phone,role,bio,avatar}});
    res.status(201).json(newUser);
    }catch(error){
        next(error);
    }
}
//update user

export const updateUser=async(req:Request,res:Response)=>{
    const id=req.params["id"] as string;
    const user=await prisma.user.findUnique({where:{id}});
    if(!user){
        return res.status(404).json({error:`User with id ${id} not found`})
    }
        const updatedUser=await prisma.user.update({where:{id},data:req.body});
    res.json(updatedUser);
}
//delete user
export const deleteUser=async(req:Request,res:Response)=>{
    const id=req.params["id"] as string;
    const user=await prisma.user.findUnique({where:{id}});
    if(!user){
        return res.status(404).json({error:`User with id ${id} not found`})
    }
    await prisma.user.delete({where:{id}});
    res.json({message:'User deleted successfully'});
}