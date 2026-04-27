import { NextFunction, Request, Response } from "express";
import { User, users } from "../models/user.model";
import prisma from "../config/prisma";
import z from "zod";

//get users
export const getAllUsers=async (req:Request,res:Response)=>{
    const users=await prisma.user.findMany();
res.json(users);
}

//Get User by id

export const getUserById=async(req:Request,res:Response)=>{
    const id=parseInt(req.params["id"] as string);
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
    const id=parseInt(req.params["id"] as string);
    const user=await prisma.user.findUnique({where:{id}});
    if(!user){
        return res.status(404).json({error:`User with id ${id} not found`})
    }
        const updatedUser=await prisma.user.update({where:{id},data:req.body});
    res.json(updatedUser);
}
//delete user
export const deleteUser=async(req:Request,res:Response)=>{
    const id=parseInt(req.params["id"] as string);
    const user=await prisma.user.findUnique({where:{id}});
    if(!user){
        return res.status(404).json({error:`User with id ${id} not found`})
    }
    await prisma.user.delete({where:{id}});
    res.json({message:'User deleted successfully'});
}