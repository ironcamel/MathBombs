
class MathBombsClient {
  constructor({ debug, authToken } = {}) {
    this.debug = debug;
    this.authToken = authToken;
    this.debug = true;
  }

  baseHeaders() {
    return this.authToken ? { 'x-auth-token': this.authToken } : {};
  }

  get(uri) {
    const headers = this.baseHeaders();
    return fetch(uri, { method: 'GET', headers }).then(res => res.json());
  }

  post(uri, data) {
    const headers = this.baseHeaders();
    headers['content-type'] = 'application/json';
    if (this.authToken) headers['x-auth-token'] = this.authToken;
    return fetch(uri, {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    }).then(res => res.json());
  }

  patch(uri, data) {
    const headers = this.baseHeaders();
    headers['content-type'] = 'application/json';
    if (this.authToken) headers['x-auth-token'] = this.authToken;
    return fetch(uri, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers,
    }).then(res => res.json());
  }

  del(uri) {
    const headers = this.baseHeaders();
    return fetch(uri, {
      method: 'DELETE',
      headers,
    }).then(res => res.json());
  }

  createAuthToken({ email, password }) {
    if (!email) return this.err('The email is required');
    if (!password) return this.err('The password is required');
    return this.post('/api/v1/auth-tokens', { email, password }).then(data => {
      if (this.debug) console.log('MathBombsClient createAuthToken', data);
      return data;
    });
  }

  getStudent(student) {
    const id = typeof student === 'object' ? student.id : student;
    return this.get('/api/students/' + id).then(data => {
      data.student = data.data;
      if (this.debug) console.log('MathBombsClient getStudent:', data);
      return data;
    });
  }

  getStudents({ teacher, teacher_id }) {
    if (teacher) teacher_id = teacher.id;
    return this.get('/api/v1/students?teacher_id=' + teacher_id).then(data => {
      data.students = data.data;
      if (this.debug) console.log('MathBombsClient getStudents:', data);
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
      if (this.debug) console.log('MathBombsClient createStudent', data);
      return data;
    });
  }

  deleteStudent({ id }) {
    const headers = this.authToken ? { 'x-auth-token': this.authToken } : {};
    return this.del('/api/students/' + id).then(data => {
      if (this.debug) console.log('MathBombsClient deleteStudent', data);
      return data;
    });
  }

  updateStudent({ id }, update) {
    return this.patch('/api/students/' + id, update).then(data => {
      if (this.debug) console.log('MathBombsClient updateStudent', data);
      return data;
    });
  }

  createProblems({ student_id, sheet_id }) {
    return this.post('/api/problems', { student_id, sheet_id }).then(data => {
      data.problems = data.data;
      if (this.debug) console.log('MathBombsClient createProblems', data);
      return data;
    });
  }

  updateProblem(problem) {
    return this.patch('/api/problems/' + problem.id, problem).then(data => {
      if (this.debug) console.log('MathBombsClient updateProblem', data);
      return data;
    });
  }

  usePowerup({ powerup_id, student_id }) {
    const payload = { action: 'use-powerup', student_id, powerup_id };
    return this.post(`/api/students/${student_id}/actions`, payload).then(data => {
      data.student = data.data;
      if (this.debug) console.log('MathBombsClient usePowerup', data);
      return data;
    });
  };

  createSampleProblem({ student_id }) {
    return this.post('/api/sample-problems', { student_id }).then(res => {
      res[res.data.type] = res.data.attributes;
      if (this.debug) console.log('MathBombsClient createSampleProblem', res);
      return res;
    });
  }

}
