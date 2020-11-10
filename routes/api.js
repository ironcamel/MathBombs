const createError = require('http-errors');
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
  useNullAsDefault: true,
  //debug: true,
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
    [ 'GET'  , '/skills' ],
    [ 'GET'  , '/reports' ],
    [ 'GET'  , '/powerups' ],
    [ 'POST' , '/problems' ],
    [ 'PATCH', '/problems/\\d+' ],
    [ 'GET'  , '/test' ],
  ];
  const isPublic = publicRoutes.find(([ m, p ]) => {
    return req.method === m && req.path.match(new RegExp(`^${p}$`));
  });
  if (!isPublic) {
    const { teacher_id } = req.params;
    const token = req.get('x-auth-token');
    if (!token) {
      return next(createError(403, 'Missing x-auth-token header.'));
    }
    const [ authToken ] = await knex('auth_token').where({ token });
    if (!authToken) {
      return next(createError(403, 'Invalid x-auth-token header.'));
    }
    [ res.locals.teacher ] = await knex('teacher').where({ id: authToken.teacher_id });
    res.locals.teacher_id = res.locals.teacher.id;
  }
  next();
});

router.post('/auth-tokens', async function(req, res, next) {
  const { email, password } = req.body;
  if (!email) return next(createError(400, 'The email param is required.'));
  if (!password) return next(createError(400, 'The password param is required.'));
  let data;
  try {
    const [ teacher ] = await knex('teacher').where({ email });
    if (!teacher) {
      return next(createError(403, 'No such email exists.'));
    }
    const hash = teacher.pw_hash.replace(/^\{CRYPT\}/, '');
    if (email === config.admin_email) {
      if (password !== config.admin_password) {
        return next(createError(403, 'Invalid password.'));
      } else {
        return res.send({ msg: 'admin flow is not implemented yet' });
      }
    } else {
      const match = await bcrypt.compare(password, hash);
      if (!match) {
        return next(createError(403, 'Invalid password.'));
      }
    }
    delete teacher.pw_hash;
    data = await createAuthToken(teacher);
    data.teacher = teacher;
  } catch (e) {
    return next(createError(500, e));
  }
  res.send({ data });
});

router.delete('/auth-tokens', aw(async function(req, res, next) {
  const { teacher_id } = res.locals;
  if (teacher_id) await knex('auth_token').where({ teacher_id }).del();
  res.send({});
}));

router.get('/test', async function(req, res, next) {
});

router.post('/password-reset-tokens', aw(async function(req, res, next) {
  const { email } = req.body;
  if (!email) return next(createError(400, 'The email param is required.'));
  const [ teacher ] = await knex('teacher').where({ email });
  if (!teacher) return next(createError(400, 'No such account found for that email'));
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
  if (!password) return next(createError(400, 'The password param is required.'));
  const [ pwToken ] = await knex('password_reset_token').where({ id: token_id });
  if (!pwToken) return next(createError(404, 'This token does not exist.'));
  const teacher_id = pwToken.teacher_id;
  const pw_hash = await hashPassword(password);
  await knex('teacher').where({ id: teacher_id }).update({ pw_hash });
  await knex('password_reset_token').where({ id: token_id }).update({ is_deleted: 1 });
  res.send({});
}));

router.post('/teachers', aw(async function(req, res, next) {
  let { name, email, password } = req.body;
  if (!name) return next(createError(400, 'The name param is required.'));
  if (!name.match(/^\w[\w\s\.-]*\w$/)) {
    return next(createError(400, 'The name is invalid.'));
  }
  if (!password) return next(createError(400, 'The password param is required.'));
  password = password.trim();
  if (password.length < 4) {
    return next(createError(400, 'The password must be at least 4 characters long.'));
  }
  if (!email) return next(createError(400, 'The email param is required.'));
  if (!validateEmail(email)) return next(createError(400, 'The email is invalid.'));
  let teacher = await findTeacher({ email });
  if (teacher) return next(createError(400, 'That email already exists.'));
  const now = dbDateTime();
  const pw_hash = await hashPassword(password);
  const id = uuid.v4();
  await knex('teacher').insert({ id, name, email, pw_hash, created: now, updated: now });
  teacher = await findTeacher({ id });
  const authToken = await createAuthToken(teacher);
  res.send({
    data: teacher,
    meta: { auth_token: authToken.token }
  });
}));

router.patch('/teachers/:teacher_id', async function(req, res, next) {
  const { teacher_id } = req.params;
  if (teacher_id !== res.locals.teacher.id) {
    return next(createError(403, 'Not allowed to update this teacher.'));
  }
  let teacher;
  try {
    if ('rewards_email' in req.body) {
      const { rewards_email } = req.body;
      await knex('teacher').where({ id: teacher_id }).update({ rewards_email });
    }
    [ teacher ] = await knex('teacher').where({ id: teacher_id });
  } catch (e) {
    return next(createError(500, e));
  }
  res.send({ data: teacher });
});

router.get('/students', aw(async function(req, res, next) {
  const { teacher_id } = req.query;
  if (!teacher_id) {
    return next(createError(400, 'The teacher_id param is required.'));
  }
  const [ teacher ] = await knex('teacher').where({ id: teacher_id });
  if (!teacher) return next(createError(400, 'Invalid teacher_id.'));
  delete teacher.pw_hash;
  const students = await knex('student').where({ teacher_id });
  await Promise.all(students.map(async (s) => setGoalData(s)));
  res.send({ data: students, meta: { teacher } });
}));

router.post('/students', aw(async function(req, res, next) {
  let { name } = req.body;
  if (!name) return next(createError(400, 'The name param is required.'));
  if (!name.match(/^\w[\w\s\.-]*\w$/)) {
    return next(createError(400, 'The name is invalid.'));
  }
  const { teacher_id } = res.locals;
  const [{ cnt }] = await knex('student').count({ cnt: '*' })
    .where({ teacher_id })
    .whereRaw('lower(name) = ?', [ name.toLowerCase() ]);
  if (cnt) return next(createError(400, 'The student name already exists.'));
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
  if (!student) return next(createError(404, 'This student does not exist.'));
  await setGoalData(student);
  const [ powerup1 ] = await knex('powerup').where({ id: 1, student: student.id });
  const [ powerup2 ] = await knex('powerup').where({ id: 2, student: student.id });
  student.powerups = { 1: powerup1, 2: powerup2 };
  res.send({ data: student });
}));

async function setGoalData(student) {
  student.past_week = await calcNumSheets({ student_id: student.id, days: 7 });
  student.past_month = await calcNumSheets({ student_id: student.id, days: 30 });
  return student;
}

async function calcNumSheets({ student_id, days }) {
  const where = { student: student_id };
  const now = dayjs();
  const fmt = 'YYYY-MM-DD';
  const past = now.subtract(days, 'day').format(fmt);
  const rows = await knex('sheet').count({ cnt: '*' })
    .where(where).andWhere('finished', '>=', past);
  return rows[0].cnt;
}

// async wrapper
function aw (fun) {
  return function (req, res, next) {
    fun(req, res, next).catch(next);
  };
}

async function findTeacher(query) {
  const [ teacher ] = await knex('teacher').where(query);
  return teacher;
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
  return Math.ceil(Math.random() * max);
}

module.exports = router;

// vi: fdm=indent fdn=1
