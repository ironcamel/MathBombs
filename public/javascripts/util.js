
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

  getStudent({ id }) {
    return this.get('/api/students/' + id).then(data => {
      if (this.debug) console.log('MathBombsClient getStudent:', data);
      data.student = data.data;
      return data;
    });
  }

  getStudents({ teacher, teacher_id }) {
    if (teacher) teacher_id = teacher.id;
    return this.get('/api/students?teacher_id=' + teacher_id).then(data => {
      if (this.debug) console.log('MathBombsClient getStudents:', data);
      data.students = data.data;
      return data;
    });
  }

  err(msg) {
    return new Promise((resolve) => resolve({ error: msg }));
  }

  createStudent({ name }) {
    if (!name) return this.err('The student name is required');
    const headers = { 'content-type': 'application/json' };
    if (this.authToken) headers['x-auth-token'] = this.authToken;
    return this.post('/api/students', { name }).then(data => {
      if (this.debug) console.log('MathBombsClient createStudent', data);
      data.student = data.data;
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

  updateStudent({ id, ...update }) {
    return this.patch('/api/students/' + id, update).then(data => {
      if (this.debug) console.log('MathBombsClient updateStudent', data);
      return data;
    });
  }

}
