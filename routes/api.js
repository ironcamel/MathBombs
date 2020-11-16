const err = require('http-errors');
const dayjs = require('dayjs');
const debug = require('debug')('mathbombs:api');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const uuid = require('uuid');
const config = require('../config.js');
const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    //filename: "/opt/mathbombs/data/math.db",
    filename: "/opt/MathSheets/data/math.db", // production db
  },
  pool: {
    afterCreate: (conn, cb) => {
      conn.run('pragma foreign_keys = on', cb)
    }
  },
  useNullAsDefault: true,
  //debug: true,
});

const sortedSkills = [
  'Addition',
  'Subtraction',
  'Multiplication',
  'Division',
  'DecimalMultiplication',
  'Simplification',
  'FractionMultiplication',
  'FractionDivision',
  'FractionAddition',
];

const skills = {
  Addition: {
    name: 'Integer Addition',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty);
      const n1 = irand(max);
      const n2 = irand(max);
      const answer = n1 + n2;
      const question = `${n1} \\; + \\; ${n2}`;
      return { question, answer };
    }
  },
  Subtraction: {
    name: 'Integer Subtraction',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty);
      let n1 = irand(max);
      let n2 = irand(max);
      if (n1 < n2) [n1, n2] = [n2, n1];
      const answer = n1 - n2;
      const question = `${n1} \\; - \\; ${n2}`;
      return { question, answer };
    }
  },
  Multiplication: {
    name: 'Integer Multiplication',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty);
      const n1 = irand(max);
      const n2 = irand(max);
      const answer = n1 * n2;
      const question = `${n1} \\; \\times \\; ${n2}`;
      return { question, answer };
    }
  },
  Division: {
    name: 'Integer Division',
    genProblem: (difficulty) =>  {
      let divisor_max, quotient_max;
      switch (difficulty) {
        case 1:
          [divisor_max, quotient_max] = [10, 10];
          break;
        case 2:
          [divisor_max, quotient_max] = [10, 100];
          break;
        default:
          [divisor_max, quotient_max] = [100, 1000];
      }
      const divisor = irand(divisor_max);
      if (divisor == 0) divisor = 1;
      const answer = irand(quotient_max);
      const dividend = divisor * answer;
      let question;
      switch (irand(3)) {
        case 1: question = `${dividend} \\; / \\; ${divisor}`
          break;
        case 2: question = `${dividend} \\; \\div \\; ${divisor}`;
          break;
        default: question = `\\frac{${dividend}}{${divisor}}`;
      }
      return { question, answer };
    }
  },
  DecimalMultiplication: {
    name: 'Decimal Multiplication',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty+1);
      let n1 = irand(max);
      let n2 = irand(max);
      const log1 = Math.floor(Math.log10(n1));
      const log2 = Math.floor(Math.log10(n2));
      n1 = n1 / Math.pow(10, irand(log1));
      n2 = n2 / Math.pow(10, irand(log2));
      const answer = n1 * n2;
      const question = `${n1} \\; \\times \\; ${n2}`;
      return { question, answer };
    }
  },
  Simplification: {
    name: 'Fraction Simplification',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty-1);
      let n1, n2, mux;
      if (difficulty == 1) {
        n1 = irand(10);
        n2 = irand(10);
        mux = irand(5);
      } else if (difficulty == 2) {
        n1 = irand(20);
        n2 = irand(20);
        mux = irand(5);
      } else {
        n1 = irand(20);
        n2 = irand(20);
        mux = irand(20);
      }
      if (n1 > n2) [n1, n2] = [n2, n1];
      n1 *= mux;
      n2 *= mux;
      const question = `\\frac{${n1}}{${n2}}`;
      const answer = simplifyFraction(n1, n2);
      return { question, answer };
    }
  },
  FractionMultiplication: {
    name: 'Fraction Multiplication',
    genProblem: (difficulty) =>  {
      let max, numFractions;
      switch (difficulty) {
        case 1:  [max, numFractions] = [12, 2]; break;
        case 2:  [max, numFractions] = [12, 3]; break;
        default: [max, numFractions] = [16, 3];
      }
      let [ x, y ] = [ irand(max), irand(max) ];
      let question = `\\frac{${x}}{${y}}`;
      let n = [x];
      let d = [y];
      for (let i = 0; i < numFractions-1; i++) {
        const times = irand(2) == 1 ? '\\times' : '\\cdot';
        [ x, y ] = [ irand(max), irand(max) ];
        n.push(x);
        d.push(y);
        question += ` \\; ${times} \\; \\frac{${x}}{${y}}`;
      }
      n = n.reduce((acc, cur) => acc * cur);
      d = d.reduce((acc, cur) => acc * cur);
      const answer = simplifyFraction(n, d);
      return { question, answer };
    }
  },
  FractionDivision: {
    name: 'Fraction Division',
    genProblem: (difficulty) =>  {
      const max = difficulty * 6;
      const [x1, x2, y1, y2] = [...Array(4).keys()].map(x => irand(max));
      const f1 = `\\frac{${x1}}{${x2}}`;
      const f2 = `\\frac{${y1}}{${y2}}`;
      let question;
      switch (irand(3)) {
        case 1: question = `${f1} \\; / \\; ${f2}`;
          break;
        case 2: question = `${f1} \\; \\div \\; ${f2}`;
          break;
        default: question = `\\frac{\\;${f1}\\;}{\\;${f2}\\;}`;
      }
      const answer = simplifyFraction(x1*y2, x2*y1);
      return { question, answer };
    }
  },
  FractionAddition: {
    name: 'Fraction Addition',
    genProblem: (difficulty) =>  {
      let max, numFractions;
      switch (difficulty) {
        case 1:  [max, numFractions] = [12, 2]; break;
        case 2:  [max, numFractions] = [12, 3]; break;
        default: [max, numFractions] = [16, 3];
      }
      let [ x, y ] = [ irand(max), irand(max) ];
      let question = `\\frac{${x}}{${y}}`;
      let n = [x];
      let d = [y];
      for (let i = 0; i < numFractions-1; i++) {
        [ x, y ] = [ irand(max), irand(max) ];
        n.push(x);
        d.push(y);
        question += ` \\; + \\; \\frac{${x}}{${y}}`;
      }
      commonDen = d.reduce((acc, cur) => acc * cur);
      n.forEach((x,i) => n[i] *= commonDen / d[i]);
      const numerator = n.reduce((acc, cur) => acc + cur);
      const answer = simplifyFraction(numerator, commonDen);
      return { question, answer };
    }
  },
};

