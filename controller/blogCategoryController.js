const Category = require("../models/blogCategoryModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbid");

const createCategory = asyncHandler(async(req,res)=>{
    try{
        const newCategory = await Category.create(req.body);
        res.json(newCategory);
    }catch(error){
        throw new Error(error);
    }
});

/* update Blog Category */

const updateCategory = asyncHandler(async(req,res)=>{
    const {id} =req.params;
    validateMongoDbId(id);
    try{
        const updatedCategory = await Category.findByIdAndUpdate(id, req.body,{
            new:true,
        });
        res.json(updatedCategory);
    }catch(error){
        throw new Error(error);
    }
});

/* fetch Blog Category */

const getCategory = asyncHandler(async(req,res)=>{
    const {id} =req.params;
    validateMongoDbId(id);
    try{
        const getaCategory = await Category.findById(id);
        res.json(getaCategory);
    }catch(error){
        throw new Error(error);
    }
});

/* fetch all Blog Category */

const getAllCategory = asyncHandler(async(req,res)=>{
    try{
        const getallCategory = await Category.find();
        res.json(getallCategory);
    }catch(error){
        throw new Error(error);
    }
});
/* delete Blog Category */

const deleteCategory = asyncHandler(async(req,res)=>{
    const {id} =req.params;
    validateMongoDbId(id);
    try{
        const deletedCategory = await Category.findByIdAndDelete(id);
        res.json(deletedCategory);
    }catch(error){
        throw new Error(error);
    }
});


module.exports = {createCategory , updateCategory, getCategory, getAllCategory, deleteCategory};