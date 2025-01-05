const express = require('express');
const router = express.Router();

const { HotelImage, RestaurantImage, TripImage } = require('../models/imageModel');
const cloudService = require('../services/cloudService');

router.post('/upload-image', cloudService.uploadMiddleware, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const fileBuffer = req.file.buffer; 
    const fileName = req.file.originalname; 

    const uploadResponse = await cloudService.uploadToDrive(fileBuffer, fileName);

    res.status(200).json({
      message: 'File uploaded successfully',
      fileId: uploadResponse.id,
      fileName: uploadResponse.name,
      mimeType: uploadResponse.mimeType,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/get-image/:fileId', async (req, res) => {
  const { fileId } = req.params;

  try {
    const metadata = await cloudService.getFileMetadata(fileId);
    res.status(200).json(metadata);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;