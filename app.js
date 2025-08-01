if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
};

const express=require("express");
const app=express();
const mongoose = require('mongoose');
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");


const listingRouter=require("./routes/listing.js");
const reviewsRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL;

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store= MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
    secret:process.env.SECRET,
  },
  touchAfter:24 * 3600,
});

store.on("error",()=>{
  console.log("Some Error In MOngo Store Session",err)
});

const sessionOption={
  store,
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge:7 * 24 * 60 * 60 * 1000,
    httpOnly:true,
  },
};


app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.currUser=req.user;
  next();
});


//ADD NEW FAKE USER 
// app.get("/demoUser",async (req,res)=>{
//   let fakeUser=new User({
//     email:"ak@gmail.com",
//     username:"ak",
//   });
 
//    let result= await User.register(fakeUser,"ak@123");
//    res.send(result);
// });









app.use("/listings", listingRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);


//  app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });





app.use((req,res,next)=>{
  res.status(404).render("listings/error.ejs");
});

app.use((err,req,res,next)=>{
  let {statusCode=500,message="Something went wrong!!"}=err;
  // res.status(statusCode).send(message);
  res.status(statusCode).render("error.ejs",{message});
});

app.listen(8080,()=>{
    console.log("listing a port 8080");
});

main()
.then(()=>{
    console.log("working DB");
}).catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}