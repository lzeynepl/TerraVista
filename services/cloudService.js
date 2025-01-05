const { google } = require('googleapis');
const dotenv = require('dotenv');
const multer = require('multer');
const stream = require('stream');
const fs = require('fs');

dotenv.config();

const keyPath = process.env["GOOGLE-KEY-PATH"];
const usersFolderId = process.env["DRIVE-USERS-FOLDER-ID"];
const tripsFolderId = process.env["DRIVE-TRIPS-FOLDER-ID"];
const drive = google.drive('v3');
const publicUrl = 'https://lh3.googleusercontent.com/d/';

const TARGET_FOLDERS = {
  USERS: usersFolderId,
  TRIPS: tripsFolderId,
}

const getPublicImageUrl = (fileId) => {
  return `${publicUrl}${fileId}`;
};

const authenticateWithServiceAccount = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,  
    scopes: ['https://www.googleapis.com/auth/drive.file'], 
  });

  return auth;
};

const uploadToDrive = async (fileBuffer, fileName, targetFolder) => {
  try {
    const auth = authenticateWithServiceAccount();
    const authClient = await auth.getClient();

    const fileMetadata = {
      name: fileName, 
      parents: [targetFolder],
    };

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const media = {
      body: bufferStream,
    };

    const response = await drive.files.create({
      auth: authClient,
      resource: fileMetadata,
      media: media,
      fields: 'id, name, mimeType',
    });

    return response.data; 
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error('Error uploading to Google Drive');
  }
};

const deleteByFileId = async (fileId) => {
  try {
    const auth = authenticateWithServiceAccount();
    const authClient = await auth.getClient();

    const response = await drive.files.delete({
      auth: authClient,
      fileId: fileId,
    });

    return true;
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    throw new Error('Error deleting file from Google Drive');
    
  }
  finally {
    return false;
  }
  
}

const getFileMetadata = async (fileId) => {
  try {
    const auth = authenticateWithServiceAccount();
    const authClient = await auth.getClient();

    const response = await drive.files.get({
      auth: authClient,
      fileId: fileId,
      fields: 'id, name, mimeType, webContentLink',
    });

    return response.data; 
  } catch (error) {
    console.error('Error fetching file from Google Drive:', error);
    throw new Error('Error fetching file from Google Drive');
  }
};

const upload = multer({ storage: multer.memoryStorage() }); 

const CloudService = {
  TARGET_FOLDERS,
  deleteByFileId,
  getPublicImageUrl,
  uploadToDrive,
  getFileMetadata,
  uploadMiddleware: upload.single('image'), // Multer middleware to handle single image upload
};

module.exports = CloudService;
