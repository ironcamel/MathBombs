const createError = require('http-errors');
const dayjs = require('dayjs');
const debug = require('debug')('mathbombs:api');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const uuid = require('uuid');
const config = require('../config.js');
const express = require('express');
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
    [ 'POST' , '/password-reset-tokens/\\w+' ],
    [ 'POST' , '/teachers' ],
    [ 'GET'  , '/students' ],
    [ 'GET'  , '/students/\\w+' ],
    [ 'POST' , '/students/[^/]+/actions' ],
    [ 'GET'  , '/skills' ],
    [ 'GET'  , '/reports' ],
    [ 'GET'  , '/powerups' ],
    [ 'POST' , '/problems' ],
    [ 'PATCH', '/problems/\\d+' ],
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
    res.locals.teacher = await knex('teacher').where({ id: authToken.teacher_id });
  }
  next();
});

router.get('/config', function(req, res, next) {
  res.send({...config, admin_password: '...'});
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
    data = await create_auth_token({ teacher_id: teacher.id });
    data.teacher = teacher;
  } catch (e) {
    return next(createError(500, e));
  }
  res.send({ data });
});

router.delete('/auth-tokens', async function(req, res, next) {
});

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
    [ teacher ] = await knex('teacher').select().where({ id: teacher_id });
  } catch (e) {
    return next(createError(500, e));
  }
  res.send({ data: teacher });
});

async function create_auth_token({ teacher_id }) {
  const now = dayjs();
  const fmt = 'YYYY-MM-DD HH:mm:ss';
  const created = now.format(fmt);
  const updated = created;
  const token = crypto.randomBytes(16).toString("hex");
  const id = uuid.v4();
  const data = { id, token, teacher_id, created, updated };
  await knex('auth_token').insert(data);
  return data;
}

router.get('/students/:id', function(req, res, next) {
  const id = req.params.id;
  knex('student').where({ id }).then(rows => {
    debug(rows.length);
    const [ row ] = rows;
    if (row) {
      res.send({ data: row });
    } else {
      next(createError(404));
    }
  })
  .catch(err => next(err));
});

router.get('/students', async function(req, res, next) {
  const { teacher_id } = req.query;
  if (!teacher_id) {
    return next(createError(400, 'The teacher_id param is required.'));
  }
  let students, teacher;
  try {
    const [ teacher ] = await knex('teacher').where({ id: teacher_id });
    if (!teacher) {
      return next(createError(400, 'Invalid teacher_id.'));
    }
    delete teacher.pw_hash;
    students = await knex('student').where({ teacher_id });
    await Promise.all(students.map(async (s) => {
      s.past_week = await calcNumSheets({ student_id: s.id, days: 7 });
      s.past_month = await calcNumSheets({ student_id: s.id, days: 30 });
    }));
  } catch (e) {
    return next(createError(500, e));
  }
  res.send({ data: students, meta: { teacher } });
});

async function calcNumSheets({ student_id, days }) {
  const where = { student: student_id };
  const now = dayjs();
  const fmt = 'YYYY-MM-DD';
  const past = now.subtract(days, 'day').format(fmt);
  const rows = await knex('sheet').count({ cnt: '*' })
    .where(where).andWhere('finished', '>=', past);
  return rows[0].cnt;
}

module.exports = router;
