import type { Request, Response } from "express";
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary.js";
import prisma from "../config/prisma.js";
import { updateListing } from "./listings.controller.js";

// POST /users/:id/avatar
// Uploads a profile picture for a user
// Multer middleware runs first and puts the file on req.file
// Then we upload the buffer to Cloudinary and save the URL to the database

export async function uploadAvatar(req: Request, res: Response) {
  const id = req.params["id"] as string;

  // ensure user edit their own profile
  if(req.userId!==id){
    console.log(req.userId,"compare",id)
    return res.status(403).json({error:'Forbidden:You can only change your own profile'})
  }
  // req.file is set by Multer — if it's missing, no file was sent
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  // delete old avatar

  if(user.avatarPublicId){
    await deleteFromCloudinary(user.avatarPublicId)
  }

  // Upload the buffer to Cloudinary under the "airbnb/avatars" folder
  const { url, publicId } = await uploadToCloudinary(
    req.file.buffer,
    "airbnb/avatars"
  );

  // Save the Cloudinary URL to the user's record in the database
  const updated = await prisma.user.update({
    where: { id },
    data: { avatar: url ,avatarPublicId:publicId},
    select:{
        id:true,
        email: true,
      name: true,
      avatar: true,
      avatarPublicId: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.json({ message: "Avatar uploaded successfully", avatar: updated });
}

export const deleteAvatar=async(req:Request,res:Response)=>{
const id=req.params["id"] as string
if(req.userId!==id){
    return res.status(403).json({error:"Forbidden"})
}
const user=await prisma.user.findUnique({where:{id}})
if(!user){
    return res.status(404).json("user not found")
}
if(!user.avatar || !user.avatarPublicId){
    return res.status(404).json('Avatar not found')
}
await deleteFromCloudinary(user.avatarPublicId);

const updatedUser=await prisma.user.update({
    where:{id},
    data:{
        avatar:null,
        avatarPublicId:null
    },
    select:{
id:true,
email:true,
name:true,
avatar:true,
avatarPublicId:true,
createdAt:true,
updatedAt:true
    }
})

res.json({message:'Avatar deleted successsfully',updatedUser})
}

export const uploadListingPhotos=async(req:Request,res:Response)=>{
    try{
    const id=req.params["id"] as string
    const listing=await prisma.listing.findUnique({where:{id}})
    if(!listing){
        return res.status(404).json("Listing not found")
    }
    if(listing.hostId!==req.userId){
        return res.status(403).json('User should be hoster')
    }
    const countPhoto=await prisma.listingPhoto.count({where:{listingId:id}})
    if(countPhoto>=5){
        return res.status(400).json({message:'Maximum of photos allowed per listing'})
    }
  
    const files=req.files as Express.Multer.File[];
      if(!files || files.length===0){
return res.status(400).json({message:'no file uploaded'})
    };
//calculate slots and limit files
    const remainingSlots=5-countPhoto;
    const filesToUpload=files.slice(0,remainingSlots);
//process uploads concurrently
const uploadPromises=filesToUpload.map(async(file)=>{
    const {url,publicId}=await uploadToCloudinary(file.buffer,"airbnb/listings");
    return prisma.listingPhoto.create({
data:{
    url,
    publicId,
    listingId:id
}
    });
});
await Promise.all(uploadPromises);

// return uploaded listing with photos

const uploadedListing=await prisma.listing.findUnique({
    where:{id},
    include:{
        photos:true
    }
});
res.json({message: `Successfully uploaded ${filesToUpload.length} photos`,listing:uploadedListing})
    }catch(error){
        console.log(error)
    }

}
