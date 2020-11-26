const err = require('http-errors');
const dayjs = require('dayjs');
const debug = require('debug')('mathbombs:api');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const uuid = require('uuid');
const express = require('express');
const config = require('../config.js');
const { skills, sortedSkills } = require('../models/skills.js');
const { sendEmail, irand } = require('../models/util.js');

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

router.get('/test', async function(req, res, next) {
  res.send({ msg: 'done' });
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
  const link = `${config.base_url}/password-reset?token=${id}`;
  const text = require('../views/password-reset-email.js')({ link });
  sendEmail({ to: email, subject: 'MathBombs password', text });
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

router.patch('/teachers/:id', aw(async function(req, res, next) {
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
}));

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
  const student = await findStudent(id);
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
  let student = await findStudent({ id, teacher_id });
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
    student = await findStudent(id);
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

router.post('/rewards', aw(async function(req, res, next) {
  let { student_id, reward, sheet_id, week_goal, month_goal } = req.body;
  if (!student_id) return next(err(400,'The student_id param is required.'));
  const { teacher_id } = res.locals;
  const student = await findStudent({ id: student_id, teacher_id });
  if (!student) return next(err(400, 'No such student.'));
  const errMsg = 'The sheet_id, week_goal, or month_goal param is required';
  if (!(sheet_id || week_goal || month_goal)) return next(err(400, errMsg));
  const id = uuid.v4();
  sheet_id = sheet_id || null;
  week_goal = week_goal || null;
  month_goal = month_goal || null;
  const is_given = 0;
  const data = {
    id, student_id, reward, is_given, sheet_id, week_goal, month_goal
  };
  await knex('reward').insert(data);
  res.send({ data });
}));

router.delete('/rewards/:id', aw(async function(req, res, next) {
  const { id } = req.params;
  const where = { id };
  const [{ cnt }] = await knex('reward').count({ cnt: '*' }).where(where);
  if (cnt > 1) return next(err(500, `Query returned ${cnt} rewards.`));
  await knex('reward').where(where).del();
  res.send({});
}));

router.patch('/powerups/:id', aw(async function(req, res, next) {
  const { id } = req.params;
  const { student_id } = req.query;
  let msg = 'The student_id query param is required.';
  if (!student_id) return next(err(400, msg));
  const { teacher_id } = res.locals;
  const student = await findStudent({ id: student_id, teacher_id });
  if (!student) return next(err(400, 'No such student.'));
  let { cnt } = req.body;
  if (cnt == null) return next(err(400, 'The cnt param is required.'));
  msg = 'The cnt param must be a positive integer.';
  if (!Number.isInteger(cnt) || cnt < 0) return next(err(400, msg));
  const where = { id, student: student_id };
  const [ powerup ] = await knex('powerup').where(where);
  if (!powerup) return next(err(404, 'No such powerup.'));
  await knex('powerup').where(where).update({ cnt });
  powerup.cnt = cnt;
  res.send({ data: powerup });
}));

router.post('/problems', aw(async function(req, res, next) {
  const { student_id, sheet_id } = req.body;
  if (!sheet_id) return next(err(400, 'The sheet_id param is required.'));
  if (!student_id) return next(err(400, 'The student_id param is required.'));
  const student = await findStudent(student_id);
  if (!student) return next(err(400, 'No such student.'));
  let where = { id: sheet_id, student: student_id };
  const [{ cnt }] = await knex('sheet').count({ cnt: '*' }).where(where);
  if (cnt == 0) {
    const { math_skill, difficulty } = student;
    await knex('sheet').insert({
      id: sheet_id,
      student: student_id,
      math_skill,
      difficulty,
    });
    const skill = skills[math_skill];
    if (!skill) return next(err(500, 'No such math skill.'));
    for (let i = 1; i <= student.problems_per_sheet; i++) {
      const problem = skill.genProblem(difficulty);
      await knex('problem').insert({
        id: i,
        sheet: sheet_id,
        student: student_id,
        ...problem,
      });
    }
  }
  where = { sheet: sheet_id, student: student_id };
  const problems = await knex('problem').where(where);
  problems.forEach(p => {
    p.sheet_id = p.sheet;
    p.student_id = p.student;
  });
  res.send({ data: problems });
}));

router.patch('/problems/:problem_id', aw(async function(req, res, next) {
  const { problem_id} = req.params;
  const { student_id, sheet_id, guess } = req.body;
  if (guess == null) return next(err(400, 'The guess param is required.'));
  if (!sheet_id) return next(err(400, 'The sheet_id param is required.'));
  if (!student_id) return next(err(400, 'The student_id param is required.'));
  const student = await findStudent(student_id);
  if (!student) return next(err(400, 'No such student.'));
  const problemQuery = { id: problem_id, sheet: sheet_id, student: student_id };
  let [ problem ] = await knex('problem').where(problemQuery);
  if (!problem) return next(err(404, 'No such problem.'));
  const problemUpdate = { guess };
  let powerup, reward;
  if (problem.is_solved == 0 && problem.answer == guess) {
    problemUpdate.is_solved = 1;
    let prob1 = config.powerups[1].probability;
    if (prob1 == null) prob1 = 10;
    let prob2 = config.powerups[2].probability;
    if (prob2 == null) prob2 = 2;
    const rand = irand(100);
    if (rand <= prob1 || rand <= prob2) {
      const where = { student: student_id };
      where.id = rand <= prob2 ? 2 : 1;
      [ powerup ] = await knex('powerup').where(where);
      const cnt = powerup.cnt + 1;
      await knex('powerup').where(where).update({ cnt });
      powerup.cnt = cnt;
    }
  }
  await knex('problem').where(problemQuery).update(problemUpdate);
  if (problemUpdate.is_solved) {
    reward = await processSheet({ student, sheet_id });
  }
  problem = { ...problem, ...problemUpdate };
  res.send({
      data: problem,
      meta: { powerup, reward },
  });
}));

async function processSheet({ student, sheet_id }) {
  const student_id = student.id;
  const where = { id: sheet_id, student: student_id };
  const [ sheet ] = await knex('sheet').where(where);
  if (sheet.finished) return;

  const problemQuery = { sheet: sheet_id, student: student_id };
  let [{ cnt }] = await knex('problem').count({ cnt: '*' })
    .where(problemQuery).whereRaw('answer = guess');
  const numCorrect = cnt;
  [{ cnt }] = await knex('problem').count({ cnt: '*' })
    .where(problemQuery);
  const numProblems = cnt;
  if (numCorrect != numProblems) return;

  await knex('sheet').where(where).update({ finished: dbDate() });
  if (sheet_id > student.last_sheet) { // sanity check
    await knex('student').where({ id: student_id })
      .update({ last_sheet: sheet_id });
  }
  student = await findStudent(student_id); // Refresh the student object

  sendProgressEmail({ student, sheet_id });

  let [ reward ] = await knex('reward')
    .where({ student_id, is_given: 0 })
    .andWhere('sheet_id', '<=', sheet_id);
  if (!reward) {
    const rewards = await knex('reward').where({ student_id, is_given: 0 })
      .whereNull('sheet_id');
    for (r of rewards) {
      if (
        (r.week_goal  && student.past_week  >= r.week_goal ) ||
        (r.month_goal && student.past_month >= r.month_goal)
      ) {
        reward = r;
        break;
      }
    }
  }

  let msg;
  if (reward) {
    msg = reward.reward;
    sendRewardEmail({ student, sheet_id, msg });
    await knex('reward').where({ id: reward.id }).update({ is_given: 1 });
  }
  return msg;
}

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
function aw(fun) {
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
  await setGoalData(student);
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

function dbDate() {
  const now = dayjs();
  const fmt = 'YYYY-MM-DD';
  return now.format(fmt);
}

function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function sendProgressEmail({ student, sheet_id }) {
  const student_id = student.id;
  const { name, past_week, past_month } = student;
  const text = require('../views/progress-email.js')({
    name, sheet_id, past_week, past_month,
    sheet_url: config.base_url + `/students/${student_id}/sheets/${sheet_id}`,
  });
  const teacher = await findTeacher(student.teacher_id);
  const subject = `MathBombs: ${name} completed sheet ${sheet_id}` +
    ` (${past_week}/7 ${past_month}/30)`;
  sendEmail({ to: teacher.email, subject, text });
}

async function sendRewardEmail({ student, sheet_id, msg }) {
  const { name } = student;
  const text = require('../views/reward-email.js')({ name, sheet_id, msg });
  const teacher = await findTeacher(student.teacher_id);
  const subject =
    `MathBombs: special message for ${name} from sheet #${sheet_id}`;
  sendEmail({ to: teacher.email, subject, text });
  const { rewards_email } = teacher;
  if (rewards_email) sendEmail({ to: rewards_email, subject, text });
}

module.exports = router;

// vi: fdm=indent fdn=1
