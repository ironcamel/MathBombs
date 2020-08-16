
const TeacherMainPage = () => {
  const [students, setStudents] = React.useState([]);
  const [showPasswords, setShowPasswords] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState(null);
  const [isCreatingStudent, setIsCreatingStudent] = React.useState(false);

  const newStudentName = React.createRef();

  const teacher = JSON.parse(window.localStorage.getItem('teacher'));
  const authToken = window.localStorage.getItem('auth-token');
  const portalUrl = "/portals/" + teacher.id;

  React.useEffect(() => getStudents(), []);

  const getStudents = () => {
    fetch('/api/students?teacher_id=' + teacher.id, {
      method: 'GET',
      headers: { 'x-auth-token': authToken },
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setStudents(data.data);
      }
    });
  };

  const createStudent = () => {
    setErrMsg('');
    setIsCreatingStudent(true);
    fetch('/api/students', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
      body: JSON.stringify({ name: newStudentName.current.value }),
    })
    .then(res => res.json())
    .then(data => {
      setIsCreatingStudent(false);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setStudents([...students, data.data]);
      }
    });
  };

  const deleteStudent = (student) => {
    if (!confirm('Are you sure you want to delete ' + student.name + '?'))
      return;
    setErrMsg('');
    setIsCreatingStudent(true);
    fetch('/api/students/' + student.id, {
      method: 'DELETE',
      headers: { 'x-auth-token': authToken }
    })
    .then(res => res.json())
    .then(data => {
      setIsCreatingStudent(false);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setStudents(students.filter((s) => s.id != student.id));
      }
    });
  };

  const studentRows = students.map((student) => (
    <StudentRow
      key={student.id}
      student={student}
      showPasswords={showPasswords}
      deleteStudent={deleteStudent}
      setErrMsg={setErrMsg}
    />
              
  ));

  const togglePasswords = (e) => {
    setShowPasswords(e.target.checked);
  };

  return (
    <React.Fragment>
      
      { errMsg &&
      <div className="alert alert-error">
        <button type="button" className="close" onClick={() => setErrMsg('')}>×</button>
        <strong>Error!</strong> {errMsg}
      </div>
      }

      <div className="row">
        <div className="span12">

          <h2 className="offset1">
            {teacher.name}'s Students <small>[<a href={portalUrl}>student portal</a>]</small>
          </h2>

          <table id="students_tbl" className="table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                { showPasswords &&
                <th>Password</th>
                }
                <th>Details</th>
                <th>Goal Progress</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {studentRows}
            </tbody>
          </table>

          <label className="checkbox">
            <input type="checkbox" checked={showPasswords} onChange={togglePasswords} /> Show passwords
          </label>

        </div>
      </div>

      <div className="row">
        <div className="span12">
          <form id="add_form" className="form-inline" acceptCharset="utf-8">
            <fieldset>
              <legend>Add Student</legend>
              <input type="text" placeholder="Name" ref={newStudentName} />{' '}
              <button type="button" className="btn" onClick={createStudent}>Add</button>
            </fieldset>
          </form>
        </div>
      </div>

    </React.Fragment>
  );
};

const StudentRow = ({ student, showPasswords, deleteStudent, setErrMsg }) => {
  const authToken = window.localStorage.getItem('auth-token');
  const studentUrl = `/students/${student.id}`;
  const reportUrl = `/students/${student.id}/report`;
  const editStudentUrl = `/teacher/students/${student.id}`;
  const skill = student.math_skill.replace(/(?<=.)([A-Z])/g, ' $1');
  const weekPercent = student.past_week / 7 * 100;
  const monthPercent = student.past_month / 30 * 100;

  const [isUpdatingStudent, setIsUpdatingStudent] = React.useState(false);

  const passwordRef = React.createRef();

  const updatePassword = () => {
    setErrMsg('');
    setIsUpdatingStudent(true);
    fetch('/api/students/' + student.id, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
      body: JSON.stringify({
        student_id: student.id,
        password: passwordRef.current.value,
      }),
    })
    .then(res => res.json())
    .then(data => {
      setIsUpdatingStudent(false);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      }
    });
  };

  return (
    <tr key={student.id}>
      <td>
        <div>{student.name}</div>
        <div>
          <a href={editStudentUrl} title="Click to edit this student's settings">
            manage { /*<i className="icon-pencil" title="Edit student settings"></i>*/ }
          </a>
        </div>
        <div>
          <a href={studentUrl} title="Right click to copy private link for student">
            workbook
          </a>
        </div>
      </td>
      { showPasswords &&
      <td>
        <div className="input-append">
          <input className="input-mini" type="text" defaultValue={student.password} ref={passwordRef} />
          { isUpdatingStudent ||
          <button className="btn pw_btn" type="button" onClick={updatePassword}>Update</button>
          }
        </div>
        { isUpdatingStudent && 'Updating ...' }
      </td>
      }
      <td>
        <dl className="dl-horizontal">
          <dt>Current skill</dt>
          <dd>{skill}</dd>
          <dt>Difficulty level</dt>
          <dd>{student.difficulty}</dd>
          <dt>Sheets completed</dt>
          <dd>{student.last_sheet}</dd>
        </dl>
      </td>
      <StudentProgressTd student={student} />
      <td>
        <button className="delete" type="button" onClick={() => deleteStudent(student)}>
          &times;
        </button>
      </td>
    </tr>
  );
};
