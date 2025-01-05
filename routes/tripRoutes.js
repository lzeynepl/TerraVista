const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const Trip = require('../models/tripModel');
const TripComment = require('../models/tripCommentModel');
const TripImage = require('../models/imageModel').TripImage;
const Hotel = require('../models/hotelModel');
const Landmark = require('../models/landmarkModel');
const Restaurant = require('../models/restaurantModel');

const CloudService = require('../services/cloudService');
const { cloudasset } = require('googleapis/build/src/apis/cloudasset');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const TripObjectType = ["hotel", "restaurant", "landmark"];
const TripState = {
  PLANNING: "planning",
  IN_PROGRESS: "ongoing",
  COMPLETED: "completed"
}

router.post('/create-trip' , async (req, res) => {  
  const { destination, startDate, endDate, travelers: numTravelers, notes, budget, userId } = req.body;
  console.log("[INFO] POST /create-trip", req.body);
  try{
    const newTrip = new Trip({ destination, startDate, endDate, numTravelers, notes, budget, userId });
    if(!userId){
      console.log("[ERROR] POST /create-trip", "User ID is required");
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    if(newTrip){
      await newTrip.save();
      res.status(201).json(newTrip);
      return;
    }
  } catch (error) {
    console.log("[ERROR] POST /create-trip", error);
    res.status(400).json({ message: error.message });
  }
  
});

router.post('/fetch-trips', async (req, res) => {
  console.log("[INFO] GET /fetch-trips", req.body);
  const {userId} = req.body;
  const tripData = [];
  try {
    const trips = await Trip.find({ userId: userId });
    for(let i = 0; i < trips.length; i++){
      trips[i].state = determineTripState(trips[i].startDate, trips[i].endDate);
      tripData.push(trips[i]);
      tripData[i].comments = await TripComment.find({ tripId: trips[i]._id });
      tripData[i].images = await TripImage.find({ _id: { $in: trips[i].images } }).select('url');
    }

    res.status(200).json({trips: tripData});
  } catch (error) {
    console.log("[ERROR] GET /fetch-trips", error);
    res.status(404).json({ message: error.message });
  }
});

router.post('/add-to-trip', async(req, res) => { 
  console.log("[INFO] POST /add-to-trip", req.body);
  try {
    const { objectId, tripId, objectType } = req.body;
    const trip = await Trip.findById(tripId);
    if(!trip){
      console.log("[ERROR] POST /add-to-trip", "Trip not found");
      res.status(404).json({ message: "Trip not found" });
      return;
    }
    if(!TripObjectType.includes(objectType)){
      console.log("[ERROR] POST /add-to-trip", "Invalid object type");
      res.status(400).json({ message: "Invalid object type" });
      return;
    }
    switch(objectType){
      case "hotel":
        const hotel = await Hotel.findById(objectId);
        trip.hotels.push(hotel);
        break;
      case "restaurant":
        const restaurant = await Restaurant.findById(objectId);
        trip.restaurants.push(restaurant);
        break;
      case "landmark":
        const landmark = await Landmark.findById(objectId);
        trip.landmarks.push(landmark);
        break;
      
    }

    await trip.save();
    res.status(200).json({ message: "Trip updated successfully" });
  } catch (error) {
    console.log("[ERROR] POST /add-to-trip", error);
    res.status(404).json({ message: error.message });
  }
});

router.post('/remove-from-trip', async(req, res) => {
  console.log("[INFO] POST /remove-from-trip", req.body);
  try {
    const { objectId, tripId } = req.body;
    const trip = await Trip.findById(tripId);
    if(!trip){
      console.log("[ERROR] POST /remove-from-trip", "Trip not found");
      res.status(404).json({ message: "Trip not found" });
      return;
    }
  
    trip.hotels = trip.hotels.filter(hotel => String(hotel._id) !== objectId);
    trip.restaurants = trip.restaurants.filter(restaurant => String(restaurant._id) !== objectId);
    trip.landmarks = trip.landmarks.filter(landmark => String(landmark._id) !== objectId);
    
    await trip.save();
    res.status(200).json({ message: "Trip removed successfully" });
  } catch (error) {
    console.log("[ERROR] POST /remove-from-trip", error);
    res.status(404).json({ message: error.message });
  }
});

router.post('/trip-detail', async(req, res) => {
  console.log("[INFO] POST /trip-detail", req.body);
  try {
    const { tripId } = req.body;
    const trip = await Trip.findById(tripId);
    trip.hotels = await Hotel.find({ _id: { $in: trip.hotels } });
    trip.restaurants = await Restaurant.find({ _id: { $in: trip.restaurants } });
    trip.landmarks = await Landmark.find({ _id: { $in: trip.landmarks } });
    trip.state = determineTripState(trip.startDate, trip.endDate);

    res.status(200).json({
      trip: trip
    });
  } catch (error) {
    console.log("[ERROR] POST /trip-detail", error);
    res.status(404).json({ message: error.message });
  }
})


router.post('/delete-trip', async(req, res) => {
  console.log("[INFO] POST /delete-trip", req.body);
  try {
    const { tripId, userId } = req.body;
    const trip = await Trip.find({ _id: tripId, userId: userId });
    if(!trip){
      console.log("[ERROR] POST /delete-trip", "Trip not found for user");
      res.status(404).json({ message: "Trip not found for user" });
      return;
    }
    await Trip.findByIdAndDelete(tripId);
    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.log("[ERROR] POST /delete-trip", error);
    res.status(404).json({ message: error.message });
  }

});

router.post('/fetch-comments', async(req, res) => {
  console.log("[INFO] POST /fetch-comments", req.body);
  try {
    const { tripId } = req.body;
    const comments = await TripComment.find({ tripId: tripId });
    res.status(200).json({ comments: comments });
  } catch (error) {
    console.log("[ERROR] POST /fetch-comments", error);
    res.status(404).json({ message: error.message });
  }
});

router.post('/add-comment', async(req, res) => {

  console.log("[INFO] POST /add-comment", req.body);
  try {
    const { content, userId, tripId } = req.body;
    const newComment = new TripComment({ content, userId, tripId });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.log("[ERROR] POST /add-comment", error);
    res.status(400).json({ message: error.message });
  }
});

router.post('/delete-comment', async(req, res) => {
  console.log("[INFO] POST /delete-comment", req.body);
  try {
    const { commentId } = req.body;
    await TripComment.findByIdAndDelete(commentId);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.log("[ERROR] POST /delete-comment", error);
    res.status(404).json({ message: error.message });
  }
});

router.post('/add-trip-photo-and-comment', upload.single('image'), async (req, res) => {
  console.log("[INFO] POST /add-trip-photo-and-comment", req.body);

  try {
    const { tripId, tripImageId, imageComment } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      console.error("[ERROR] POST /add-trip-photo-and-comment", "Trip not found");
      return res.status(404).json({ message: "Trip not found" });
    }

    const file = req.file;
    if (!file && tripImageId) {
      const tripImage = await TripImage.findOne({ _id: tripImageId });
      if(!tripImage){
        console.error("[ERROR] POST /add-trip-photo-and-comment", "Image not found");
        return res.status(404).json({ message: "Image not found" });
      }
      tripImage.comment = imageComment;
      await tripImage.save();
      console.log("[INFO] POST /add-trip-photo-and-comment Trip photo comment successfully updated");
      return res.status(200).json({ message: "Photo comment updated successfully" });
    } 

    const uploadResponse = await CloudService.uploadToDrive(file.buffer, file.originalname, CloudService.TARGET_FOLDERS.TRIPS);
    console.log("upload response: ", uploadResponse);
    if (!uploadResponse || !uploadResponse.id) {
      console.error("[ERROR] POST /add-trip-photo", "Image upload failed");
      return res.status(500).json({ message: "Failed to upload image" });
    }

    const gid = uploadResponse.id;
    const publicURL = CloudService.getPublicImageUrl(gid);

    const tripImage = new TripImage({ gid: gid, url: publicURL, comment: imageComment != '' ? imageComment : null });
    await tripImage.save();
    console.log("[INFO] TripImage created:", tripImage);

    trip.images.push(tripImage._id);

    await trip.save();

    console.log("[INFO] Photo added successfully to trip");
    res.status(200).json({ 
      message: "Photo added successfully", 
      tripImageId: tripImage._id, 
      tripId: trip._id 
    });
  } catch (error) {
    console.error("[ERROR] POST /add-trip-photo", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post('/delete-trip-image', async (req, res) => {
  const { imageUrl } = req.body;
  console.log("[INFO] POST /delete-trip-image", req.body);
  const tripImage = await TripImage.findOne({ url: imageUrl });
  const tripImageId = tripImage._id;

  if (!tripImage) {
    console.error("[ERROR] POST /delete-trip-image", "Trip image not found");
    return res.status(404).json({ message: "Trip image not found" });
  }

  const deleteResponse = await CloudService.deleteByFileId(tripImage.gid);
  if (!deleteResponse) {
    console.error("[ERROR] POST /delete-trip-image", "Failed to delete image from Google Drive");
    return res.status(500).json({ message: "Failed to delete image from Google Drive" });
  }

  const trip = await Trip.findOne({ images: tripImageId });
  if (!trip) {
    console.error("[ERROR] POST /delete-trip-image", "Trip not found");
    return res.status(404).json({ message: "Trip not found" });
  }

  await Trip.updateOne(
    { images: tripImageId },
    { $pull: { images: tripImageId } }
  );
  await tripImage.deleteOne();


  console.log("[INFO] Trip image deleted successfully");
  res.status(200).json({ message: "Trip image deleted successfully" });
});

router.post('/fetch-trip-images', async (req, res) => {
  console.log("[INFO] POST /fetch-trip-images", req.body);

  try {
    const { tripId } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      console.error("[ERROR] POST /fetch trip photos", "Trip not found");
      return res.status(404).json({ message: "Trip not found" });
    }

    const tripImages = await TripImage.find({ _id: { $in: trip.images } });
    console.log("[INFO] Trip images fetched successfully");
    res.status(200).json({ tripImages: tripImages });
  } catch (error) {
    console.error("[ERROR] POST /fetch trip photos", error);
    res.status(500).json({ message: "Internal server error" });
  }
  
});

const determineTripState = (startDate, endDate) => {
  const now = new Date();
  if(now < startDate){
    return TripState.PLANNING;
  } else if(now > startDate && now < endDate){
    return TripState.IN_PROGRESS;
  } else {
    return TripState.COMPLETED;
  }
}




module.exports = router;