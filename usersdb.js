var mongoose = require('mongoose')
var bcrypt = require('bcrypt-nodejs')

mongoose.connect('mongodb://movieuseraccess:password1@ds117729.mlab.com:17729/moviesandusers')

var Schema = mongoose.Schema
var db = mongoose.connection

var usersSchema = new Schema({
    Name: { type: String, required: true },
    Username: {
        type: String, required: true, index: { unique: true }
    },
    Password: { type: String, required: true }
})

var User = mongoose.model('User', usersSchema)

var userdb = {}
userdb.createUser = function (req, res) {
    var user = new User()
    user.Name = req.body.Name
    user.Username = req.body.Username
    if (req.body.Password !== req.body.Password_Retyped) {
        res.json({ error: 'Retyped password does not match.' });
        return
    }
    user.Password = req.body.Password
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(user.Password, salt, null, function (err, hash) {
            if (err)
                return console.log(err)
            user.Password = hash
            bcrypt.compare(req.body.Password, user.Password, function (err, res) {
                console.log('from signup res = ' + res)
                console.log(user.Name)
                console.log(user.Username)
                console.log(user.Password)
            })
            user.save(function (err) {
                if (err != null) {
                    if (err.code != null) {
                        if (err.code === 11000)
                            res.json({ error: 'User already exists.' })
                    }
                    else
                        res.json({ error: err })
                }
                else
                    res.json({ success: 'User successfully created' })
            })
        })
    })
}

userdb.signIn = function (username, password, res, callback) {
    User.findOne({ 'Username': username }, 'Name Username Password', function (err, user) {
        var result
        if (err)
            return console.log(err)
        if (!user) {
            result = false
            callback(err, result, user)
        }
        else {
            bcrypt.compare(password, user.Password, function (err, res) {
                if (res)
                    result = true
                else
                    result = false
                callback(err, result, user)
            })
        }
    })
}

module.exports = userdb