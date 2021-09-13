const { BadRequestError } = require("../expressError");

/**
 * Creates segments of sql query in order to update data
 *
 * takes an object with key:value pairs and loops over them with two resulting vars: setCols and values
 *
 * EG: req.body for users may be: {firstName: "first", lastName: last, isAdmin: true}
 *
 * first checks to see if there is actual data to update by checking if there are any keys in the data
 *
 * Then maps over each key, creating sql segments (EG: first_name=$1, last_name=$2, etc.)
 *
 * data that can be updated is provided in jsToSql input
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
