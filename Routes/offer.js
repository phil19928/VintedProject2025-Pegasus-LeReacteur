const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");

const fileUpload = require("express-fileupload");
const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      if (!title || !price || !req.files?.picture) {
        return res
          .status(400)
          .json({ message: "Title, price and picture are required" });
      }

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: req.user._id,
        product_pictures: [],
      });

      const imagetoBase64 = convertToBase64(req.files.picture);

      const uploadedImage = await cloudinary.uploader.upload(imagetoBase64, {
        folder: `vinted/offers/${newOffer._id}`,
        public_id: "main",
      });

      newOffer.product_image = uploadedImage;

      const galleryFiles = req.files?.pictures;
      const filesToUpload = Array.isArray(galleryFiles)
        ? galleryFiles
        : galleryFiles
        ? [galleryFiles]
        : [];

      for (let index = 0; index < filesToUpload.length; index++) {
        const file = filesToUpload[index];
        const uploadedGalleryImage = await cloudinary.uploader.upload(
          convertToBase64(file),
          {
            folder: `vinted/offers/${newOffer._id}`,
            public_id: `gallery_${Date.now()}_${index}`,
          }
        );
        newOffer.product_pictures.push(uploadedGalleryImage);
      }

      await newOffer.save();

      res.status(201).json({
        _id: newOffer._id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: newOffer.product_details,
        owner: {
          account: {
            username: req.user.account.username,
            avatar: req.user.account.avatar,
            secure_url: req.user.account.secure_url,
          },
        },
        owner_id: req.user._id,
        product_image: newOffer.product_image,
        product_pictures: newOffer.product_pictures,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin || priceMax) {
      filters.product_price = {};
      if (priceMin) filters.product_price.$gte = Number(priceMin);
      if (priceMax) filters.product_price.$lte = Number(priceMax);
    }

    const sortObj = {};
    if (sort === "price-asc") {
      sortObj.product_price = 1;
    } else if (sort === "price-desc") {
      sortObj.product_price = -1;
    }

    const limit = 10;
    let pageNumber = Number(req.query.page);
    if (!pageNumber) {
      pageNumber = 1;
    } else if (pageNumber < 1) {
      pageNumber = 1;
    }
    const skip = (pageNumber - 1) * limit;

    const offers = await Offer.find(filters)
      .select(
        "product_details product_image product_pictures _id product_name product_description product_price owner"
      )
      .populate("owner", "account.username account.avatar.secure_url")
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const count = await Offer.countDocuments(filters);

    res.status(200).json({ count, offers, page: pageNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id).populate({
      path: "owner",
      select: "account.username account.avatar",
    });

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/offer/:id", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, condition, city, brand, size, color } =
      req.body;

    const updatedOffer = await Offer.findById(id);
    if (!updatedOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    if (updatedOffer.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (title) {
      updatedOffer.product_name = title;
    }

    if (description) {
      updatedOffer.product_description = description;
    }

    if (price) {
      updatedOffer.product_price = price;
    }

    const newDetails = [];
    if (brand) {
      newDetails.push({ MARQUE: brand });
    }
    if (size) {
      newDetails.push({ TAILLE: size });
    }
    if (condition) {
      newDetails.push({ ÉTAT: condition });
    }
    if (color) {
      newDetails.push({ COULEUR: color });
    }
    if (city) {
      newDetails.push({ EMPLACEMENT: city });
    }
    if (newDetails.length > 0) {
      updatedOffer.product_details = newDetails;
    }

    if (req.files && req.files.picture) {
      const uploadedImage = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture),
        {
          folder: `vinted/offers/${updatedOffer._id}`,
          public_id: "main",
          overwrite: true,
        }
      );
      updatedOffer.product_image = uploadedImage;
    }

    if (req.files && req.files.pictures) {
      if (!Array.isArray(updatedOffer.product_pictures)) {
        updatedOffer.product_pictures = [];
      }
      const galleryFiles = Array.isArray(req.files.pictures)
        ? req.files.pictures
        : [req.files.pictures];

      for (let index = 0; index < galleryFiles.length; index++) {
        const file = galleryFiles[index];
        const uploadedGalleryImage = await cloudinary.uploader.upload(
          convertToBase64(file),
          {
            folder: `vinted/offers/${updatedOffer._id}`,
            public_id: `gallery_${Date.now()}_${index}`,
          }
        );
        updatedOffer.product_pictures.push(uploadedGalleryImage);
      }
    }

    await updatedOffer.save();

    res.status(200).json({
      _id: updatedOffer._id,
      product_name: updatedOffer.product_name,
      product_description: updatedOffer.product_description,
      product_price: updatedOffer.product_price,
      product_details: updatedOffer.product_details,
      owner: {
        account: {
          username: req.user.account.username,
          avatar: req.user.account.avatar,
          secure_url: req.user.account.secure_url,
        },
      },
      owner_id: req.user._id,
      product_image: updatedOffer.product_image,
      product_pictures: updatedOffer.product_pictures,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/offer/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    if (offer.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (offer.product_image && offer.product_image.public_id) {
      await cloudinary.uploader.destroy(offer.product_image.public_id, {
        invalidate: true,
      });
    }

    if (Array.isArray(offer.product_pictures) && offer.product_pictures.length > 0) {
      const galleryToDelete = offer.product_pictures
        .filter((picture) => picture && picture.public_id)
        .map((picture) =>
          cloudinary.uploader.destroy(picture.public_id, {
            invalidate: true,
          })
        );
      if (galleryToDelete.length > 0) {
        await Promise.all(galleryToDelete);
      }
    }

    await offer.deleteOne();

    res.status(200).json({ message: "Offer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
