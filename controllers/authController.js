const User = require("../models/User");
const jwt = require('jsonwebtoken');

// handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '' };

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('user validation failed')) {
    // console.log(err);
    Object.values(err.errors).forEach(({ properties }) => {
      // console.log(val);
      // console.log(properties);
      errors[properties.path] = properties.message;
    });
  }

  return errors;
}
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
// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id, isAdmin) => {
  return jwt.sign({ _id : id , isAdmin : isAdmin  }, 'net ninja secret', {
    expiresIn: maxAge
  });
};

// controller actions
module.exports.signup_get = (req, res) => {
  res.render('signup');
}

module.exports.login_get = (req, res) => {
  res.render('login');
}

module.exports.signup_post = async (req, res) => {
  const deleted=0 ;
  const { name, email , role  } = req.body;
  const crypto = require('crypto')

const generatePassword = (
  length = 10,
  wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$'
) =>
  Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join('')
  const password = generatePassword();
  try {
    const user = await User.create({ name, email, password,role,deleted});
    
    const token = createToken(user._id,user.role);
    sendMail(
      email ,
      "Bienvenue dans EsiSwitch",
      "Bonjour, \nMaintenant vous pouvez acceder a notre espace ESiSwitch :\nemail: "+email+"\nmot de passe: "+password
    )
  //  res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json({ user: user._id });
  }
  catch(err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
 
}

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const deleted = user.deleted ; 
    console.log(user.deleted);
    if (deleted) throw err ;
    const token = createToken(user._id,user.role);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } 
  catch (err) {
    if(!err)
    {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
    else
    {
      res.status(400).send( "ce compte est desactive" );
    }
   
  }

}

module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/');
}