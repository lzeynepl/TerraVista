const express = require('express');
const router = express.Router();
const Hotel = require('../models/hotelModel');
const HotelImage = require('../models/imageModel').HotelImage;

router.get('/fetch-hotels', async (req, res) => {
  console.log("[INFO] GET /fetch-hotels", req.body);
  try {
    const hotels = await Hotel.find();
    const hotelsWithImageUrls = await Promise.all(hotels.map(async (hotel) => {
      hotel.images = await HotelImage.find({ _id: { $in: hotel.images } }).select('url');
      return hotel;
    }));
    res.status(200).json({hotels: hotelsWithImageUrls});
  } catch (error) {
    console.log("[ERROR] GET /fetch-hotels", error);
    res.status(404).json({ message: error.message });
  }
});

router.get('/fetch-hotel/:hotelId', async (req, res) => {
  console.log("[INFO] GET /fetch-hotel/:hotelId", req.params);
  try {
    const hotel = await Hotel.findById(req.params.hotelId);
    res.status(200).json(hotel);
  } catch (error) {
    console.log("[ERROR] GET /fetch-hotel/:hotelId", error);
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;