"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filterBy = [], vals = []) {
    let whereQuery;
    let invalidFilters = [];
    // if there are arguments to filter by, we add these parameters to the query
    if (filterBy.length > 0) {
      whereQuery = "WHERE ";
      // empty array to store query segments for each filter
      let whereQueryArgs = [];
      // filters to check
      let validFilters = ["minEmployees", "maxEmployees", "name"];

      // loop over filters and add them to the whereQueryArgs
      for (let i = 0; i <= filterBy.length - 1; i++) {
        if (filterBy[i] === "minEmployees") {
          whereQueryArgs.push(`num_employees >= ${vals[i]}`);
        } else if (filterBy[i] === "maxEmployees") {
          whereQueryArgs.push(`num_employees <= ${vals[i]}`);
        } else if (filterBy[i] === "name") {
          whereQueryArgs.push(`name ILIKE '%${vals[i]}%'`);
        } else if (validFilters.includes(filterBy[i]) === false) {
          invalidFilters.push(filterBy[i]);
        }
      }
      // join the query together
      whereQuery = whereQuery + whereQueryArgs.join(" AND ");
    } else {
      // if there are no arguments to filter by, we remove the whereQuery by making it an empty string
      whereQuery = "";
    }

    if (invalidFilters.length > 0) {
      invalidFilters = invalidFilters.join(", ");
      throw new ExpressError(
        `${invalidFilters} are invalid filter queries.`,
        400
      );
    }

    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ${whereQuery}
           ORDER BY name`
    );

    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl"
           FROM companies AS c
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    const jobsRes = await db.query(
      `SELECT j.id, j.title, j.salary, j.equity
        FROM jobs as j
        WHERE company_handle = $1`,
      [handle]
    );

    const companyWithJobs = {
      handle: company.handle,
      name: company.name,
      description: company.description,
      numEmployees: company.numEmployees,
      logoUrl: company.logoUrl,
      jobs: jobsRes.rows,
    };
    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return companyWithJobs;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);
    console.log(setCols, values);
    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
