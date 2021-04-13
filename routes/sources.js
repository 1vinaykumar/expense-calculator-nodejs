const authentication = require("./users").authentication;
const express = require("express");
const router = express.Router();
const Joi = require("joi");

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

router.get("/:userName/sources", authentication, async (req, res) =>
  res.json(req.user.moneySources)
);

router.post("/:userName/sources", authentication, async (req, res) => {
  const validatedData = sourceValidation(req.body);
  if (!validatedData.error) {
    validatedData.value.timeStamp = new Date();
    req.user.moneySources.push(validatedData.value);
    await setAmounts(req.user).save();
    return res.status(201).json(validatedData.value);
  } else {
    return res.status(403).send(validatedData.error.message);
  }
});

router.get("/:userName/sources/:sourceId", authentication, async (req, res) => {
  const source = req.user.moneySources.find(
    (item) => item._id.toString() === req.params.sourceId.toString()
  );
  if (source) {
    return res.json(source);
  } else {
    return res.status(404).send("MoneySource not found");
  }
});

router.put("/:userName/sources/:sourceId", authentication, async (req, res) => {
  const source = req.user.moneySources.find(
    (item) => item._id.toString() === req.params.sourceId.toString()
  );
  if (source) {
    const validatedData = sourceValidation(req.body);

    if (!validatedData.error) {
      validatedData.value._id = source._id;
      req.user.moneySources = await req.user.moneySources.map((item) =>
        item._id === source._id ? validatedData.value : item
      );
      await setAmounts(req.user).save();
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
});

router.delete(
  "/:userName/sources/:sourceId",
  authentication,
  async (req, res) => {
    req.user.moneySources = req.user.moneySources.filter(
      (item) => item._id.toString() !== req.params.sourceId.toString()
    );
    await setAmounts(req.user).save();
    return res.status(200).send("Successfully deleted");
  }
);

module.exports = router;
