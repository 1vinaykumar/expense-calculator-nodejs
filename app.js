const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./routes/users").router;
const sourceRouter = require("./routes/sources");
const app = express();

app.use(
  cors({
    origin: ["https://ec-dvk.web.app"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());

app.use("/users", userRouter);

app.use("/users", sourceRouter);

app.listen(process.env.PORT || 5000, () => {
  console.log("Application running at PORT " + process.env.PORT);
  mongoose
    .connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    .then(() => {
      console.log("Database connection successful");
    })
    .catch((error) => console.log("Database connection failed"));
});
