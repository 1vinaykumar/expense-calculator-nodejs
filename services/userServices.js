const jwt = require("jsonwebtoken");
const Joi = require("joi");

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

const sourceValidation = (body) =>
  Joi.object({
    name: Joi.string().required().min(3),
    description: Joi.string().min(5).max(1000),
    amount: Joi.number().required(),
    timeStamp: Joi.date(),
    sourceType: Joi.number().min(-1).max(1).required(),
  }).validate(body);

const setAmounts = (user) => {
  user.available = 0;
  user.moneyFrom = 0;
  user.moneyTo = 0;
  user.net = 0;
  user.moneySources.forEach((data) => {
    if (data.sourceType === 0) {
      user.available += data.amount;
      user.net += data.amount;
    } else if (data.sourceType === 1) {
      user.moneyFrom += data.amount;
      user.net += data.amount;
    } else if (data.sourceType === -1) {
      user.moneyTo += data.amount;
      user.net -= data.amount;
    }
  });

  return user;
};

const authentication = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.PASSWORD_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    return res.sendStatus(401);
  }
};

module.exports = {
  userValidation,
  sourceValidation,
  setAmounts,
  authentication,
};
