//jshint esversion:6
require('dotenv').config(); // environment variables
const port = 3000;
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');   // hashing
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "My Secret..",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secret.
    res.redirect("/secrets");
  });

app.get("/secrets", function(req, res) {
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login")
  }
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
})

app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register")
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets")
      })
    }
  });
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets")
      })
    }
  });
});

////////////////////// For Brcypt /////////////////////////////////////////////////////////////

// app.post("/register", function(req, res){
//   bcrypt.hash(req.body.password, saltRounds, function(err,hash){
//     const user = new User({
//       email: req.body.username,
//       password: hash
//     })
//     user.save(function(err){
//       if(err){
//         console.log(err);
//       }else{
//         res.render("secrets");
//       }
//     })
//   })
// });
//
// app.post("/login", function(req, res){
//   User.findOne({email: req.body.username}, function(err, foundUser){
//     if(err){
//       console.log(err);
//     }else{
//       if(foundUser){
//         bcrypt.compare(req.body.password, foundUser.password, function(err, result){
//           if(result == true){
//             res.render("secrets");
//           }
//         })
//       }
//     }
//   })
// })

app.listen(port, function() {
  console.log("Server started");
});
