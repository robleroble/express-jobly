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
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

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
  });
});

// describe("POST /jobs", function () {
//   test("ok for admin", async function () {
//     const resp = await request(app)
//       .post(`/jobs`)
//       .send({
//         company_handle: "c1",
//         title: "J-new",
//         salary: 10,
//         equity: 0.2,
//       })
//       .set("authorization", `Bearer ${u1Token}`);
//     // expect(resp.statusCode).toEqual(201);
//     expect(resp.body).toEqual({
//       job: {
//         id: expect.any(Number),
//         title: "J-new",
//         salary: 10,
//         equity: "0.2",
//         company_handle: "c1",
//       },
//     });
//   });
// });
