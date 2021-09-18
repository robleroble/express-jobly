"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

////////////////////
// u1 is admin
// u2 is regular user
////////////////////

describe("POST /jobs", function () {
  const newJob = {
    title: "newJob",
    salary: 69420,
    equity: 0.02,
    company_handle: "c1",
  };

  test("works for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "newJob",
        salary: 69420,
        equity: "0.02",
        company_handle: "c1",
      },
    });
  });

  test("fails for regular user", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new job",
        salary: 101010,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "newJob",
        salary: "69420",
        equity: 0.02,
        company_handle: "c1",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

///////////////////////////////
// Get all jobs

describe("GET /jobs", function () {
  test("okay for anonymous user", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job1",
          salary: 999,
          equity: "0",
          company_handle: "c1",
        },
        {
          id: expect.any(Number),
          title: "job2",
          salary: 1999,
          equity: "0.02",
          company_handle: "c2",
        },
        {
          id: expect.any(Number),
          title: "job3",
          salary: 2999,
          equity: "0.02",
          company_handle: "c2",
        },
      ],
    });
  });

  test("gets job by title", async function () {
    const resp = await request(app).get("/jobs?title=1");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job1",
          salary: 999,
          equity: "0",
          company_handle: "c1",
        },
      ],
    });
  });

  test("gets job by multiple filters and ignores bad filters", async function () {
    const resp = await request(app).get("/jobs?minSalary=100&hasEquity=true");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job2",
          salary: 1999,
          equity: "0.02",
          company_handle: "c2",
        },
        {
          id: expect.any(Number),
          title: "job3",
          salary: 2999,
          equity: "0.02",
          company_handle: "c2",
        },
      ],
    });
  });
});

///////////////////////////
// GET /jobs/:id

describe("GET /jobs/:id", function () {
  test("works for anonymous user", async function () {
    const testId = testJobIds[0];
    const resp = await request(app).get(`/jobs/${testId}`);
    expect(resp.body).toEqual({
      job: {
        id: testId,
        title: "job1",
        salary: 999,
        equity: "0",
        company_handle: "c1",
      },
    });
  });

  test("job not found", async function () {
    const resp = await request(app).get("/jobs/001");
    expect(resp.statusCode).toEqual(404);
  });
});

////////////////////////////
// PATCH /jobs/:id

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const testId = testJobIds[0];
    const resp = await request(app)
      .patch(`/jobs/${testId}`)
      .send({
        title: "edited job",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: testId,
        title: "edited job",
        salary: 999,
        equity: "0",
        company_handle: "c1",
      },
    });
  });

  test("does not work for regular users", async function () {
    const testId = testJobIds[0];
    const resp = await request(app)
      .patch(`/jobs/${testId}`)
      .send({
        title: "edited job",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("does not work for anonymous users", async function () {
    const testId = testJobIds[0];
    const resp = await request(app).patch(`/jobs/${testId}`).send({
      title: "edited job",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("job not found", async function () {
    const resp = await request(app)
      .patch(`/jobs/11`)
      .send({
        title: "edited job",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on attempt to change company_handle", async function () {
    const testId = testJobIds[0];

    const resp = await request(app)
      .patch(`/jobs/${testId}`)
      .send({
        company_handle: "edited-job",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const testId = testJobIds[0];

    const resp = await request(app)
      .patch(`/jobs/${testId}`)
      .send({
        title: 9999,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

//////////////////////
// DELETE /jobs/:id

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const testId = testJobIds[0];

    const resp = await request(app)
      .delete(`/jobs/${testId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${testId}` });
  });

  test("unauth for non-admin users", async function () {
    const testId = testJobIds[0];

    const resp = await request(app)
      .delete(`/jobs/${testId}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anonymous users", async function () {
    const testId = testJobIds[0];

    const resp = await request(app).delete(`/jobs/${testId}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("job not found", async function () {
    const resp = await request(app)
      .delete(`/jobs/000`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
