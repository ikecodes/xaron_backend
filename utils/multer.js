import multer from 'multer';
import path from 'path';
import AppError from './appError.js';

// Multer config
const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      cb(
        new AppError('this is not an image! please upload an image', 400),
        false
      );
      return;
    }
    cb(null, true);
  },
});

export default upload;

// const multerStorage = multer.memoryStorage();
// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image')) {
//     cb(null, true);
//   } else {
//     cb(
//       new AppError('this is not an image! please upload an image', 400),
//       false
//     );
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// exports.uploadUserPhoto = upload.single('photo');
