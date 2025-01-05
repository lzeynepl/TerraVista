const express = require('express');
const router = express.Router();
const cloudService = require('../services/cloudService');
const emailService = require('../services/emailService');
const User = require('../models/userModel');
const Trip = require('../models/tripModel');
const TripComment = require('../models/tripCommentModel');
const {TripImage, UserImage} = require('../models/imageModel');
const jwt = require('jsonwebtoken');


// Authentication via JWT Middleware
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, 'your_jwt_secret_key');
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// REGISTER
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, isAdmin } = req.body;
    console.log("[INFO] POST /register", req.body);
    let userId = 0;
    // CHECK MISSING FIELDS
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // TRY FIND EXISTING USER
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'This email is already in use.' });
        }

        const newUser = new User({
            firstName,
            lastName,
            email,
            password, // NO HASH YET
            isAdmin: isAdmin || false // ADMIN IS NOT DEFAULT
        });

        await newUser.save();
        
        res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
    } catch (error) {
        console.error('Error during registration:', error);

        // Duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This email is already in use.' });
        } else {
            return res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    }
});

// SIGN IN
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    console.log("[INFO] POST /signin", req.body);
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // JWT Token oluşturma
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            'your_jwt_secret_key', 
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

// FETCH ALL USERS
router.get('/users', async (req, res) => {
    console.log("[INFO] GET /users");
    try {
        const users = await User.find({}, 'firstName lastName email');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// DELETE USER
router.delete('/users/:id', async (req, res) => {
    console.log("[INFO] DELETE /users/:id", req.params);
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

router.post('/user-profile', async (req, res) => {
    const { userId } = req.body;
    console.log("[INFO] POST /user-profile", req.body);
    try {
        const user = await User.findById(userId, 'firstName lastName email intro birthDate profileImageId');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const trips = await Trip.find({ userId: userId });
        const comments = await TripComment.find({ userId: userId });
        let numPhotos = 0;
        for(trip of trips){
          numPhotos += trip.images.length; 
        } 
        const profileImageUrl = user.profileImageId ? await UserImage.findById(user.profileImageId).select('url') : null;
        
        res.json({ 
            user: user, 
            numTrips: trips.length, 
            numComments: comments.length, 
            numPhotos: numPhotos,
            profileImageUrl: profileImageUrl ? profileImageUrl.url : null
            });
        
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

router.post('/update-profile', cloudService.uploadMiddleware, async (req, res) => {
    const { userId, name, surname, birthDate, intro } = req.body;
    console.log("[INFO] POST /update-profile", req.body);

    let newUserImageId = null;
  
    if (req.file) {
      try {
        const uploadResponse = await cloudService.uploadToDrive(req.file.buffer, req.file.originalname, cloudService.TARGET_FOLDERS.USERS);
        const fileId = uploadResponse.id;
  
        const publicUrl = cloudService.getPublicImageUrl(fileId);
  
        const newUserImage = await UserImage.create({
          gid: fileId,
          url: publicUrl,
        });
  
        newUserImageId = newUserImage._id;
      } catch (error) {
        console.error('Error uploading image to Google Drive:', error);
        return res.status(500).json({ message: 'Failed to upload image to Google Drive' });
      }
    }
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.name = name;
      user.surname = surname;
      user.intro = intro;
  
      if (birthDate) {
        const parsedDate = new Date(birthDate);
        if (!isNaN(parsedDate)) {
          user.birthDate = parsedDate;
        } else {
          return res.status(400).json({ message: 'Invalid birth date format' });
        }
      }
  
      if (newUserImageId) {
        if (user.profileImageId) {
          await UserImage.findByIdAndDelete(user.profileImageId);
        }
        user.profileImageId = newUserImageId;
      }
  
      await user.save();
      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
});
  
router.post('/delete-profile-image', async (req, res) => {
    const { userId } = req.body;
    console.log("[INFO] POST /delete-profile-image", req.body);
  
    try {
      const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
      
      const userImage = await UserImage.findById(user.profileImageId);
      if (!userImage) {
        return res.status(404).json({ message: 'Profile image not found' });
      }

      await cloudService.deleteByFileId(userImage.gid);

      user.profileImageId = null;
      await UserImage.findByIdAndDelete(user.profileImageId);
      await user.save();

      res.status(200).json({ message: 'Profile image deleted successfully' });
    }
    catch(error){
        console.error('[ERROR] POST /delete-profile-image Error deleting user profile image:', error);
        res.status(500).json({ message: 'Failed to delete profile image' });
    }
});

router.post('/start-forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log("[INFO] POST /start-forgot-password", req.body);

  try {
    const user = (await User.find({ email:email }))[0];
    if(!user){
      return res.status(404).json({ message: 'User not found' });
    }
    const token = await emailService.sendResetPasswordEmail(email, user._id);
    console.log(`[INFO] POST /start-forgot-password | Token: ${token}`);
    const tokenExpireDate = new Date(Date.now() + 900000);
    if(!token){
      return res.status(500).json({ success: false });
    }
    user.resetPasswordToken = token;
    user.resetPasswordExpires = tokenExpireDate;
    await user.save();
    res.status(200).json({ success: true });

  }
  catch (error) {
    console.error(`[ERROR] POST /start-forgot-password | Error starting forgot password: ${error.message}`);
    res.status(500).json({ success: false });
  }
});

router.post('/validate-reset-password-request', async (req, res) => {

  const { userId, token } = req.body;
  console.log("[INFO] POST /validate-reset-password-request", req.body);
  if(!userId || !token){
    return res.status(400).json({ success: false });
  }
  try {
    const user = await User.findById(userId);
    if(!user){
      return res.status(404).json({ success: false });
    }
    if(user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()){
      return res.status(400).json({ success: false });
    }

    return res.status(200).json({ success: true});
  }
  catch (error) {
    console.error(`[ERROR] POST /validate-reset-password-request | Error validating reset password request: ${error.message}`);
    res.status(500).json({ success: false });
  }
});

router.post('/change-password', async (req, res) => {
  const { userId, newPassword } = req.body;
  console.log("[INFO] POST /change-password", req.body);

  try {
    const user = await  User.findById(userId);
    if(!user){
      return res.status(404).json({ success: false });
    }
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ success: true });
  }
  catch (error) {
    console.error(`[ERROR] POST /change-password | Error changing password: ${error.message}`);
    res.status(500).json({ success: false });
  }

});
    

module.exports = router;
