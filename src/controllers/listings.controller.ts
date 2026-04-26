import { Request, Response } from "express";
import { Listing, listings } from "../models/listing.model";
import prisma from "../config/prisma";
import z from "zod";

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
export const createListing=async (req:Request,res:Response)=>{
    const {title,description,pricePerNight,guests,host,location}=req.body;
    const hostId = req.userId;
    if(!title || !description || !pricePerNight){
        return res.status(400).json({error:'Title, description, and price per night are required'})
    }
    if(typeof pricePerNight !== 'number' || pricePerNight <= 0){
        return res.status(400).json({error:'Price per night must be a positive number'})
    }
    if (typeof guests !== 'number' || guests <= 0){
        return res.status(400).json({error:'Guests must be a positive number'})
    }
    const newListing=await prisma.listing.create({data:{title,description,pricePerNight,guests,hostId, host: {
        connect: { id: hostId } // The code handles the "connect" logic
      },location}});
    res.status(201).json(newListing);
}
//update listing

export const updateListing=async (req:Request,res:Response)=>{
    const id=parseInt(req.params["id"] as string);
    const listing=await prisma.listing.findUnique({where:{id}});
    if(!listing){
        return res.status(404).json({error:`Listing with id ${id} not found`})
    }
    const updatedListing=await prisma.listing.update({where:{id},data:req.body});
    res.json(updatedListing);
}
//delete listing
export const deleteListing=async (req:Request,res:Response)=>{
    const id=parseInt(req.params["id"] as string);
    const listing=await prisma.listing.findUnique({where:{id}});
    if(!listing){
        return res.status(404).json({error:`Listing with id ${id} not found`})
    }
    await prisma.listing.delete({where:{id}});
    res.json({message:'Listing deleted successfully'});
}