router.get('/test', async function(req, res, next) {
  res.send({});
});

router.use(async (req, res, next) => {
  const publicRoutes = [
    [ 'POST' , '/auth-tokens' ],
    [ 'POST' , '/password-reset-tokens' ],
    [ 'POST' , '/password-reset-tokens/[\\w-]+' ],
    [ 'POST' , '/teachers' ],
    [ 'GET'  , '/students' ],
    [ 'GET'  , '/students/[\\w-]+' ],
    [ 'POST' , '/students/[^/]+/actions' ],
    [ 'GET'  , '/reports/.+' ],
    [ 'GET'  , '/powerups' ],
    [ 'POST' , '/problems' ],
    [ 'PATCH', '/problems/\\d+' ],
    [ 'GET'  , '/skills' ],
    [ 'POST' , '/sample-problems' ],
    [ 'GET'  , '/test' ],
  ];
  const isPublic = publicRoutes.find(([ m, p ]) => {
    return req.method === m && req.path.match(new RegExp(`^${p}$`));
  });
  if (!isPublic) {
    const { teacher_id } = req.params;
    const token = req.get('x-auth-token');
    if (!token) {
      return next(err(403, 'Missing x-auth-token header.'));
    }
    const [ authToken ] = await knex('auth_token').where({ token });
    if (!authToken) {
      return next(err(403, 'Invalid x-auth-token header.'));
    }
    [ res.locals.teacher ] = await knex('teacher').where({ id: authToken.teacher_id });
    res.locals.teacher_id = res.locals.teacher.id;
  }
  next();
});

