// CREATE biztime_test DB and seed with data_test.sql FIRST!

// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
  let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('test', 'testName', 'testDescription')
      RETURNING code, name, description`);
  testCompany = result.rows[0];
});

afterEach(async function () {
  // delete any data created by test
  await db.query("DELETE FROM companies");
});

afterAll(async function () {
  // close db connection
  await db.end();
});

/** GET /companies - returns `{companies: [company, ...]}` */

describe("GET /companies", function () {
  test("Gets a list of 1 company", async function () {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      companies: [{ code: testCompany.code, name: testCompany.name }],
    });
  });
});

/** GET /companies/[code] - return data about one company: `{company: company}` */

describe("GET /companies/:code", function () {
  test("Gets a single company", async function () {
    const response = await request(app).get(`/companies/${testCompany.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {
        code: testCompany.code,
        name: testCompany.name,
        description: testCompany.description,
        invoices: [],
      },
    });
  });

  test("Responds with 404 if can't find company", async function () {
    const response = await request(app).get(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});

/** POST /companies - create company from data; return `{company: company}` */

describe("POST /companies", function () {
  test("Creates a new company", async function () {
    const testCompany2 = {
      code: "test2",
      name: "testName2",
      description: "testDescription2",
    };
    const response = await request(app).post(`/companies`).send(testCompany2);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({ company: testCompany2 });
  });
});

/** PUT /companies/[code] - update company; return `{company: company}` */

describe("PUT /companies/:code", function () {
  test("Updates a single company", async function () {
    const testCompanyChanged = {
      code: testCompany.code,
      name: "testNameChanged",
      description: testCompany.description,
    };

    const response = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({
        name: "testNameChanged",
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ company: testCompanyChanged });
  });

  test("Responds with 404 if can't find company", async function () {
    const response = await request(app).put(`/companies/0`);
    expect(response.statusCode).toEqual(404);
  });
});

/** DELETE /companies/[code] - delete company,
 *  return `{message: "Company deleted"}` */

describe("DELETE /companies/:code", function () {
  test("Deletes a single a company", async function () {
    const response = await request(app).delete(
      `/companies/${testCompany.code}`
    );
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
    const results = await db.query(
      `SELECT code, name
       FROM companies`
    );
    expect(results.rows.length).toEqual(0);
  });
});
