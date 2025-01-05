const express = require('express');
const router = express.Router();

const Restaurant = require('../models/restaurantModel');
const RestaurantImage = require('../models/imageModel').RestaurantImage;

router.get('/fetch-restaurants', async (req, res) => {
  console.log("[INFO] GET /fetch-restaurants", req.body);
  try {
    const restaurants = await Restaurant.find();
    const restaurantsWithImageUrls = await Promise.all(restaurants.map(async (restaurant) => {
      restaurant.images = await RestaurantImage.find({ _id: { $in: restaurant.images } }).select('url');
      return restaurant;
    }));
    res.status(200).json({restaurants: restaurantsWithImageUrls});
  } catch (error) {
    console.log("[ERROR] GET /fetch-restaurants", error);
    res.status(404).json({ message: error.message });
  }
});

router.get('/fetch-restaurant/:restaurantId', async (req, res) => {
  console.log("[INFO] GET /fetch-restaurant/:restaurantId", req.params);
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    res.status(200).json(restaurant);
  } catch (error) {
    console.log("[ERROR] GET /fetch-restaurant/:restaurantId", error);
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;