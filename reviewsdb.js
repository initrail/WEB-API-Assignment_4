var mongoose = require('mongoose')
var movies = require('./moviesdb')
mongoose.connect('mongodb://movieuseraccess:password1@ds117729.mlab.com:17729/moviesandusers')
var db = mongoose.connection
var Schema = mongoose.Schema
var Movies = movies.Movie

var ratingSchema = new Schema({
    Name: { type: String, required: true },
    Quote: { type: String, required: true },
    Rating: { type: Number, required: true, min:1, max:5 },
    MovieId: { type: Schema.Types.ObjectId, ref: 'Movie' }
})

var Rating = mongoose.model('Rating', ratingSchema)

var ratingsdb = {}

module.exports = { ratingsdb: ratingsdb, Rating: Rating }