const Job = require('../models/Job')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')
const mongoose = require('mongoose');
const moment = require('moment');
const express = require('express');
const fs = require('fs');
const path = require('path');
const thumbsupply = require('thumbsupply');
const srt2vtt = require('srt-to-vtt');

const movieData = require('../videos.json')

// const videos = [
//     {
//         id: 0,
//         file_path: `Y:/007/2012 (2009)/2012 (2009).mp4`,
//         poster: '/videos/0/poster',
//         poster_url: 'https://m.media-amazon.com/images/M/MV5BMjQ0MTgyNjAxMV5BMl5BanBnXkFtZTgwNjUzMDkyODE@._V1_.jpg',
//         duration: '3 mins',
//         name: '2012 (2009)'
//     },
//     {
//         id: 1,
//         file_path: `Y:/007/A Good Day to Die Hard (2013)/A Good Day to Die Hard (2013).mp4`,
//         poster: '/videos/1/poster',
//         poster_url: 'https://asset.cloudinary.com/dng1fxwgg/0d3cb75da2f3fa17577ee2048c25d8ca',
//         duration: '4 mins',
//         name: 'A Good Day to Die Hard (2013)'
//     },
//     {
//         id: 2,
//         file_path: `Y:/007/Alexander (2004)/Alexander (2004).mp4`,
//         poster: '/videos/2/poster',
//         poster_url: 'https://asset.cloudinary.com/dng1fxwgg/0d3cb75da2f3fa17577ee2048c25d8ca',
//         duration: '2 mins',
//         name: 'Alexander (2004)'
//     },
// ];

const getAllVideos = async (req, res) => {
    res.json(movieData);
}

const getSingleVideo = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const movie = movieData.find(item => item.id === id);
    res.json(movie.name);
}

const getSingleVdoStream = async (req, res) => {
    // const path = `assets/${req.params.id}.mp4`;
    const id = parseInt(req.params.id);
    const result = movieData.find(item => item.id === id);

    const path = result.file_path;
    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(path, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(path).pipe(res);
    }
}

const getVideoPoster = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    res.json(videos[id]);
}

const getVideoCaption = async (req, res) => {
    const id = parseInt(req.params.id);
    const result = movieData.find(item => item.id === id);
    const videoFilePath = result.file_path;
    // Extract the directory path
    const directoryPath = path.dirname(videoFilePath);

    // Find the .srt file in the directory
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error reading directory');
        }

        // Find the first .srt file in the directory
        const captionFile = files.find(file => path.extname(file) === '.srt');

        if (captionFile) {
            const captionFilePath = path.join(directoryPath, captionFile);
            const vttFilePath = path.join(directoryPath, `${path.basename(captionFile, '.srt')}.vtt`);

            // Convert .srt to .vtt
            fs.createReadStream(captionFilePath)
                .pipe(srt2vtt())
                .pipe(fs.createWriteStream(vttFilePath))
                .on('finish', () => {
                    // Send the converted .vtt file
                    res.sendFile(vttFilePath);
                })
                .on('error', (conversionErr) => {
                    console.log(conversionErr);
                    res.status(500).send('Error converting caption file');
                });
        } else {
            res.status(404).send('Caption file not found');
        }
    });
}


module.exports = {
    getAllVideos,
    getSingleVideo,
    getSingleVdoStream,
    getVideoPoster,
    getVideoCaption
}
