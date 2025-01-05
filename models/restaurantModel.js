const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  gPlaceId: { type: String, required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  description: { type: String },
  address: { type: String},
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantImage' }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
