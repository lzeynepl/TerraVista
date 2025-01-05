const mongoose = require('mongoose');

const tripCommentSchema = new mongoose.Schema({
  //tripCommentId: { type: Number, required: true, unique: true },
  content: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const TripComment = mongoose.model('TripComment', tripCommentSchema);

module.exports = TripComment;
