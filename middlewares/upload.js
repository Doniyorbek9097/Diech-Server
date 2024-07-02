const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const mkdirp = require("mkdirp");
const fs = require("fs");
const path = require("path");

const { baseDir } = require("../config/uploadFolder");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(baseDir)) {
      mkdirp.sync(baseDir);
    }
    cb(null, baseDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

const resizeImages = async (req, res, next) => {
  if (!req.files) return next();

  try {
    await Promise.all(
      req.files.map(async (file) => {
        const outputFilePath = path.join(file.destination, `resized-${file.filename}`);
        const oldFilePath = file.path;

        try {
          await sharp(oldFilePath)
            .resize(800, 800, {
              fit: sharp.fit.inside,
              withoutEnlargement: true
            })
            .toFile(outputFilePath);

          // Delete the original file after resizing
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted original file: ${oldFilePath}`);

          // Update the file path to the resized image
          file.path = outputFilePath;
          file.filename = `resized-${file.filename}`;
        } catch (err) {
          console.error(`Failed to resize or delete original file: ${oldFilePath}`, err);
        }
      })
    );
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process images' });
  }
};

module.exports = {
  upload,
  resizeImages
};
