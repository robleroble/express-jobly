"use strict";

const bodyParser = require("body-parser");
const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  /**Creates a job (from data), updates db, returns new job data.
   *
   * data should be {title, salary, equity, company_handle}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   */

  static async create({ title, salary, equity, company_handle }) {
    // Need to check if company exists - can't create job if there is no company
    const companyResult = await db.query(
      `SELECT *
        FROM companies
        WHERE handle = $1`,
      [company_handle]
    );

    if (companyResult.rows.length === 0) {
      throw new ExpressError(
        `Company with handle of ${company_handle} doesn't exist.`
      );
    }

    const result = await db.query(
      `INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];
    return job;
  }

  /** Find all jobs.
   *
   * Returns [{id, title, salary, equity, company_handle}, ...]
   *
   * Can filter by: title, minSalary, hasEquity (true/false)
   */
  static async findAll(searchFilters = {}) {
    const { title, minSalary, hasEquity } = searchFilters;
    let whereQuery = "";
    let queryArgs = [];

    if (title) {
      queryArgs.push(`title ILIKE '%${title}%'`);
    }
    if (minSalary) {
      queryArgs.push(`salary >= ${minSalary}`);
    }
    if (hasEquity) {
      queryArgs.push(`equity > 0`);
    }

    // join wherequery arguments together
    if (queryArgs.length > 0) {
      whereQuery = "WHERE " + queryArgs.join(" AND ");
    }

    const jobs = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "company_handle"
					FROM jobs
					${whereQuery}
					ORDER BY id`
    );

    return jobs.rows;
  }

  /** Get data on one company given an ID
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found
   */
  static async get(id) {
    const jobResult = await db.query(
      `SELECT *
				FROM jobs
				WHERE id = $1`,
      [id]
    );

    const job = jobResult.rows[0];
    if (!job) throw new NotFoundError(`No job with id of: ${id}`);

    return job;
  }

  /**Update job with id
   *
   * data can include title, salary, equity (can't change company or id itself)
   *
   * returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                            SET ${setCols}
                            WHERE id = ${idVarIdx}
                            RETURNING id, title, salary, equity, company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id of: ${id}`);

    return job;
  }

  /** Delete job from DB, returns undefined
   *
   * Throws NotFoundError if job not found
   */

  static async remove(id) {
    const result = await db.query(
      `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
      [id]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job with id of: ${id}`);
  }
}

module.exports = Job;
