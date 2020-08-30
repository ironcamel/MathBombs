
class MathBombsClient {
  constructor() {
  }

  getStudent({ student_id }) {
    return fetch('/api/students/' + student_id, {
      method: 'GET',
    })
    .then(res => res.json())
    .then(data => {
      console.log('MathBombsClient student:', data);
      return data;
    });
  };

}
