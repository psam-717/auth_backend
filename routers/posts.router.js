const express = require('express');
const { authenticateToken } = require('../middlewares/identification');
const PostsController = require('../controllers/postsController');
const Post = require('../models/posts.models');
const router = express.Router();

router.get('/all_posts', authenticateToken, PostsController.getPosts );
router.get('/single_post/:id', authenticateToken, PostsController.singlePost);
router.post('/create_post', authenticateToken, PostsController.makePosts);
router.put('/update_post/:id', authenticateToken, PostsController.updatePost);
router.delete('/delete_post/:id',authenticateToken, PostsController.deletePost)



module.exports = router;