const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, 'net ninja secret', (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/login');
      } else {
        console.log(decodedToken);
        next();
      }
    });
  } else {
    res.redirect('/login');
  }
};

// check current user
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, 'net ninja secret', async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decodedToken._id);
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

const isAdmin = (req,res,next)=>{
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, 'net ninja secret', async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        if(decodedToken.isAdmin!==true)
        {
          res.status(403).send({
            isAdmin : false , 
            msg : 'Vous ne pouvez pas acceder '
          })
        }
        else{
          next();

        }
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
  /*if (!req.User.role) {
    return res.status(403).send('You are not admin ');
    
  } else {
    next();
  }*/

}


module.exports = { requireAuth, checkUser , isAdmin};