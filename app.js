const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser, isAdmin } = require('./middleware/authMiddleware');
const { redirect } = require('express/lib/response');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



const { signup_post } = require('./controllers/authController');
const app = express();

// middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// view engine
app.set('view engine', 'ejs');

// database connection
const dbURI = 'mongodb+srv://EsiSwitch:esi1234@cluster0.h1vs7.mongodb.net/Data?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true })
  .then((result) => {
    console.log("connected");
    app.listen(3000)
  })
  .catch((err) => console.log(err));

// routes
app.get('*', checkUser);
app.get('/', (req, res) => res.render('home'));
app.get('/createuser',requireAuth,isAdmin,(req,res)=>{
  res.send({
    isAdmin : true,
    msg : "Vous pouvez acceder"
  });
}) ; 
app.post('/createuser',requireAuth,isAdmin,signup_post);
app.get('/getusers',requireAuth,isAdmin,async (req,res)=>{
  const users = await User.find().select(["-password"]); 
  res.send(users)
  console.log(users);
})
app.get('/getCurrentUser',requireAuth,(req,res)=>{
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, 'net ninja secret', async (err, decodedToken) => {
      if (err) {
       res.send(null);
      } else {
        let user = await User.findById(decodedToken._id).select(["-password"]);
        res.send(user);
      }
    });
  }
  else
  {
    res.send(null) 

  }
})
app.post('/desactive',requireAuth,isAdmin,async (req,res)=>{
  const user =  await User.updateOne({_id:req.body._id},{
    deleted : true 
  })
  res.send(user)
}
)
app.post('/active',requireAuth,isAdmin,async (req,res)=>{
  const user =  await User.updateOne({_id:req.body._id},{
    deleted : false
  })
  res.send(user)
})
app.post('/modifierPassword',requireAuth,async(req,res)=>{
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash(req.body.password, salt);
  const user = await User.updateOne({_id : req.body._id },{
    password : password
  })
  res.send(user)
})
function sendMail(resiver , subject , text ){
  var nodemailer = require('nodemailer');

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    secure : true , 
    auth: {
      user: 'esiSwitch@gmail.com',
      pass: 'esiswitch2cp'
    }
  });
  var mailOptions = {
    from: 'esiSwitch@gmail.com',
    to: resiver,
    subject: subject,
    text: text
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

app.post('/forgetPassword',async (req,res)=>
{
  const user =User.find({email : req.body.email})
  if(!user)
  {
    res.status(404).send({msg : "ce email n'existe pas "})
  }
  const crypto = require('crypto')

const generatePassword = (
  length = 10,
  wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$'
) =>
  Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join('')

console.log(generatePassword())
const password1 = generatePassword() ; 
const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash(password1, salt);
  const user1 = await User.updateOne({_id : user._id },{
    password : password
  })
  sendMail(
   req.body.email ,
   "Mot de passe oublié ",
   "votre nouvelle mot de passe est :"+password1 
  )
  res.send(user1)


});
module.exports = sendMail ; 
app.use(authRoutes);