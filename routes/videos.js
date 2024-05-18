const express = require('express')
const testUser = require('../middleware/testUser');

const router = express.Router()
const {
    getAllVideos,
    getSingleVideo,
    getSingleVdoStream,
    getVideoPoster,
    getVideoCaption
} = require('../controllers/videos')

router.route('/').get(getAllVideos)
router.route('/:id/data').get(getSingleVideo)
router.route('/:id').get(getSingleVdoStream)
router.route('/:id/poster').get(getVideoPoster)
router.route('/:id/caption').get(getVideoCaption)

module.exports = router