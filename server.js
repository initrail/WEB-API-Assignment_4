var express = require('express')
var http = require('http')
var bodyParser = require('body-parser')
var passport = require('passport')
var sessionManager = require('./auth')
var movies = require('./moviesdb')
var usersdb = require('./usersdb')
var reviews = require('./reviewsdb')
var cors = require('cors')
var moviesdb = movies.moviesdb
var reviewsdb = reviews.ratingsdb

var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended : false }))
app.use(cors())
app.use(passport.initialize())

var router = express.Router()

var notSupported = 'This method is not supported.'

var secretKey = process.env.SECRET_KEY

var param = 'This request has no query parameters'

router.route('')
    .all(function (req, res) {
        res.json({ error: notSupported })
    })

router.route('/signup')
    .all(function (req, res) {
        if (req.method != 'POST') {
            res.json({ error: notSupported })
        } else {
            usersdb.createUser(req, res)
        }
    })

router.route('/signin')
    .all(function (req, res) {
        if (req.method != 'POST') {
            res.json({ error: notSupported })
        } else {
            console.log(req.body)
            usersdb.signIn(req.body.Username, req.body.Password, res, function (err, result, user) {
                if (result) {
                    token = sessionManager.getToken(user)
                    res.json({ success: 'Welcome', token: token })
                } else {
                    res.json({ error: 'Either the username or password is incorrect.' })
                }
            })
        }
    })

router.route('/movies/writeareview')
    .all(function (req, res) {
        if (req.method != 'POST') {
            res.json({ error: notSupported })
        } else {
            sessionManager.validToken(req, res, function (result, req, res) {
                if (result)
                   moviesdb.uploadRating(req, res)
            })
        }
    })

router.route('/movies/getareview')
    .all(function (req, res) {
        if (req.method != 'GET') {
            res.json({ error: notSupported })
        } else {
            sessionManager.validToken(req, res, function (result, req, res) {
                if (result)
                    reviewsdb.uploadReview(req, res)
            })
        }
    })

router.route('/movies/getamovie')
    .all(function (req, res) {
        if (req.method != 'GET') {
            res.json({ error : notSupported })
        } else {
            sessionManager.validToken(req, res, function (result, req, res) {
                if (result)
                    moviesdb.getAMovie(req, res)
            })
        }
    })

router.route('/movies/getallmovies')
    .all(function (req, res) {
        if (req.method != 'GET') {
            res.json({ error: notSupported })
        } else {
            sessionManager.validToken(req, res, function (result, req, res) {
                if (result)
                    moviesdb.getAllMovies(req, res)
            })
        }
    })

router.route('/movies/updateamovie')
    .all(function (req, res) {
        if (req.method != 'POST') {
            res.json({ error: notSupported })
        } else {
            sessionManager.validToken(req, res, function (result, req, res) {
                if (result)
                    moviesdb.updateAMovie(req, res)
            })
        }
    })

router.route('/movies/insertamovie')
    .all(function (req, res) {
        if (req.method != 'PUT') {
            res.json({ error: notSupported })
        } else {
            sessionManager.validToken(req, res, function (result, req, res) {
                if (result)
                    moviesdb.addAMovie(req, res)
            })
        }
    })

router.route('/movies/deleteamovie')
    .all( function (req, res) {
        if (req.method != 'DELETE') {
            res.json({ error: notSupported })
        } else {
            sessionManager.validToken(req, res, function (result, req, res) {
                if (result)
                    moviesdb.deleteAMovie(req, res)
            })
        }
    })

app.use('', router)
app.listen(process.env.PORT || 1010)
