const mongoose = require('mongoose');

const landmarkSchema = new mongoose.Schema({
    gPlaceId: { type: String, required: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LandmarkImage' }],
    address: { type: String},
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const Landmark = mongoose.model('Landmark', landmarkSchema);

module.exports = Landmark;
