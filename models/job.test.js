"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

////////////////////////
// test create new job

describe("create", function () {
  const newJob = {
    title: "newJob",
    salary: 69420,
    equity: 0.02,
    company_handle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      title: "newJob",
      salary: 69420,
      equity: "0.02",
      company_handle: "c1",
      id: expect.any(Number),
    });
  });
});

///////////////////////
// test findAll()

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    console.log(jobs);

    expect(jobs).toEqual([]);
  });
});
