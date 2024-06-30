const multer = require('multer');

const storage = multer.diskStorage({
  // Define storage for the uploaded files
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100 // Limit the file size to 100MB
  },
  fileFilter: function (req, file, cb) {
    cb(null, true); // Allow any type of file
  }
});

// Call upload as a function
const uploadMiddleware = upload.array('files', 10);

module.exports = {
  upload: uploadMiddleware,
  multer
};
