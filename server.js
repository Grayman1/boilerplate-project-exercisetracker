const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongodb = require('mongodb')
const mongoose = require('mongoose')
const {Schema} = mongoose
const bodyParser = require('body-parser')

// SET-UP MONGOOSE DB CONNECTIONS
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
// CHECK DB CONNECTION STATUS
// console.log('conn status:  '+mongoose.connection.readyState);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
//  console.log('Your app is listening on port ' + listener.address().port)
})

/*
// EXAMPLE RECORDS

// 
_id:607787e8e1eb300096a5f25c
username:"Grayman009001"
log:Array
0:Object
1:Object
_id:607788bfe0abba01069af326
description:"Running"
duration:45
date:"2020-01-09"
2:Object
3:Object
4:Object
__v:0

*/


// CREATE SCHEMA AND MODELS

let activitySchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  log: [activitySchema]
})

let User = mongoose.model('User', userSchema)
let Activity = mongoose.model('Activity', activitySchema)

// CREATE NEW USERS
app.post('/api/exercise/new-user', bodyParser.urlencoded({extended: false}),(req, res) => {
  let newUser = new User({username: req.body.username})
  newUser.save((err, dataUser) => {
    if(err){
      res.json('username already taken')
    } else {
      let resObject = {}
      resObject['username'] = dataUser.username
      resObject['_id'] = dataUser.id
      res.json(resObject)
    }
  })
})

// ADD NEW EXERCISE ACTIVITIES

app.post('/api/exercise/add', bodyParser.urlencoded({extended: false}), (req, res) => {
  
  let newActivity = new Activity({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  })
  
  if(newActivity.date === ''){
    newActivity.date = new Date().toISOString().substring(0,10)
  }
  
  User.findByIdAndUpdate(
    req.body.userId,
    {$push: {log: newActivity}},
    {new: true},
    (err, updatedUser) => {
    if(!err){
      let resObject = {}
      resObject['_id'] = updatedUser.id
      resObject['username'] = updatedUser.username
      resObject['description'] = newActivity.description
      resObject['duration'] = newActivity.duration
      resObject['date'] = new Date(newActivity.date).toDateString()
      res.json(resObject)
    }
  })
})

// RETRIEVE A USER'S EXERCISE ACTIVITY LOG 
app.get('/api/exercise/log', (req, res) => {

  User.findById(req.query.userId, (err, result) => {
    if(!err){
      let resObject = result


//Date Filter
    if(req.query.from || req.query.to){
      let fromDate = new Date(0)
      let toDate = new Date()
  
    if(req.query.from){
     fromDate = new Date(req.query.from)
     
    }
  
    if(req.query.to){
      toDate = new Date(req.query.to)
    }
//    console.log('fromDate: ', fromDate, "toDate: ", toDate)

    fromDate = fromDate.getTime()
    toDate = toDate.getTime()

//    console.log('fromDate: ', fromDate, "toDate: ", toDate)

    resObject.log = resObject.log.filter((activity) =>{
      let activityDate = new Date(activity.date).getTime()
    
      return activityDate >= fromDate
      && activityDate <= toDate
    })
  }
  if(req.query.limit){
  resObject.log = resObject.log.slice(0, req.query.limit)
  }

  resObject = resObject.toJSON()
  resObject['count'] = result.log.length
  res.json(resObject)
  }
  })
})



// GET ALL USERS
app.get('/api/exercise/users', (req, res) => {
  User.find({}, (error, arrayOfUsers) => {
    if(!error){
      res.json(arrayOfUsers)
    }
  })
})