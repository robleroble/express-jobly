const { json } = require("body-parser");
const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate tests", function () {
  test("returns sql for inputed data of user class", function () {
    const bodyData = {
      firstName: "nick",
      lastName: "sande",
      isAdmin: true,
    };

    const jsToSqlData = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };

    const { setCols, values } = sqlForPartialUpdate(bodyData, jsToSqlData);

    expect(setCols).toEqual(`"first_name"=$1, "last_name"=$2, "is_admin"=$3`);
    expect(values).toEqual(["nick", "sande", true]);
  });

  test("returns error if there is no data to update", function () {
    const bodyData = {};
    const jsToSqlData = {
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
    };

    expect(() => sqlForPartialUpdate(bodyData, jsToSqlData)).toThrow(
      BadRequestError
    );
  });
});
