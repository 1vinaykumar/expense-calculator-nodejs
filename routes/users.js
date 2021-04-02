const express = require("express");
const Joi = require("joi");
const User = require("../models/user");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  userValidation,
  sourceValidation,
  setAmounts,
  authentication,
} = require("../services/userServices");

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
    return res.status(401).send("Invalid Credentials");
  }
});

// router.get("/", async (req, res) => {
//   const users = await User.find();
//   return res.json(users);
// });

router.post("/", async (req, res) => {
  const validatedData = userValidation(req.body);
  if (!validatedData.error) {
    validatedData.value.createdDate = new Date();
    validatedData.value.moneyFrom = 0;
    validatedData.value.moneyTo = 0;
    validatedData.value.net = 0;
    validatedData.value.available = 0;
    validatedData.value.moneySources = [];
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(validatedData.value.password, salt);
    validatedData.value.password = hashed;
    const user = await User.create(validatedData.value);
    user.password = "";
    return res
      .status(201)
      .location(req.originalUrl + "/" + user.userName)
      .json(user);
  } else {
    return res.status(403).send("Invalid User Details");
  }
});

const getUser = async (req, res) => {
  if (req.user && req.user.userName === req.params.userName) {
    const user = await User.findOne({ userName: req.params.userName });
    if (user) {
      return user;
    } else {
      res
        .status(404)
        .send(`User with user name ${req.params.userName} Not Found`);
      return;
    }
  } else {
    res
      .status(404)
      .send(
        `Requsted user(${
          req.params.userName
        }) is different from Logged in user(${
          req.user ? req.user.userName : ""
        })`
      );
    return;
  }
};

router.get("/:userName", authentication, async (req, res) => {
  const user = await getUser(req, res);

  if (user) {
    user.password = "";
    return res.json(user);
  }
});

router.delete("/:userName", authentication, async (req, res) => {
  const user = await User.findOne({ userName: req.params.userName });
  if (user) {
    user.delete();
    return res.json(user);
  } else {
    return res.status(404).send("User Not Found");
  }
});

router.get("/:userName/sources", authentication, async (req, res) => {
  const user = await getUser(req, res);
  if (user) {
    return res.json(user.moneySources);
  }
});

router.post("/:userName/sources", authentication, async (req, res) => {
  const user = await getUser(req, res);
  if (user) {
    const validatedData = sourceValidation(req.body);
    if (!validatedData.error) {
      validatedData.value.timeStamp = new Date();
      user.moneySources.push(validatedData.value);
      await setAmounts(user).save();
      return res.status(201).json(validatedData.value);
    } else {
      return res.status(403).send(validatedData.error.message);
    }
  }
});

router.get("/:userName/sources/:sourceId", authentication, async (req, res) => {
  const user = await getUser(req, res);
  if (user) {
    const source = user.moneySources.find(
      (item) => item._id.toString() === req.params.sourceId.toString()
    );
    if (source) {
      return res.json(source);
    } else {
      return res.status(404).send("MoneySource not found");
    }
  }
});

router.put("/:userName/sources/:sourceId", authentication, async (req, res) => {
  const user = await getUser(req, res);
  if (user) {
    const source = user.moneySources.find(
      (item) => item._id.toString() === req.params.sourceId.toString()
    );
    if (source) {
      const validatedData = sourceValidation(req.body);

      if (!validatedData.error) {
        validatedData.value._id = source._id;
        user.moneySources = await user.moneySources.map((item) =>
          item._id === source._id ? validatedData.value : item
        );
        await setAmounts(user).save();
        return res
          .status(200)
          .location(req.baseUrl + "/" + validatedData.value._id)
          .json(validatedData.value);
      } else {
        return res.status(403).send(validatedData.error.message);
      }
    } else {
      return res.status(404).send("MoneySource not found");
    }
  }
});

router.delete(
  "/:userName/sources/:sourceId",
  authentication,
  async (req, res) => {
    const user = await getUser(req, res);
    if (user) {
      user.moneySources = user.moneySources.filter(
        (item) => item._id.toString() !== req.params.sourceId.toString()
      );
      await setAmounts(user).save();
      return res.status(200).send("Successfully deleted");
    }
  }
);

module.exports = router;
