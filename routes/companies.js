const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

const router = new express.Router();

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(
      `SELECT code, name
       FROM companies`
    );
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    const code = req.params.code;
    const companyResults = await db.query(
      `SELECT code, name, description
       FROM companies
       WHERE code=$1`,
      [code]
    );

    if (companyResults.rows.length === 0)
      throw new ExpressError("Not found!", 404);

    const companyDetails = companyResults.rows[0];
    const invoiceResults = await db.query(
      `SELECT id, comp_code, amt, paid, add_date, paid_date
       FROM invoices
       WHERE comp_code=$1`,
      [companyDetails.code]
    );

    const invoiceDetails = invoiceResults.rows;
    companyDetails.invoices = invoiceDetails;

    return res.json({ company: companyDetails });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;

    const slugifiedCode = slugify(code, {
      lower: true,
      strict: true,
      remove: " ",
    });

    const results = await db.query(
      `INSERT INTO companies (code, name, description)
       VALUES ($1, $2, $3)
       RETURNING code, name, description`,
      [slugifiedCode, name, description]
    );

    if (results.rows.length === 0) throw new ExpressError("Not found!", 404);

    return res.status(201).json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:code", async function (req, res, next) {
  try {
    const code = req.params.code;
    let newName = req.body.name;
    let newDescription = req.body.description;

    const originalResults = await db.query(
      `SELECT *
       FROM companies
       WHERE code=$1`,
      [code]
    );

    if (originalResults.rows.length === 0)
      throw new ExpressError("Not found!", 404);

    const originalRecord = originalResults.rows[0];

    newName = newName ? newName : originalRecord.name;
    newDescription = newDescription ? newName : originalRecord.description;

    const results = await db.query(
      `UPDATE companies SET name=$2, description=$3
       WHERE code = $1
       RETURNING code, name, description`,
      [code, newName, newDescription]
    );
    return res.json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:code", async function (req, res, next) {
  try {
    const code = req.params.code;

    const results = await db.query(
      `DELETE
       FROM companies
       WHERE code=$1
       RETURNING code`,
      [code]
    );

    if (results.rows.length === 0) throw new ExpressError("Not found!", 404);

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
