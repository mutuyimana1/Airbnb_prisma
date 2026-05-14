import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { createClient } from "redis";
const redis = createClient({ url: process.env["REDIS_URL"] });
//get listings
export const getAllListings=async (req:Request,res:Response)=>{
    // const cachedListings=await redis.get("listings");
    // if(cachedListings){
    //     return res.json(JSON.parse(cachedListings));
    // }
    const listings=await prisma.listing.findMany({
        include:{
        photos:true
    }
    });
    // await redis.setEx("listings",60,JSON.stringify(listings));
res.json(listings);
}

//Get Listing by id

export const getListingById=async (req:Request,res:Response)=>{
    const id=req.params["id"] as string;
    const listingById=await prisma.listing.findUnique({where:{id},include:{photos:true}});
if(!listingById){
    return res.status(404).json({error:`Listing with id ${id} not found`})
}
res.json(listingById);
}

//Create Listing
export const createListing=async (req:AuthRequest,res:Response)=>{
    try {
    const {title,description,pricePerNight,guests,location,emenities}=req.body;
    if(!title || !description || !pricePerNight){
        return res.status(400).json({error:'Title, description, and price per night are required'})
    }
    if(typeof pricePerNight !== 'number' || pricePerNight <= 0){
        return res.status(400).json({error:'Price per night must be a positive number'})
    }
    if (typeof guests !== 'number' || guests <= 0){
        return res.status(400).json({error:'Guests must be a positive number'})
    }
    const hostId = req.userId;
    if (!hostId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    const newListing=await prisma.listing.create({data:{title,description,pricePerNight,guests,emenities,hostId, host: {
        connect: { id: hostId } // The code handles the "connect" logic
      },location}});
    //   await redis.del("listings");
    res.status(201).json(newListing);
} catch (error) {
    res.status(500).json({message:error, error: "Internal server error" });
    console.error(error,"error while creating listing");
}
}
//update listing

export const updateListing=async (req:AuthRequest,res:Response)=>{
    const id=req.params["id"] as string;
    const listing=await prisma.listing.findUnique({where:{id}});
    if(!listing){
        return res.status(404).json({error:`Listing with id ${id} not found`})
    }
    // Check ownership or admin role
    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
        return res.status(403).json({ error: "You can only edit your own listings" });
    }
    const updatedListing=await prisma.listing.update({where:{id},data:req.body});
    // await redis.del("listings");
    res.json(updatedListing);
}
//delete listing
export const deleteListing=async (req:AuthRequest,res:Response)=>{
    const id=req.params["id"] as string;
    const listing=await prisma.listing.findUnique({where:{id}});
    if(!listing){
        return res.status(404).json({error:`Listing with id ${id} not found`})
    }
    // Check ownership or admin role
    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
        return res.status(403).json({ error: "You can only edit your own listings" });
    }
    await prisma.listing.delete({where:{id}});
    // await redis.del("listings");
    res.json({message:'Listing deleted successfully'});
}