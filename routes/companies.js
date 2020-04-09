const express = require("express");
const db = require("../db");

const router = new express.Router;


router.get("/", async function(req, res, next) {
  try {
    const results = await db.query(
                      `SELECT code, name
                      FROM companies`);
    return res.json({"companies" : results.rows});
  }
  catch(err){
    next(err)
  }
});

router.get("/:code", async function(req, res, next) {
  try {
    const code = req.params.code;
    const results = await db.query(
                      `SELECT code, name, description
                      FROM companies
                      WHERE code=$1`, [code]);
    return res.json({"company" : results.rows[0]});
  }
  catch(err){
    next(err)
  }
});

router.post("/", async function(req, res, next) {
  try {
    const code = req.body.code;
    const name = req.body.name;
    const description = req.body.description;
    console.log(req.body.description, "Right here /n/n/n/n/");

    const results = await db.query(
                      `INSERT INTO companies (code, name, description) 
                       VALUES ($1, $2, $3)
                       RETURNING code, name, description`,
                       [code, name, description]);

    return res.json({"company" : results.rows[0]});
  }
  catch(err){
    next(err)
  }
});

router.put("/:code", async function(req, res, next) {
  try {
    const code = req.params.code;
    const newName = req.body.name;
    const newDescription = req.body.description;
    const newCode = req.body.code;

    const originalRecord = db.query(
                            `SELECT * 
                            FROM companies
                            WHERE code=$1`, 
                            [code])
    
    if originalRecord.length = 0 throw 
              
    newName = newName ? newName : originalRecord.name;
    newCode = newCode ? newCode : originalRecord.code;
    newDescription = newDescription ? newName : originalRecord.description;

    console.log(req.body.description, "Right here /n/n/n/n/");

    const results = await db.query(
                      `UPDATE companies (code, name, description) 
                       VALUES ($1, $2, $3)
                       RETURNING code, name, description`,
                       [code, name, description]);

    return res.json({"company" : results.rows[0]});
  }
  catch(err){
    next(err)
  }
});



module.exports = router;