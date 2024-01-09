const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { pipeline } = require("stream/promises");

const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/images"));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + ".jpeg");
    },
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb({
            message: "Unsupported file format",
        });
    }
};

const uploadPhoto = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fieldSize: 2000000 }
});

const resizeAndKeepOriginal = async (file, outputPath) => {
    try {
        const readableStream = sharp(file.path)
            .resize(300, 300)
            .toFormat('jpeg')
            .jpeg({ quantity: 90 });

        await pipeline(readableStream, fs.createWriteStream(outputPath));
        await readableStream.end();
    } catch (error) {
        console.error("Error resizing file:", error);
    }
};

const productImgResize = async (req, res, next) => {
    if (!req.files) return next();

    try {
        await Promise.all(
            req.files.map(async (file) => {
                const outputPath = `public/images/products/${file.filename}`;
                await resizeAndKeepOriginal(file, outputPath);
            })
        );
        next();
    } catch (error) {
        console.error("Error resizing images:", error);
        next(error);
    }
};

const blogImgResize = async (req, res, next) => {
    if (!req.files) return next();

    try {
        await Promise.all(
            req.files.map(async (file) => {
                const outputPath = `public/images/blogs/${file.filename}`;
                await resizeAndKeepOriginal(file, outputPath);
            })
        );
        next();
    } catch (error) {
        console.error("Error resizing images:", error);
        next(error);
    }
};

const bannerImgResize = async (req, res, next) => {
    if (!req.files) return next();

    try {
        await Promise.all(
            req.files.map(async (file) => {
                const outputPath = `public/images/banners/${file.filename}`;
                await resizeAndKeepOriginal(file, outputPath);
            })
        );
        next();
    } catch (error) {
        console.error("Error resizing images:", error);
        next(error);
    }
};

module.exports = { uploadPhoto, productImgResize, blogImgResize, bannerImgResize };
