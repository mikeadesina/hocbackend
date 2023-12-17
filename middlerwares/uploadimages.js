const multer = require('multer');
const gm = require('gm').subClass({ imageMagick: true });
const path = require('path');
const fs = require('fs');
const util = require('util');

const promisifyToBuffer = util.promisify(gm().toBuffer);

const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.jpeg');
    },
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb({ message: 'Unsupported file format' });
    }
};

const uploadPhoto = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fieldSize: 2000000 },
});

const resizeImage = async (req, res, next, folder) => {
    if (!req.files) return next();

    await Promise.all(
        req.files.map(async (file) => {
            const destinationPath = `public/images/${folder}/${file.filename}`;

            try {
                const buffer = await promisifyToBuffer(gm(file.path).resize(300, 300), 'JPEG');

                fs.writeFileSync(destinationPath, buffer);
                fs.unlinkSync(file.path);
            } catch (err) {
                // Handle the error appropriately
                console.error(err);
            }
        })
    );

    next();
};

const productImgResize = async (req, res, next) => {
    await resizeImage(req, res, next, 'products');
};

const blogImgResize = async (req, res, next) => {
    await resizeImage(req, res, next, 'blogs');
};

const bannerImgResize = async (req, res, next) => {
    await resizeImage(req, res, next, 'banners');
};

module.exports = { uploadPhoto, productImgResize, blogImgResize, bannerImgResize };