router.post('/auth-tokens', async function(req, res, next) {
  const { email, password } = req.body;
  if (!email) return next(err(400, 'The email param is required.'));
  if (!password) return next(err(400, 'The password param is required.'));
  let data;
  try {
    const [ teacher ] = await knex('teacher').where({ email });
    if (!teacher) {
      return next(err(403, 'No such email exists.'));
    }
    const hash = teacher.pw_hash.replace(/^\{CRYPT\}/, '');
    if (email === config.admin_email) {
      if (password !== config.admin_password) {
        return next(err(403, 'Invalid password.'));
      } else {
        return res.send({ msg: 'admin flow is not implemented yet' });
      }
    } else {
      const match = await bcrypt.compare(password, hash);
      if (!match) {
        return next(err(403, 'Invalid password.'));
      }
    }
    delete teacher.pw_hash;
    data = await createAuthToken(teacher);
    data.teacher = teacher;
  } catch (e) {
    return next(err(500, e));
  }
  res.send({ data });
});

router.delete('/auth-tokens', aw(async function(req, res, next) {
  const { teacher_id } = res.locals;
  if (teacher_id) await knex('auth_token').where({ teacher_id }).del();
  res.send({});
}));

router.post('/password-reset-tokens', aw(async function(req, res, next) {
  const { email } = req.body;
  if (!email) return next(err(400, 'The email param is required.'));
  const [ teacher ] = await knex('teacher').where({ email });
  if (!teacher) return next(err(400, 'No such account found for that email'));
  const created = dbDateTime();
  const updated = created;
  const id = uuid.v4();
  const data = { id, created, updated, teacher_id: teacher.id };
  await knex('password_reset_token').insert(data);
  let text = require('../views/password-reset-email.js')({ token: id });
  let transport = nodemailer.createTransport(config.email);
  transport.sendMail({
    from: 'notifications@mathbombs.org',
    to: email,
    subject: 'MathBombs password',
    text,
  });
  res.send({});
}));

router.post('/password-reset-tokens/:token_id', aw(async function(req, res, next) {
  const { token_id } = req.params;
  const { password } = req.body;
  if (!password) return next(err(400, 'The password param is required.'));
  const [ pwToken ] = await knex('password_reset_token').where({ id: token_id });
  if (!pwToken) return next(err(404, 'This token does not exist.'));
  const teacher_id = pwToken.teacher_id;
  const pw_hash = await hashPassword(password);
  await knex('teacher').where({ id: teacher_id }).update({ pw_hash });
  await knex('password_reset_token').where({ id: token_id }).update({ is_deleted: 1 });
  res.send({});
}));

router.post('/teachers', aw(async function(req, res, next) {
  let { name, email, password } = req.body;
  if (!name) return next(err(400, 'The name param is required.'));
  if (!name.match(/^\w[\w\s\.-]*\w$/)) {
    return next(err(400, 'The name is invalid.'));
  }
  if (!password) return next(err(400, 'The password param is required.'));
  password = password.trim();
  if (password.length < 4) {
    return next(err(400, 'The password must be at least 4 characters long.'));
  }
  if (!email) return next(err(400, 'The email param is required.'));
  if (!validateEmail(email)) return next(err(400, 'The email is invalid.'));
  let teacher = await findTeacher({ email });
  if (teacher) return next(err(400, 'That email already exists.'));
  const now = dbDateTime();
  const pw_hash = await hashPassword(password);
  const id = uuid.v4();
  await knex('teacher').insert({ id, name, email, pw_hash, created: now, updated: now });
  teacher = await findTeacher(id);
  const authToken = await createAuthToken(teacher);
  res.send({
    data: teacher,
    meta: { auth_token: authToken.token }
  });
}));

router.patch('/teachers/:id', async function(req, res, next) {
  const { id } = req.params;
  if (id !== res.locals.teacher_id) {
    return next(err(403, 'Not allowed to update this teacher.'));
  }
  if ('rewards_email' in req.body) {
    const { rewards_email } = req.body;
    await knex('teacher').where({ id }).update({ rewards_email });
  }
  const teacher = await findTeacher(id);
  res.send({ data: teacher });
});

router.get('/students', aw(async function(req, res, next) {
  const { teacher_id } = req.query;
  if (!teacher_id) {
    return next(err(400, 'The teacher_id param is required.'));
  }
  const [ teacher ] = await knex('teacher').where({ id: teacher_id });
  if (!teacher) return next(err(400, 'Invalid teacher_id.'));
  delete teacher.pw_hash;
  const students = await knex('student').where({ teacher_id });
  await Promise.all(students.map(async (s) => setGoalData(s)));
  res.send({ data: students, meta: { teacher } });
}));

