'use strict';
require('dotenv').config();
const express = require('express');
const app = express();
app.get('/report', (req, res) => { if (!res.headersSent) console.log("success");res.end() });
module.exports = app;
