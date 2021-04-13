const express = require("express");
const Joi = require("joi");
const User = require("../models/user");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authentication = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.PASSWORD_KEY, async (err, userDetails) => {
      if (err) {
        return res.sendStatus(403);
      }
      if (
        userDetails &&
        req.params.userName &&
        userDetails.userName === req.params.userName
      ) {
        const user = await User.findOne({ userName: req.params.userName });
        if (user) {
          req.user = user;
          next();
        } else {
          return res
            .status(404)
            .send(`User with user name ${req.params.userName} Not Found`);
        }
      } else {
        return res
          .status(404)
          .send(
            `Requsted user(${req.params.userName}) is different from Logged in user`
          );
      }
    });
  } else return res.sendStatus(401);
};

const userValidation = (body) =>
  Joi.object({
    userName: Joi.string().alphanum().required().min(5).max(20),
    password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
    name: Joi.string().required().min(5).max(60),
    createdDate: Joi.date(),
    available: Joi.number().required(),
    moneyTo: Joi.number().required(),
    moneyFrom: Joi.number().required(),
    net: Joi.number().required(),
    moneySources: Joi.array(),
  }).validate(body);

router.post("/", async (req, res) => {
  const validatedData = userValidation(req.body);
  if (!validatedData.error) {
    validatedData.value = {
      ...validatedData.value,
      createdDate: new Date(),
      moneyFrom: 0,
      moneyTo: 0,
      net: 0,
      available: 0,
      moneySources: [],
    };
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(validatedData.value.password, salt);
    validatedData.value.password = hashed;
    const user = await User.create(validatedData.value);
    user.password = "";
    delete user.password;
    return res
      .status(201)
      .location(req.originalUrl + "/" + user.userName)
      .json(user);
  } else {
    return res.status(403).send("Invalid details format");
  }
});

router.post("/login/:userName", async (req, res) => {
  const user = await User.findOne({ userName: req.params.userName });
  if (user) {
    const validatedData = Joi.object({
      userName: Joi.string().required().min(5).max(20),
      password: Joi.string().required(),
    }).validate(req.body);
    const passwordValid = await bcrypt.compare(
      validatedData.value.password,
      user.password
    );
    if (passwordValid) {
      const token = jwt.sign(
        { userName: user.userName },
        process.env.PASSWORD_KEY
      );
      return res.json(token);
    } else {
      return res.status(401).send("Invalid Credentials");
    }
  } else {
    return res.status(401).send("User not found");
  }
});

router.get("/:userName", authentication, async (req, res) => {
  req.user.password = "";
  return res.json(req.user);
});

router.delete("/:userName", authentication, async (req, res) => {
  req.user.delete();
  return res.json(req.user);
});

module.exports = {
  router,
  authentication,
};
