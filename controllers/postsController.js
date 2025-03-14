const { default: mongoose } = require("mongoose");
const { makePostsSchema, updatePostsSchema } = require("../middlewares/validator");
const Post = require("../models/posts.models");

exports.getPosts = async (req, res) => {
   
    try {
        const page = parseInt(req.query.page) || 1;
        let postsPerPage = parseInt(req.query.limit) || 7;
   
        const pageNumber = page < 1 ? 0 : page - 1;

        if (isNaN(postsPerPage) || postsPerPage < 1){
            postsPerPage = 7;
        }else if (postsPerPage > 100){
            postsPerPage = 100;
        }

        let {category} = req.query;
        const query = {};

        if(category){
            if(typeof category !== 'string' || category.trim === ''){
                return res.status(400).json({success: false, message: 'Category must be a non empty string'});
            }

            // ensures case insensitivity for matching category
            query.category = {$regex: new RegExp(`^${category}$`, 'i')};
        }

        const result = await Post.find(query)
        .sort({createdAt: -1})
        .skip(pageNumber * postsPerPage)
        .limit(postsPerPage)
        .populate({
            path: 'userId',
            select: 'email'
        })

        const totalPosts = await Post.countDocuments(query);
        const totalPages = Math.ceil(totalPosts / postsPerPage)

        res.status(200).json({
            success: true, 
            message: 'Posts retrieved successfully',
            data: result,
            pagination: {
                currentPage: page,
                totalPosts,
                totalPages,
                postsPerPage
            }
            
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false , message: 'Internal server error'});
        
    }
}


exports.singlePost = async (req, res) => {
    try {
        const {id} = req.params;
        const {category} = req.query;

        //validating the post id
        if (!mongoose.Types.ObjectId.isValid(id)){
            return res.status(401).json({success: false, message: 'Invalid post id'});
        }

        const query = {_id: id};

        if(category){
            if(typeof category !== 'string' || category.trim === ''){
                return res.status(401).json({success: false, message: 'Category must be a non-empty string'})
            }
            
            query.category = {$regex: new RegExp(`^${category}$`, 'i')};

        }

        const result = await Post.findOne(query).populate({path: 'userId', select: 'email'});

        if(!result){
            return res.status(401).json({success: false, message: 'Post unavailable. Category may not be specified correctly'});
        }

        return res.status(201).json({success: true, message: 'Post retrieved successfully', data: result});


    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
    
    
}

exports.makePosts = async (req, res) => {
    try {
        const {title, category, description} = req.body;

        if(!req.user || ! req.user.userId){
            return res.status(404).json({success: false, message: 'Unauthorized. User not authenticated'});
        }

        const {userId} = req.user;

        const {error, value} = makePostsSchema.validate(req.body);
        if(error){
            return res.status(401).json({success: false, message: error.details[0].message});
        }

        // create the post
        const result = await Post.create({title, category, description, userId});

        res.status(201).json({success: true, message: 'Post successfully created', data: result})
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}


exports.updatePost = async (req, res) => {
    try {
        // obtaining id to update post
        const {id} = req.params;

        //validating id
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(401).json({success: false, message: 'Invalid post Id'});
        }

        if(!req.user || !req.user.userId){
            return res.status(401).json({success: false, message: 'Unauthorized. User does not exist'});
        }

        const userId = req.user.userId;

        const {error, value} = updatePostsSchema.validate(req.body);
        if(error){
            return res.status(401).json({success: false, message: error.details[0].message})
        }

        //finding the post by id
        const post = await Post.findById(id);

        if(!post){
            return res.status(404).json({success: false, message: 'Post unavailable'});
        }

        if(!post.userId.equals(userId)){
            return res.status(403).json({success: false, message: 'You cannot not update this post'});
        }

        //updating the post with provided fields
        const updatedPost = await Post.findByIdAndUpdate(
            id,
            {$set: value}, // only update fields found in the req.body
            {new: true, runValidators: true} //return the updated document and run the schema validators
        ).populate({path: 'userId', select: 'email'})


        res.status(200).json({
            success: true,
            message: 'Updated successfully',
            data: updatedPost
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({success: false , message: 'Internal server error'})
    }
}


exports.deletePost = async (req,res) => {
    try {
        const {id} = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(401).json({success:false , message: 'Invalid post Id'});
        }

        if(!req.user || !req.user.userId){
            return res.status(401).json({success: false , message: 'User not found'});
        }

        const userId = req.user.userId;

        const post = await Post.findById(id);

        if(!post){
            return res.status(404).json({success: false , message: 'Post not found'});
        }

        if(!post.userId.equals(userId)){
            return res.status(403).json({success: false , message: 'Unauthorized. You cannot delete this post'});
        }

        await Post.findByIdAndDelete(id);

        res.status(200).json({success: true, message: 'Post deleted successfully'})


    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false , message: 'Internal server error'})
    }
}