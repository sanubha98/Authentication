//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const ejs = require('ejs');
const port = 3000;
const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
const userSchema = new mongoose.Schema({
  email : String,
  password: String
});

const secret = "ThisIsMySecret..";
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]})

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res){
  res.render("home");
});

app.get("/login", function (req, res){
  res.render("login");
});

app.get("/register", function (req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  const user = new User({
    email : req.body.username,
    password : req.body.password
  })
  user.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("secrets");
    }
  })
});

app.post("/login", function(req, res){
  User.findOne({email: req.body.username}, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if(foundUser.password === req.body.password){
          res.render("secrets")
        }
      }
    }
  })
})

app.listen(port, function(){
  console.log("Server started");
});