router.post('/students', aw(async function(req, res, next) {
  let { name } = req.body;
  if (!name) return next(err(400, 'The name param is required.'));
  if (!name.match(/^\w[\w\s\.-]*\w$/)) {
    return next(err(400, 'The name is invalid.'));
  }
  const { teacher_id } = res.locals;
  const [{ cnt }] = await knex('student').count({ cnt: '*' })
    .where({ teacher_id })
    .whereRaw('lower(name) = ?', [ name.toLowerCase() ]);
  if (cnt) return next(err(400, 'The student name already exists.'));
  const created = dbDateTime();
  const student_id = uuid.v4();
  let student = {
    id: student_id,
    teacher_id,
    name,
    math_skill: 'Addition',
    password: irand(1000) + 100,
    created,
    updated: created,
  };
  await knex('student').insert(student);
  await knex('powerup').insert({ id: 1, student: student_id });
  await knex('powerup').insert({ id: 2, student: student_id });
  student = {
    ...student,
    past_week: 0,
    past_month: 0,
    powerups: {
      1: { id: 1, cnt: 0 },
      2: { id: 2, cnt: 0 },
    },
  };
  res.status(201).send({ data: student });
}));

router.get('/students/:id', aw(async function(req, res, next) {
  const { id } = req.params;
  const [ student ] = await knex('student').where({ id });
  if (!student) return next(err(404, 'No such student.'));
  await setGoalData(student);
  const [ powerup1 ] = await knex('powerup').where({ id: 1, student: student.id });
  const [ powerup2 ] = await knex('powerup').where({ id: 2, student: student.id });
  student.powerups = { 1: powerup1, 2: powerup2 };
  res.send({ data: student });
}));

router.patch('/students/:id', aw(async function(req, res, next) {
  const { id } = req.params;
  const { teacher_id } = res.locals;
  let [ student ] = await knex('student').where({ id, teacher_id });
  if (!student) return next(err(404, 'No such student.'));
  const update = {};
  let { name, password, math_skill, problems_per_sheet, difficulty } = req.body;
  if (password != null) {
    if (!password.match(/^\d+$/)) {
      return next(err(400, 'The password must only contain digits.'));
    }
    if (password.length < 3) {
      const msg = 'The password must be at least 3 digits long.';
      return next(err(400, msg));
    }
    update.password = password;
  }
  if (math_skill) {
    if (!skills[math_skill]) {
      return next(err(400, 'No such math skill.'));
    }
    update.math_skill = math_skill;
  }
  if (problems_per_sheet != null) {
    const msg = 'problems_per_sheet must be a positive integer.';
    if (!Number.isInteger(problems_per_sheet)) return next(err(400, msg));
    if (problems_per_sheet <= 0) return next(err(400, msg));
    update.problems_per_sheet = problems_per_sheet;
  }
  if (difficulty != null) {
    const msg = 'difficulty must be an integer between 1 - 3.';
    if (!Number.isInteger(difficulty)) return next(err(400, msg));
    difficulty = parseInt(difficulty);
    if (difficulty < 1 || difficulty > 3) return next(err(400, msg));
    update.difficulty = difficulty;
  }
  if (Object.keys(update).length) {
    await knex('student').where({ id }).update(update);
    [ student ] = await knex('student').where({ id });
  }
  res.send({ data: student });
}));

router.delete('/students/:id', aw(async function(req, res, next) {
  const { id } = req.params;
  const { teacher_id } = res.locals;
  await knex('student').where({ id, teacher_id }).del();
  res.send({});
}));

router.post('/students/:student_id/actions', aw(async function(req, res, next) {
  const { student_id } = req.params;
  const { action, powerup_id } = req.body;
  if (powerup_id != 1 && powerup_id != 2) {
    return next(err(400, 'Invalid powerup_id.'));
  }
  if (!action) return next(err(400, 'The action param is required.'));
  if (action !== 'use-powerup') return next(err(400, 'Invalid action.'));
  if (!powerup_id) return next(err(400, 'The powerup_id param is required.'));
  const student = await findStudent(student_id);
  if (!student) return next(err(404, 'No such student.'));
  const query = { id: powerup_id, student: student_id };
  const [ powerup ] = await knex('powerup').where(query);
  if (!powerup) return next(err(400, 'No such powerup.'));
  const cnt = powerup.cnt > 0 ? powerup.cnt - 1 : 0;
  await knex('powerup').where(query).update({ cnt });
  await setGoalData(student);
  const [ powerup1 ] = await knex('powerup').where({ id: 1, student: student_id });
  const [ powerup2 ] = await knex('powerup').where({ id: 2, student: student_id });
  student.powerups = { 1: powerup1, 2: powerup2 };
  res.send({ data: student });
}));

