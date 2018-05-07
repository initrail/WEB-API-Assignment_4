require('dotenv').config()
var jwt = require('jsonwebtoken')
var secretKey = process.env.SECRET_KEY

var sessionManager = {}

sessionManager.getToken = function (user, callback) {
    var token = jwt.sign({
        name: user.Name,
        username: user.Username
    }, secretKey, { expiresIn: 86400 })
    return token
}

sessionManager.validToken = function (req, res, callback) {
    var result
    var token = req.body.token || req.headers.token
    if (token) {
        jwt.verify(token, secretKey, function (err, decoded) {
            if (err) {
                res.status(403).send({ error: 'Invalid token.' })
                result = false
            }
            else {
                req.decoded = decoded
                result = true
            }
        })
    } else {
        res.status(403).send({ error: 'No token was received.' })
        result = false
    }
    callback(result, req, res)
}

module.exports = sessionManager
