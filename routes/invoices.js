const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");

const router = new express.Router();

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(
      `SELECT id, comp_code
       FROM invoices`
    );
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const invoiceResults = await db.query(
      `SELECT id, comp_code, amt, paid, add_date, paid_date
       FROM invoices
       WHERE id=$1`,
      [id]
    );

    if (invoiceResults.rows.length === 0)
      throw new ExpressError("Not found!", 404);

    const invoiceDetails = invoiceResults.rows[0];

    const companyResults = await db.query(
      `SELECT code, name, description
       FROM companies
       WHERE code=$1`,
      [invoiceDetails.comp_code]
    );

    const companyDetails = companyResults.rows[0];

    return res.json({ invoice: invoiceDetails, company: companyDetails });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { comp_code, amt } = req.body;

    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt)
       VALUES ($1, $2)
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    if (results.rows.length === 0) throw new ExpressError("Not found!", 404);

    return res.status(201).json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    const id = req.params.id;
    const { amt } = req.body;

    const results = await db.query(
      `UPDATE invoices SET amt = $2
       WHERE id = $1
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [id, amt]
    );

    if (results.rows.length === 0) throw new ExpressError("Not found!", 404);

    return res.json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    const id = req.params.id;

    const results = await db.query(
      `DELETE
       FROM invoices
       WHERE id=$1
       RETURNING id`,
      [id]
    );

    if (results.rows.length === 0) throw new ExpressError("Not found!", 404);

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
