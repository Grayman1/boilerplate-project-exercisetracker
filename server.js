const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongodb = require('mongodb')
const mongoose = require('mongoose')
const {Schema} = mongoose
const bodyParser = require('body-parser')

// SET-UP MONGOOSE
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

console.log('conn status:  '+mongoose.connection.readyState);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

/*
// _id:6076457689e5a0097b2069f9
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


// Ganesh
// Creating User Model

let exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSchema]
})

let User = mongoose.model('User', userSchema)
let Exercise = mongoose.model('Exercise', exerciseSchema)

// Creating Users 
app.post('/api/exercise/new-user', bodyParser.urlencoded({extended: false}),(request, response) => {
  let newUser = new User({username: request.body.username})
  newUser.save((error, savedUser) => {
    if(!error){
      response.json({username: savedUser.username, _id: savedUser.id})
    }
  })
})

// Get all Users
app.get('/api/exercise/users', (request, response) => {
  User.find({}, (error, arrayOfUsers) => {
    if(!error){
      response.json(arrayOfUsers)
    }
  })
})

// Add exercise session 
app.post('/api/exercise/add', bodyParser.urlencoded({extended: false}), (request, response) => {
  
  let newExerciseItem = new Exercise({
    description: request.body.description,
    duration: parseInt(request.body.duration),
    date: request.body.date
  })
  
  if(newExerciseItem.date === ''){
    newExerciseItem.date = new Date().toISOString().substring(0,10)
  }
  
  User.findByIdAndUpdate(
    request.body.userId,
    {$push: {log: newExerciseItem}},
    {new: true},
    (error, updatedUser) => {
    if(!error){
      let responseObject = {}
      responseObject['_id'] = updatedUser.id
      responseObject['username'] = updatedUser.username
      responseObject['description'] = newExerciseItem.description
      responseObject['duration'] = newExerciseItem.duration
      responseObject['date'] = new Date(newExerciseItem.date).toDateString()
      response.json(responseObject)
    }
  })
})

// Retrieve a User's Log
app.get('/api/exercise/log', (request, response) => {
  User.findById(request.query.userId, (error, result) => {
    if(!error){
      let responseObject = result
	//		result['count'] = result.log.length
  //    response.json(result)
  //  }
    // Count Limit 

//Date Filter
    if(request.query.from || request.query.to){
      let fromDate = new Date(0)
      let toDate = new Date()
  
  if(request.query.from){
    fromDate = new Date(request.query.from)
  }
  
  if(request.query.to){
    toDate = new Date(request.query.to)
  }
  
  result.log = result.log.filter((exerciseItem) =>{
    let exerciseItemDate = new Date(exerciseItem.date)
    
    return exerciseItemDate.getTime() >= fromDate.getTime()
      && exerciseItemDate.getTime() <= toDate.getTime()
  })
}
  if(request.query.limit){
  result.log = result.log.slice(0, request.query.limit)
  }

responseObject = responseObject.toJSON()
responseObject['count'] = result.log.length
response.json(result)

  })
})

/*
// 3rd Attempt


const exerciseSchema = new Schema ({
    username: {
        type: String, 
        required: true 
    },
    exercise: [{
        description: {type: String, required: true },
        duration: {type: Number, required: true },
        date: {type: String, required: true }
    }]
},{
    timestamps:true,
});

const exerciseModel = mongoose.model('exerciseModel', exerciseSchema);

app.post('/api/exercise/new-user', (req, res) => {
	let username = req.body.username;

	exerciseModel.findOne({ username: username }, (err, name) => {
		if (err) return err;

		if (name) res.send('Username already taken')
		else {
			const exerciseData = new exerciseModel({
				username,
				count:0,
				exercise: []
			});

			exerciseData.save()
				.then((data) => {
					res.json({
						username: data.username,
						_id: data._id
					})
				}).catch(err => res.status(400).json('Error' + err));
		}
	});

});


app.get('/api/exercise/users', (req, res) => {

	exerciseModel.find()
		.then((data) => {
			res.send(data);

		});
});



app.post('/api/exercise/add', (req, res) => {
  const exerciseForm = req.body;

  let momentDate = moment().format('ddd MMM DD YYYY').toString()

  if(exerciseForm.date === '') exerciseForm.date = momentDate;
  else exerciseForm.date =  moment(exerciseForm.date).format('ddd MMM DD YYYY').toString();

  const exerciseData = {
    description: exerciseForm.description,
    duration: exerciseForm.duration,
    date: exerciseForm.date
  }

  exerciseModel.updateOne(
    { _id: exerciseForm.userId },
    { $push: { exercise: exerciseData } },
  ).then(()=>{
    exerciseModel.findOne({ _id: exerciseForm.userId },(err, data)=>{
      if(err) res.json(err)

      let bindData = data.exercise[data.exercise.length - 1];

      let bindDataToObject = {
        username:data.username,
        description: bindData.description,
        duration: bindData.duration,
        _id: data._id,
        date: bindData.date
      }
      
      res.json(bindDataToObject);
    })
  })

})





app.get('/api/exercise/log', (req, res) => {
  let { userId } = req.query;
  let limit = Number(req.query.limit);
  let from =  moment(req.query.from).format('ddd MMM DD YYYY').toString();
  let to = moment(req.query.to).format('ddd MMM DD YYYY').toString();

exerciseModel.findOne({_id: userId }, (err, person) => {
  if(err) return err;
  if(person) {
		let arr = [];
		arr.push(person.exercise)

    let userData = {
      _id: person._id,
      username: person.username,
      count: arr.length,
			log: arr
    }

    res.json(userData)

  }
})

});

*/





/*
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
  })
})

app.get('/api/exercise/log', (req, res) => {

//  const {userId, from, to, limit} = req.query;

userModel.findById(req.query.userId, (err, result) => {
  if (!err) {
    let resObject = result

//    resObject['count']= result.log.length
//    res.json(resObject)

  if (req.query.from || req.query.to) {
      let fromDate = new Date(0)
      let toDate = new Date()

    if (req.query.from) {
      fromDate = new Date(req.query.from)
    }

    if (req.query.to) {
      toDate = new Date(req.query.to)
    }

    fromDate = fromDate.getTime()
    toDate = toDate.getTime()
    
    resObject.log = resObject.log.filter((session) => {
      let sessionDate = new Date(session.date).getTime()

      return sessionDate >= fromDate && sessionDate <= toDate 
    })
  }
    if(req.query.limit) {
      resObject.log = resObject.log.slice(0, req.query.limit)
    }
  
  resObject['count']= result.log.length
  res.json(resObject)
  }
  })
})

*/

/*

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

*/

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