router.get('/reports/:student_id', aw(async function(req, res, next) {
  const { student_id } = req.params;
  debug('reports getting student', student_id);
  const student = await findStudent(student_id);
  if (!student) return next(err(404, 'No such student.'));
  const where = { student: student_id };
  const now = dayjs();
  const past = daysAgo(30, now);
  const sheets = await knex('sheet')
    .where(where).andWhere('finished', '>=', past);
  const counts = {};
  for (let i = 0; i <= 30; i++) {
    const key = daysAgo(i, now);
    counts[key] = 0;
  }
  sheets.forEach(sheet => counts[sheet.finished]++);
  const data = [[ 'Day', 'Sheets' ]].concat(
    Object.keys(counts).sort().reverse().map(k => [k, counts[k]])
  );
  res.send({ data });
}));

router.post('/sample-problems', aw(async function(req, res, next) {
  const { student_id } = req.body;
  if (!student_id) return next(err(400,'The student_id param is required.'));
  const student = await findStudent(student_id);
  if (!student) return next(err(400, 'No such student.'));
  const p = skills[student.math_skill];
  res.send({
    data: {
      id: irand(1000),
      type: 'problem',
      attributes: p.genProblem(student.difficulty),
    }
  });
}));

router.get('/skills', aw(async function(req, res, next) {
  const data = sortedSkills.map(k => ({ type: k, name: skills[k].name }));
  res.send({ data });
}));

router.get('/rewards', aw(async function(req, res, next) {
  const { student_id } = req.query;
  if (!student_id) return next(err(400,'The student_id param is required.'));
  const { teacher_id } = res.locals;
  const student = await findStudent({ id: student_id, teacher_id });
  if (!student) return next(err(400, 'No such student.'));
  const data = await knex('reward').where({ student_id });
  res.send({ data });
}));

async function setGoalData(student) {
  const student_id = student.id;
  student.past_week = await calcNumSheets({ student_id, days: 7 });
  student.past_month = await calcNumSheets({ student_id, days: 30 });
  return student;
}

async function calcNumSheets({ student_id, days }) {
  const where = { student: student_id };
  const rows = await knex('sheet').count({ cnt: '*' })
    .where(where).andWhere('finished', '>=', daysAgo(days));
  return rows[0].cnt;
}

// async wrapper
function aw (fun) {
  return function (req, res, next) {
    fun(req, res, next).catch(next);
  };
}

async function findTeacher(query) {
  if (typeof query !== 'object') query = { id: query };
  const [ teacher ] = await knex('teacher').where(query);
  return teacher;
}

async function findStudent(query) {
  if (typeof query !== 'object') query = { id: query };
  const [ student ] = await knex('student').where(query);
  return student;
}

async function createAuthToken(teacher) {
  const created = dbDateTime();
  const updated = created;
  const token = crypto.randomBytes(16).toString("hex");
  const id = uuid.v4();
  const data = { id, token, teacher_id: teacher.id, created, updated };
  await knex('auth_token').insert(data);
  return data;
}

function daysAgo(days, now) {
  now = now || dayjs();
  const fmt = 'YYYY-MM-DD';
  return now.subtract(days, 'day').format(fmt);
}

function dbDateTime() {
  const now = dayjs();
  const fmt = 'YYYY-MM-DD HH:mm:ss';
  return now.format(fmt);
}

function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function irand(max) {
  return Math.floor(Math.random() * max) + 1;
}

function simplifyFraction(n, d) {
  for (let i = n; i >= 2; i--) {
    if (isFactorOf(i, n) && isFactorOf(i, d)) {
      n /= i;
      d /= i;
    }
  }
  let answer;
  if (n == 0) {
    answer = 0;
  } else if (d == 1) {
    answer = n;
  } else {
    answer = n + '/' + d;
  }
  return answer + '';
}

function isFactorOf(x, y) {
  if (x > y) return false;
  if (x == 0) return false;
  return y/x == Math.floor(y/x);
}

module.exports = router;

// vi: fdm=indent fdn=1
