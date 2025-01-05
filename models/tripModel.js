const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    //tripId: { type: Number, required: true, unique: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numTravelers: { type: Number, required: true },
    notes: { type: String },
    budget: { type: Number }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hotels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
    restaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
    landmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Landmark' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TripComment' }],
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TripImage' }],
    state: { type: String, default: "planning" },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
