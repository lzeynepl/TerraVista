const express = require('express');
const router = express.Router();

const Landmark = require('../models/landmarkModel');
const LandmarkImage = require('../models/imageModel').LandmarkImage;

router.get('/fetch-landmarks', async (req, res) => {  
  console.log("[INFO] GET /fetch-landmarks", req.body);
  try {
    const landmarks = await Landmark.find();
    const landmarksWithImageUrls = await Promise.all(landmarks.map(async (landmark) => {
      landmark.images = await LandmarkImage.find({ _id: { $in: landmark.images } }).select('url');
      return landmark;
    }));
    res.status(200).json({landmarks: landmarksWithImageUrls});
  } catch (error) {
    console.log("[ERROR] GET /fetch-landmarks", error);
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;