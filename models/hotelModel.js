const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  gPlaceId: { type: String, required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  description: {type: String},
  address: { type: String },
  pricePerDay: { type: Number},
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'HotelImage' }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
