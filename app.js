// app.js  (CommonJS version)
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); 

const authRouter = require("./routes/auth.route"); 
const courseRouter = require("./routes/course.route");
const enrollmentRouter = require("./routes/enrollment.route");
const attendanceRouter = require("./routes/attendance.route");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend (Vite/React)
    credentials: true,              
  })
);


app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));


app.use("/api/v1", authRouter);
app.use("/api/v1/course",courseRouter);
app.use("/api/v1/enrollment",enrollmentRouter);
app.use("/api/v1/attendance",attendanceRouter);
module.exports = app;