const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  //imageId: { type: Number, required: true, unique: true },
  gid: { type: String },
  url: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const tripImageSchema = new mongoose.Schema({
  gid: { type: String },
  comment: { type: String },
  url: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const HotelImage = mongoose.model('HotelImage', imageSchema);
const RestaurantImage = mongoose.model('RestaurantImage', imageSchema);
const LandmarkImage = mongoose.model('LandmarkImage', imageSchema);
const UserImage = mongoose.model('UserImage', imageSchema);
const TripImage = mongoose.model('TripImage', tripImageSchema);

module.exports = { HotelImage, RestaurantImage, TripImage, LandmarkImage, UserImage };
