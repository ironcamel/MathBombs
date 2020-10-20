
class MathBombsClient {
  constructor({ debug, authToken } = {}) {
    this.debug = debug;
    this.authToken = authToken;
    this.debug = true;
  }

  uriMap = {
    teacher: ({ id }) => '/api/teachers/' + id,
    auth_tokens: () => '/api/v1/auth-tokens',
  };

  baseHeaders() {
    return this.authToken ? { 'x-auth-token': this.authToken } : {};
  }

  get(uri) {
    const headers = this.baseHeaders();
    return fetch(uri, { method: 'GET', headers })
    .then(res => res.json())
    .then(data => {
      if (this.debug) console.log(`MathBombsClient GET => ${uri}`, data);
      return data;
    });
  }

  post(uri, data) {
    const headers = this.baseHeaders();
    headers['content-type'] = 'application/json';
    if (this.authToken) headers['x-auth-token'] = this.authToken;
    return fetch(uri, {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    })
    .then(res => res.json())
    .then(data => {
      if (this.debug) console.log(`MathBombsClient POST => ${uri}`, data);
      return data;
    });
  }

  patch(uri, data) {
    const headers = this.baseHeaders();
    headers['content-type'] = 'application/json';
    if (this.authToken) headers['x-auth-token'] = this.authToken;
    return fetch(uri, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers,
    })
    .then(res => res.json())
    .then(data => {
      if (this.debug) console.log(`MathBombsClient PATCH => ${uri}`, data);
      return data;
    });
  }

  del(uri) {
    const headers = this.baseHeaders();
    return fetch(uri, {
      method: 'DELETE',
      headers,
    })
    .then(res => res.json())
    .then(data => {
      if (this.debug) console.log(`MathBombsClient DELETE => ${uri}`, data);
      return data;
    });
  }

  createAuthToken({ email, password }) {
    if (!email) return this.err('The email is required');
    if (!password) return this.err('The password is required');
    return this.post('/api/v1/auth-tokens', { email, password });
  }

  getStudent(student) {
    const id = typeof student === 'object' ? student.id : student;
    return this.get('/api/students/' + id).then(data => {
      data.student = data.data;
      return data;
    });
  }

  getStudents({ teacher, teacher_id }) {
    if (teacher) teacher_id = teacher.id;
    return this.get('/api/v1/students?teacher_id=' + teacher_id).then(data => {
      data.students = data.data;
      return data;
    });
  }

  err(msg) {
    return new Promise((resolve) => resolve({ error: msg, errors: [msg] }));
  }

  createStudent({ name }) {
    if (!name) return this.err('The student name is required');
    return this.post('/api/students', { name }).then(data => {
      data.student = data.data;
      return data;
    });
  }

  deleteStudent({ id }) {
    const headers = this.authToken ? { 'x-auth-token': this.authToken } : {};
    return this.del('/api/students/' + id);
  }

  updateStudent({ id }, update) {
    return this.patch('/api/students/' + id, update);
  }

  createProblems({ student_id, sheet_id }) {
    return this.post('/api/problems', { student_id, sheet_id }).then(data => {
      data.problems = data.data;
      return data;
    });
  }

  updateProblem(problem) {
    return this.patch('/api/problems/' + problem.id, problem);
  }

  usePowerup({ powerup_id, student_id }) {
    const payload = { action: 'use-powerup', student_id, powerup_id };
    return this.post(`/api/students/${student_id}/actions`, payload).then(data => {
      data.student = data.data;
      return data;
    });
  };

  createSampleProblem({ student_id }) {
    return this.post('/api/sample-problems', { student_id }).then(res => {
      res[res.data.type] = res.data.attributes;
      return res;
    });
  }

  updateTeacher(teacher, update) {
    const uri = this.uriFor('teacher', teacher);
    return this.patch(uri, update);
  }

  deleteAuthTokens() {
    return this.del(this.uriFor('auth_tokens'));
  }

  uriFor(type, obj) {
    const fun = this.uriMap[type];
    if (fun) return fun(obj);
    throw 'No URI mapping exists for ' + type;
  }

}
