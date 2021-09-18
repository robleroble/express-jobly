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
const { findAll } = require("./user.js");

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

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Job1",
        salary: 100,
        equity: "0.1",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Job2",
        salary: 200,
        equity: "0.2",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Job3",
        salary: 300,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Job4",
        salary: null,
        equity: null,
        company_handle: "c1",
      },
    ]);
  });

  test("gets job by title", async function () {
    const jobByTitle = await Job.findAll({ title: "4" });
    expect(jobByTitle).toEqual([
      {
        id: expect.any(Number),
        title: "Job4",
        salary: null,
        equity: null,
        company_handle: "c1",
      },
    ]);
  });

  test("get jobs with multiple filters and ignores invalid filters (company_handle)", async function () {
    const jobsByFilters = await Job.findAll({
      minSalary: 99,
      hasEquity: true,
      company_handle: "a33",
    });
    expect(jobsByFilters).toEqual([
      {
        id: expect.any(Number),
        title: "Job1",
        salary: 100,
        equity: "0.1",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Job2",
        salary: 200,
        equity: "0.2",
        company_handle: "c1",
      },
    ]);
  });
});

////////////////////////////////
// Test get single job model

describe("get", function () {
  test("works", async function () {
    // get one job by title to get its ID
    let jobByTitle = await Job.findAll({ title: "Job1" });

    let singleJob = await Job.get(jobByTitle[0].id);

    expect(singleJob).toEqual({
      id: jobByTitle[0].id,
      title: "Job1",
      salary: 100,
      equity: "0.1",
      company_handle: "c1",
    });
  });

  test("not found if no id", async function () {
    try {
      await Job.get(2);
      findAll();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

///////////////////////////////////
// Test Job model update

describe("update", function () {
  const updateData = {
    title: "Accountant",
    salary: 99999,
    equity: 0,
  };

  test("works", async function () {
    // get one job by title to get its ID
    let jobByTitle = await Job.findAll({ title: "Job1" });
    const testJobId = jobByTitle[0].id;
    let job = await Job.update(testJobId, updateData);
    expect(job).toEqual({
      id: testJobId,
      title: "Accountant",
      salary: 99999,
      equity: "0",
      company_handle: "c1",
    });
  });

  test("not found is no job id", async function () {
    try {
      await Job.update(2, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

////////////////////////////
// test delete()

describe("remove job", function () {
  test("works", async function () {
    // get one job by title to get its ID
    let jobByTitle = await Job.findAll({ title: "Job1" });
    const testJobId = jobByTitle[0].id;
    await Job.remove(testJobId);
    const res = await db.query(`SELECT * FROM jobs WHERE id=${testJobId}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no job with ID", async function () {
    try {
      await Job.remove(2);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
