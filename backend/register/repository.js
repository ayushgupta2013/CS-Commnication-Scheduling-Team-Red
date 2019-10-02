module.exports = function(mysql) {

  function findUserByCWID(cwid) {
    return new Promise(function(resolve, reject){
        mysql.query(`SELECT * FROM Login WHERE cwid='${cwid}'`, function(err, rows){
            if (err) {reject(err);return;}
            if (!rows.length) { resolve(null); return;}//user with cwid not found
            resolve(toUserDomain(rows[0]));
        });
    });
  }


  function createUser({cwid, username, email, password, fname, lname, loginToken, userType}) {
    return new Promise(function(resolve, reject){
        const signupOtpVerified = false;
        const queryString = `INSERT INTO Login (cwid, fname, lname, username, email, password, loginToken, signupOtpVerified, userType) VALUES ('${cwid}','${fname}','${lname}','${username}','${email}','${password}','${loginToken}',${signupOtpVerified},'${userType}');`
        mysql.query(queryString, async function(err) {
            if (err) { reject(err); return; }
            const user = await findUserByCWID(cwid);
            resolve(user);
        });
    });
  }

  return {createUser, findUserByCWID};
}

function toUserDomain(row) {
  return {
      cwid: row.cwid,
      fname: row.fname,
      lname: row.lname,
      username: row.username,
      email: row.email,
      password: row.password,
      loginToken: row.loginToken,
      userType: row.userType,
      emailVerified: !!row.signupOtpVerified
  }
}