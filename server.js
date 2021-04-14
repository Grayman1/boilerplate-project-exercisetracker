const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongodb = require('mongodb')
const mongoose = require('mongoose')
//const {Schema} = mongoose
const bodyParser = require('body-parser')

// SET-UP MONGOOSE
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

console.log('conn status:  '+mongoose.connection.readyState);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/*
// _id:6075d9e677b21802115030f2
username:"Grayman009001"
__v:0


// exercise example record:
_id:6075c945f5360d0139812af9
userId:"6075c945f5360d0139812af8"
description:"test"
duration:60
date:1990-01-01T00:00:00.000+00:00
__v:0

*/

// 2nd Attempt

let exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date:{type: String}
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSchema]
})

let userModel = mongoose.model('userModel', userSchema)
let exerciseModel = mongoose.model('exerciseModel', exerciseSchema)

app.post('/api/exercise/new-user',bodyParser.urlencoded({extended: false}), (req, res) => {
  let newUser = new userModel({username: req.body.username})
  newUser.save((error, savedUser) => {
    if (!error) {
      let resObject = {}
      resObject['username'] = savedUser.username
      resObject['_id'] = savedUser.id
      res.json(resObject)

    }
  })
})

app.get("/api/exercise/users", (req, res) => {
  userModel.find({}, (err, data) => {
    if(!data) {
      res.send("No users")
    }
    else {
      res.json(data)
    }
  })
})

app.post('/api/exercise/add',bodyParser.urlencoded({extended: false}), (req, res) => {

  
  let newExercise = new exerciseModel({
    description: req.body.description, 
    duration: parseInt(req.body.duration), 
    date: req.body.date})

  if (newExercise.date === '') {
    newExercise.date = new Date().toISOString().substring(0,10)
  }

  userModel.findByIdAndUpdate(
    req.body.userId,
    {$push : {log: newExercise}},
    {new: true},
    (err, data) => {
      if (!err) {
        let resObject = {}
        resObject['_id'] = data.id
        resObject['username'] = data.username
        resObject['description'] = newExercise.description
        resObject['duration'] = newExercise.duration
        resObject['date'] = new Date(newExercise.date).toDateString()
        res.json(resObject)
      }
    }

  )

/*  newExercise.save((err, data) => {
  res.json({username, description, 
  duration: +duration, 
  _id: userId, 
  date: new Date(date).toDateString()
  })
    //  res.json({ userId, username, description, duration, date})
    var {userId, description, duration, date} = req.body;
   
  if (!date) {
    date = new Date().toISOString().substring(0,10);
  }

  userModel.findById(userId, (err, data) => {
    if (!data) {
      res.send("Unknown userId")
    }
    else {
      const username = data.username;
      })
    }
  }) */
})



/*
// 1st  Solution Attempt
let userSchema = new mongoose.Schema({
  username: {type: String, unique: true}
  })
let userModel = mongoose.model('userModel', userSchema)

let exerciseSchema = new mongoose.Schema({
  userId: {type: String},
  description: {type: String},
  duration: {type: Number},
  date: {type: Date}
  })
let exerciseModel = mongoose.model('exerciseModel', exerciseSchema)

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.post('/api/exercise/new-user', (req, res) => {
  const newPerson = new userModel({username: req.body.username})
  console.log("newPerson: ", newPerson.username)
  
  newPerson.save((err, data) => {
    if (err) {
      res.json('username already taken')
    } 
    else {
    res.json({"username": data.username, "_id": data.id})
  }
  })  
})

app.post('/api/exercise/add', (req, res) => {
  var {userId, description, duration, date} = req.body;
   
  if (!date) {
    date = new Date();
  }
  userModel.findById(userId, (err, data) => {
    if (!data) {
      res.send("Unknown userId")
    }
    else {
      const username = data.username;
      let newExercise = new exerciseModel({userId, description, duration, date})
      newExercise.save((err, data) => {
      res.json({username, description, duration: +duration, _id: userId, date: new Date(date).toDateString()})
    //  res.json({ userId, username, description, duration, date})
      })
    }
  })
})


app.get('/api/exercise/log',(req, res) => {

  const {userId, from, to, limit} = req.query;
 
  userModel.findById(userId, (err, data) => {
    if (!data) {
      res.send("Unknown userId")
    }
    else {
      const username = data.username;
      console.log({"userId": userId, "from: ": from, "to: ": to, "limit: ": limit});
      
      exerciseModel.find({userId},{date: {$gte: new Date(from), $lte: new Date(to)}})
      .select(["id", "description", "duration", "date"])
      .limit(+limit)
      .exec((err, data) => {
        let customdata = data.map(exer => {
          let dateFormatted = new Date(exer.date).toDateString();
          return {id: exer.id, description: exer.description, duration: exer.duration, date: dateFormatted}
        })
    
      if (!data) {
        res.json({
          "userId": userId,
          "username": username,
          "count": 0,
          "log": [] })
      } else {
        res.json({
          "userId": userId,
          "username": username,
          "count": data.length,
          "log": customdata})
      }      
    }) 
    }
  }) 
})

app.get("/api/exercise/users", (req, res) => {
  userModel.find({}, (err, data) => {
    if(!data) {
      res.send("No users")
    }
    else {
      res.json(data)
    }
  })
})
*/

// Not Found Middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling Middleware
app.use((req, res, next) => {
  let errCode, errMessage

  if (err, errors) {
    // mongoose validation error
    errCode = 400 //bad request
    const keys = Ojbect.keys(err.errors)
    // Report the first validation error
    errMessage = err.errors[keys[0]].message}
    else {
      // generic or custom error
      errCode = err.status || 500
      errMessage = err.message || 'Internal Server Error'
    }
    res.status(errCode)
      .type('txt')
      .send(errMessage)

})



/*
// Your first API endpoint
// Final Solution
let urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true},
  short_url: {type: Number}
  })
let urlModel = mongoose.model('URL', urlSchema)

// Gett the URL Input Parameter
let responseObject = {}

app.post('/api/shorturl/new', bodyParser.urlencoded({extended: false}), (req, res) => {
  let inputUrl = req.body.url
  console.log("Input URL: ", inputUrl)
//  console.log("re.body: ", req.body)
  
//  res.json(responseObject)
const something = dns.lookup(urlparser.parse(inputUrl).hostname, (err, address) => {
    if (!address) {
      res.json({error: "Invalid URL"})
    } else {
      responseObject['original_url'] = inputUrl
    }
})

*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
