require('dotenv').config(); // Load environment variables from .env

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const RestaurantModel = require('./models/restaurantModel');
const HotelModel = require('./models/hotelModel');
const LandmarkModel = require('./models/landmarkModel');
const {RestaurantImage, HotelImage, LandmarkImage} = require('./models/imageModel');

const rawURI = process.env['MONGO-URI'];
const dbPassword = process.env['DB-PASSWORD'];
const mongoURI = rawURI.replace('$$pw=', dbPassword);

const googleApiKey = process.env['GOOGLE-API-KEY'];

const getCities = () => {
    const citiesFilePath = path.join(__dirname, 'data', 'cities.txt');
    const citiesData = fs.readFileSync(citiesFilePath, 'utf-8');
    return citiesData.split('\n').filter(city => city.trim()).map(city => city.trim());
};

const readPlacesFile = (city, category) => {
    const filePath = path.join(__dirname, 'data', `${city}_${category}.txt`);
    const placesData = fs.readFileSync(filePath, 'utf-8');
    return placesData.split('\n').map(line => {
      const [name, placeId] = line.trim().split('#');
      return { name: name.trim(), placeId: placeId.trim() };
    });
};

const fetchPlaceImages = async (placeId) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photo&key=${googleApiKey}`;
    const response = await axios.get(url);
    const photos = response.data.result.photos || [];
    return photos.map(photo => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${googleApiKey}`);
};


const saveImages = async (urls, imageModel) => {
    const images = urls.map(url => new imageModel({ url }));
    await imageModel.insertMany(images);
    return images.map(image => image._id);
};

const updateCategory = async (city, category, model, imageModel) => {
    console.log(`Updating ${category} in ${city}...`); 
    const places = readPlacesFile(city, category);
    console.log(`Found ${places.length} many ${category} in ${city}`);
    for (const { name, placeId } of places) {
        const imageUrls = await fetchPlaceImages(placeId);
        const imageIds = await saveImages(imageUrls, imageModel);
        await model.updateOne(
            { gPlaceId: placeId },
            { gPlaceId: placeId, name: name, city: city, images: imageIds },
            { upsert: true }
        );
    }
};

const updateRestaurants = async () => {
    const cities = getCities();
    for (const city of cities) {
        await updateCategory(city, 'restaurant', RestaurantModel, RestaurantImage);
    }
};

const updateHotels = async () => {
    const cities = getCities();
    for (const city of cities) {
        await updateCategory(city, 'hotel', HotelModel, HotelImage);
    }
};

const updateLandmarks = async () => {
    const cities = getCities();
    for (const city of cities) {
        await updateCategory(city, 'landmark', LandmarkModel, LandmarkImage);
    }
};

(async () => {
  try {
      await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('MongoDB connected');

      await updateRestaurants();
      await updateHotels();
      await updateLandmarks();

      console.log('Successfully updated data');

  } catch (error) {
      console.error('Error connecting to MongoDB:', error);
  } finally {
      mongoose.disconnect();
  }
})();

module.exports = { updateRestaurants, updateHotels, updateLandmarks };
