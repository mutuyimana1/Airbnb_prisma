import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";

//get listings
export const getAllListings=async (req:Request,res:Response)=>{
    const listings=await prisma.listing.findMany();
res.json(listings);
}

//Get Listing by id

export const getListingById=async (req:Request,res:Response)=>{
    const id=parseInt(req.params["id"] as string);
    const listingById=await prisma.listing.findUnique({where:{id}});
if(!listingById){
    return res.status(404).json({error:`Listing with id ${id} not found`})
}
res.json(listingById);
}

//Create Listing
export const createListing=async (req:AuthRequest,res:Response)=>{
    const {title,description,pricePerNight,guests,location}=req.body;
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
    const newListing=await prisma.listing.create({data:{title,description,pricePerNight,guests,hostId, host: {
        connect: { id: hostId } // The code handles the "connect" logic
      },location}});
    res.status(201).json(newListing);
}
//update listing

export const updateListing=async (req:AuthRequest,res:Response)=>{
    const id=parseInt(req.params["id"] as string);
    const listing=await prisma.listing.findUnique({where:{id}});
    if(!listing){
        return res.status(404).json({error:`Listing with id ${id} not found`})
    }
    // Check ownership or admin role
    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
        return res.status(403).json({ error: "You can only edit your own listings" });
    }
    const updatedListing=await prisma.listing.update({where:{id},data:req.body});
    res.json(updatedListing);
}
//delete listing
export const deleteListing=async (req:AuthRequest,res:Response)=>{
    const id=parseInt(req.params["id"] as string);
    const listing=await prisma.listing.findUnique({where:{id}});
    if(!listing){
        return res.status(404).json({error:`Listing with id ${id} not found`})
    }
    // Check ownership or admin role
    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
        return res.status(403).json({ error: "You can only edit your own listings" });
    }
    await prisma.listing.delete({where:{id}});
    res.json({message:'Listing deleted successfully'});
}