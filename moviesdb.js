var mongoose = require('mongoose')
var reviews = require('./reviewsdb')
var jwt = require('jsonwebtoken')
var Rating = reviews.Rating
var fs = require('fs')

mongoose.connect('mongodb://movieuseraccess:password1@ds117729.mlab.com:17729/moviesandusers')

var Schema = mongoose.Schema
var db = mongoose.connection

var actorSchema = new Schema({
    ActorName: { type: String, required: true },
    CharacterName: { type: String, required: true }
})

var manyValidators = [
    { validator: isActor, msg: 'Is not an Actor' },
    { validator: minSize, msg: 'Not enough actors' }
];
function isActor(val) {
    return val.every(function (i) { return i instanceof Actor });
}
function minSize(val) {
    return val.length >= 3
}

var movieSchema = new Schema({
    Image: { data: Buffer, contentType: String },
    Title: { type: String, required: true },
    Year: { type: Number, required: true },
    Genre: { type: String, enum: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western'], required: true },
    Actors: {
        type: [actorSchema],
        required: true,
        validate: manyValidators
    }
})

var Movie = mongoose.model('Movie', movieSchema)
var Actor = mongoose.model('Actor', actorSchema)
var moviesdb = {}

moviesdb.uploadRating = function (req, res) {
    console.log('req.body.MovieId is '+req.body.MovieId)
    if (req.body.MovieId) {
        Movie.findById(req.body.MovieId, function (err, movie) {
            if (err)
                res.json({ error: err })
            if (movie) {
                console.log('Found the movie!')
                console.log('req.body' + req.body)
                console.log('calling jwt.verify')
                console.log('req.headers.token ' + req.headers.token)
                var decode = jwt.verify(req.headers.token, process.env.SECRET_KEY);
                var rating = new Rating()
                rating.Name = decode.name
                rating.Quote = req.body.Quote
                rating.Rating = req.body.Rating
                rating.MovieId = req.body.MovieId
                console.log('stringify ' + JSON.stringify(rating))
                rating.save(function (error) {
                    console.log('rating.save(function(error) {')
                    if (error) {
                        res.json({ error: error })
                    }
                    else {
                        res.json({ success: 'Review successfully added.' })
                    }
                })
            }
        })
    }
    else
        res.json({ error: "MovieId required!" })
}

moviesdb.addAMovie = function (req, res) {
    var movie = new Movie()
    if (req.body.movie) {
        movie.Image.data = fs.readFileSync(req.body.movie.imgPath)
        console.log(movie.Image.data)
        movie.Image.contentType = 'image/jpeg'
        movie.Title = req.body.movie.Title
        movie.Year = req.body.movie.Year
        movie.Genre = req.body.movie.Genre
        for (var i = 0; i < req.body.movie.Actors.length; i++)
            movie.Actors[i] = new Actor(req.body.movie.Actors[i].Actor)
        movie.save(function (error) {
            if (error != null)
                res.json({ error: error })
            else
                res.json({ success: 'Movie successfully inserted.' })
        })
    } else {
        res.json({error:'There is no movie to insert.'})
    }
}

moviesdb.getAllMovies = function (req, res) {
    var timer = null
    ObjectId = mongoose.Types.ObjectId
    Rating.aggregate([
        { $group: { _id: '$MovieId', average: { $avg: '$Rating' } } },
        { $sort: { average: -1 } }
    ])
        .exec(function (err, avgrs) {
            if (err)
                res.json({ error: err })
            if (avgrs) {
                avgrs.forEach(function (element, i) {
                    var movie = avgrs[i]
                    Movie.findById(movie._id)
                        .exec(function (err, film) {
                            movie['Title'] = film.Title
                            movie['Year'] = film.Year
                            movie['Image'] = film.Image
                            movie['Genre'] = film.Genre
                            movie['Actors'] = film.Actors
                            avgrs[i] = movie
                            if (timer != null)
                                clearTimeout(timer)
                            timer = setTimeout(() => {
                                res.json({ Movies: avgrs })
                            }, 1000)
                        })
                })
            }
        })
}

moviesdb.getAMovie = function (req, res) {
    if (req.query.movieId) {
        console.log('req.query.movieId is '+req.query.movieId)
        ObjectId = mongoose.Types.ObjectId
        console.log('Searching by id.')
        Movie.aggregate([
            {
                $match: { _id: ObjectId(req.query.movieId) }
            },
            {
                $lookup:
                    {
                        from: "ratings",
                        localField: "_id",
                        foreignField: "MovieId",
                        as: "reviews"
                    }
            }
        ]).exec(function (err, movie) {
            if (err)
                res.json({ error: err })
            if (movie) {
                var average = 0;
                for (var i = 0; i < movie[0].reviews.length; i++) {
                    average += movie[0].reviews[i].Rating
                }
                average /= movie[0].reviews.length
                movie[0]['average'] = average
                res.json({ Movie: movie })
            }
        })
    }
    else if (req.query.Title) {
        if (!req.query.reviews)
            Movie.find({ Title: req.query.Title }, function (err, movie) {
                res.json({ movies: movie })
            })
        else {
            if (req.query.reviews == "true")
                Movie.aggregate([{
                    $lookup:
                        {
                            from: "ratings",
                            localField: "_id",
                            foreignField: "MovieId",
                            as: "rating"
                        }
                }, {
                    $match: { Title: req.query.Title }

                }]).exec(function (err, movies) {
                    if (err)
                        res.json({ error: err })
                    if (movies)
                        res.json({ Movie: movies })
                })
            else
                Movie.find({ Title: req.query.Title }, function (err, movie) {
                    res.json({ movies: movie })
                })
        }
    }
    //Year
    else if (req.query.Year) {
        if (!req.query.reviews)
            Movie.find({ Year: req.query.Year }, function (err, movie) {
                res.json({ movies: movie })
            })
        else {
            if (req.query.reviews == "true")
                Movie.aggregate([{
                    $lookup:
                        {
                            from: "ratings",
                            localField: "_id",
                            foreignField: "MovieId",
                            as: "rating"
                        }
                }, {
                    $match: { Year: req.query.Year }

                }]).exec(function (err, movies) {
                    if (err)
                        res.json({ error: err })
                    if (movies)
                        res.json({ Movie: movies })
                })
            else
                Movie.find({ Year: req.query.Year }, function (err, movie) {
                    res.json({ movies: movie })
                })
        }
    }
    //Genre
    else if (req.query.Genre) {
        if (!req.query.reviews)
            Movie.find({ Genre: req.query.Genre }, function (err, movie) {
                res.json({ movies: movie })
            })
        else {
            if (req.query.reviews == "true")
                Movie.aggregate([{
                    $lookup:
                        {
                            from: "ratings",
                            localField: "_id",
                            foreignField: "MovieId",
                            as: "rating"
                        }
                }, {
                    $match: { Genre: req.query.Genre }

                }]).exec(function (err, movies) {
                    if (err)
                        res.json({ error: err })
                    if (movies)
                        res.json({ Movie: movies })
                })
            else
                Movie.find({ Genre: req.query.Genre }, function (err, movie) {
                    res.json({ movies: movie })
                })
        }
    }
    else {
        res.json({error:'No query parameters given.'})
    }
}
//SELECT AVG(Rating) FROM Ratings GROUP BY MovieId ORDER BY AVG(Rating)
moviesdb.deleteAMovie = function (req, res) {
    if (req.body._id) {
        Movie.findByIdAndRemove(req.body._id, function (err, doc) {
            if (err) {
                res.json({ error: 'Could not delete movie.' })
            }
            else {
                if (doc) {
                    res.json({ success: 'Movie successfully removed.' })
                }
                else {
                    res.json({ error: 'Could not find movie.' })
                }
            }
        })
    }
    else
        res.json({error:'No id given.'})
}

moviesdb.updateAMovie = function (req, res) {
    if(req.body.Title)
        Movie.findByIdAndUpdate(req.body._id, { $set: { Title: req.body.Title } }, { new: true }, function (err, doc) {
            if (err)
                res.json({ error: 'Could not update movie.' })
            else {
                if(doc)
                    res.json({ success: 'Movie successfully updated.' })
                else
                    res.json({error:'Could not find movie for updating.'})
            }
        })
    else if (req.body.Year)
        Movie.findByIdAndUpdate(req.body._id, { $set: { Year: req.body.Year } }, { new: true }, function (err, doc) {
            if (err)
                res.json({ error: 'Could not update movie.' })
            else {
                if (doc)
                    res.json({ success: 'Movie successfully updated.' })
                else
                    res.json({ error: 'Could not find movie for updating.' })
            }
        })
    else if (req.body.Genre)
        Movie.findByIdAndUpdate(req.body._id, { $set: { Genre: req.body.Genre } }, { new: true }, function (err, doc) {
            if (err)
                res.json({ error: 'Could not update movie.' })
            else {
                if (doc)
                    res.json({ success: 'Movie successfully updated.' })
                else
                    res.json({ error: 'Could not find movie for updating.' })
            }
        })
}

module.exports = { moviesdb:moviesdb, Movie:Movie }