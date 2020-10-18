"use strict";

const express = require("express");
const {google} = require('googleapis');
const calendar = google.calendar('v3');
// const multer = require("multer");
const request = require("request");
const {Pool} = require('pg');
require('dotenv').config();
const app = express();

const INVALID_PARAM_ERROR = 400;
const SERVER_ERROR = 500;
const SERVER_ERROR_MSG = "Something went wrong on the server, please try again later.";
const pool = new Pool({
  ssl: {
    rejectUnauthorized: false
  },
  connectionString: process.env.DATABASE_URL
});

app.get("/getAccounts", async function(req, res) {
  try {
    console.log("before query");
    let accounts = await pgQuery("SELECT * FROM accounts;", []);
    console.log("after query");
    let accountsJSON = JSON.parse(accounts);
    console.log("after parse");
    console.log(accountsJSON);
    res.json(accountsJSON);
  } catch (error) {
    res.status(SERVER_ERROR).json({error: SERVER_ERROR_MSG});
  }
});

app.get("/getToken", async function(req, res) {
  try {
    if (req.query.authorizationCode) {
      let options = {
        method: 'POST',
        json: true,
        body: {
          client_id: '305202964565-8qf7cn9jrj25j5u7i0u09aadg2e6alk9.apps.googleusercontent.com',
          client_secret: process.env.CLIENT_SECRET,
          redirect_uri: 'https://walendar.herokuapp.com/authorization.html',
          grant_type: 'authorization_code',
          code: req.query.authorizationCode
        },
        url: 'https://oauth2.googleapis.com/token'
      };
      await request(options, async function(error, response, body) {
        if (error) {
          console.log(error);
          throw new Error(error);
        }
        console.log(body);
        // if (resp.access_token !== undefined && resp.refresh_token !== undefined) {

        // } else {
        //   throw new Error("Invalid access or refresh tokens returned");
        // }
        res.json(body);
      });
    }
  } catch (error) {
    res.status(SERVER_ERROR).json({"error": SERVER_ERROR_MSG});
  }
});

app.get("/getCalendar", async function(req, res) {
  try {
    let options = {
      method: 'GET',
      url: 'https://www.googleapis.com/calendar/v3/calendars/primary'
    };
    await request(options, async function(error, response, body) {
      if (error) {
        console.log(error);
        throw new Error(error);
      }
      let resp = JSON.parse(body);
      console.log(resp);
      // if (resp.access_token !== undefined && resp.refresh_token !== undefined) {

      // } else {
      //   throw new Error("Invalid access or refresh tokens returned");
      // }
      res.json({"data": resp});
    });
  } catch (error) {
    res.status(SERVER_ERROR).json({"error": SERVER_ERROR_MSG});
  }
});

// ----------------------- SQL QUERY FUNCTIONS -----------------------

/**
 * Executes the given query with the given parameters
 * @param {String} qry SQL syntax to be executed
 * @param {String[]} param Array of parameters for the query
 */
async function pgQuery(qry, param) {
  console.log("before connection");
  let client = await pool.connect();
  console.log("after connection");
  try {
    let res = await client.query(qry, param);
    return res.rows;
  } catch (error) {
    console.log(error);
  } finally {
    client.release();
  }
}

app.use(express.static("front-end"));
const PORT = process.env.PORT || 8000;
app.listen(PORT);