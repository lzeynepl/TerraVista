const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    profileImageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserImage' },
    intro: { type: String },
    birthDate: { type: Date },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false } 
});

const User = mongoose.model('User', userSchema);

module.exports = User;
