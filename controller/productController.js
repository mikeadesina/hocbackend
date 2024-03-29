const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbid");


/* create product */
const createProduct = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    let updateProduct;
    if (req.body.title) {
      const { slug, ...restOfBody } = req.body;
      updateProduct = await Product.findByIdAndUpdate(id, restOfBody, {
        new: true,
      });
      if (updateProduct && slug) {
        updateProduct.slug = slug;
        await updateProduct.save();
      }
    } else {
      updateProduct = await Product.findByIdAndUpdate(id, req.body, {
        new: true,
      });
    }
    if (!updateProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(updateProduct);
  } catch (error) {
    console.error(error);
    if (error.code === 11000 || error.code === 11001) {
      return res.status(400).json({ message: 'Duplicate key error. Slug must be unique.' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


/* delete a Product */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteProduct = await Product.findOneAndDelete(id);
    res.json(deleteProduct);
  } catch (error) {
    throw new Error(error);
  }
});

/* for single product */
const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    /*const findProduct = await Product.findById(id).populate("color").populate("size");*/
    const findProduct = await Product.findById(id)
        .populate("color")
        .populate("size")
        .populate("ratings.postedby", "firstname lastname");
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});



/* for all product */
const getAllProduct = asyncHandler(async (req, res) => {
  try {
    const queryObj = { ...req.query };
    console.log(queryObj);
    const excludeFields = ["page", "sort", "limit", "fields", "color"];
    excludeFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
    );

    let query = Product.find(JSON.parse(queryStr));

    if (req.query.color) {
      const colors = req.query.color.split(",");
      query = query.where("color").in(colors);
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    // Populate only the 'color' codes
    query = query.populate([
          {
            path: "color",
            select: "title",
          },
         {
           path: "size",
           select: "title",
         }
          ]);

    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("This Page Does Not Exist");
    }
    const products = await query.exec();
    const result = products.map((product) => ({
      ...product.toObject(),
      color: product.color.map((color) => color.title),
      size: product.size.map((size) => size.title),
    }));
    res.json(result);
  } catch (error) {
    throw new Error(error);
  }
});



/*
const getAllProduct = asyncHandler(async (req, res) => {
  try {
    /!* this is for filtering *!/
    const queryObj = { ...req.query };
    const excludeFeilds = ["page", "sort", "limit", "feilds","color"];
    excludeFeilds.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    if (req.query.color) {
      const colors = req.query.color.split(",");
      query = query.where("color").in(colors);
    }
    query = query.populate("color");


    /!* now sorting *!/

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    /!* Now for Limiting Feilds *!/

    if (req.query.feilds) {
      const feilds = req.query.feilds.split(",").join(" ");
      query = query.select(feilds);
    } else {
      query = query.select("-__v");
    }

    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("This Page Does Not Exist");
    }
    const product = await query;
    res.json(product);
  } catch (error) {
    throw new Error(error);
  }
});
*/

/* WishList Functionality */

const addToWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { prodId } = req.body;
  console.log(prodId);
  try {
    const user = await User.findById(_id);
    console.log(user);
    const alreadyadded = user.wishlist.find((id) => id.toString() === prodId);
    if (alreadyadded) {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $pull: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    } else {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $push: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    }
  } 
  catch (error) {
    throw new Error(error);
  }
});

/* Rating Function */

const rating = asyncHandler(async (req, res) => {
  /*console.log(req.body,req.user);*/
  const { _id } = req.user;
  const { star, prodId , comment } = req.body;
  try {
    const product = await Product.findById(prodId);
    const alreadyRated = product.ratings.find(
        (rating) => rating.postedby.toString() === _id.toString()
    );
    if (alreadyRated) {
      await Product.updateOne(
          { "ratings._id": alreadyRated._id },
          { $set: { "ratings.$.star": star, "ratings.$.comment": comment } }
      );
    } else {
      await Product.findByIdAndUpdate(
          prodId,
          {
            $push: {
              ratings: {
                star: star,
                comment: comment,
                postedby: _id,
              },
            },
          }
      );
    }
    const updatedProduct = await Product.findById(prodId);
    const totalRating = updatedProduct.ratings.length;
    const ratingSum = updatedProduct.ratings
        .map((item) => item.star)
        .reduce((prev, curr) => prev + curr, 0);
    const averageRating = Math.round(ratingSum / totalRating);
    const finalProduct = await Product.findByIdAndUpdate(
        prodId,
        { totalrating: averageRating },
        { new: true }
    );
    res.json(finalProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }


  /*try {
    const product = await Product.findById(prodId);
    let alreadyRated = product.ratings.find(
      (userId) => userId.postedby.toString() === _id.toString()
    );
    if (alreadyRated) {
      const updateRating = await Product.updateOne(
        {
          ratings: { $elemMatch: alreadyRated },
        },
        {
          $set: { "ratings.$.star": star ,  "ratings.$.comment": comment },
        },
        {
          new: true,
        }
      );
    } else {
      const rateProduct = await Product.findByIdAndUpdate(
        prodId,
        {
          $push: {
            ratings: {
              star: star,
              comment : comment,
              postedby: _id,
            },
          },
        },
        {
          new: true,
        }
      );
    }

    const getallratings = await Product.findById(prodId);
    let totalRating = getallratings.ratings.length;
    let ratingsum = getallratings.ratings
      .map((item) => item.star)
      .reduce((prev, curr) => prev+curr, 0);
    let actualRating = Math.round(ratingsum / totalRating);
    let finalproduct = await Product.findByIdAndUpdate(
      prodId,
      {
        totalrating: actualRating,
      },
      {
        new: true,
      }
    );
    res.json(finalproduct)
  } catch (error) {
    throw new Error(error);
  }*/
});



module.exports = {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
};
