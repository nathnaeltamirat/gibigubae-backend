// app.js  (CommonJS version)
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); 

const authRouter = require("./routes/auth.route"); 
const courseRouter = require("./routes/course.route");
const enrollmentRouter = require("./routes/enrollment.route");
const attendanceRouter = require("./routes/attendance.route");
const studentRouter = require("./routes/student.route");
const analyticsRouter = require("./routes/analytics.route");

const cron = require('node-cron');
const adminRouter = require("./routes/adminRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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
app.use("/api/v1/student",studentRouter);
app.use("/api/v1/admin", adminRouter)

app.use("/api/v1/analytics",analyticsRouter);

module.exports = app;