import React from 'react';
import { Link } from 'react-router-dom';
import { ClientContext } from '../MathBombsClient';
import StudentProgressTd from './StudentProgressTd';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

const TeacherMainPage = ({ teacher }) => {
  const [students, setStudents] = React.useState([]);
  const [showPasswords, setShowPasswords] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState();
  const [isCreatingStudent, setIsCreatingStudent] = React.useState(false);

  const client = React.useContext(ClientContext);

  const newStudentName = React.createRef();

  const portalUrl = "/portals/" + teacher.id;

  React.useEffect(() => getStudents(), []);

  const getStudents = () => {
    client.getStudents({ teacher }).then(data => {
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        const { students } = data;
        setStudents(students);
      }
    });
  };

  const createStudent = () => {
    setErrMsg('');
    setIsCreatingStudent(true);
    client.createStudent({ name: newStudentName.current.value }).then(data => {
      setIsCreatingStudent(false);
      const { student, error } = data;
      if (error) {
        setErrMsg(error);
        window.scrollTo(0, 0);
      } else {
        setStudents([ ...students, student ]);
      }
    });
  };

  const deleteStudent = (student) => {
    if (!window.confirm('Are you sure you want to delete ' + student.name + '?'))
      return;
    setErrMsg('');
    setIsCreatingStudent(true);
    client.deleteStudent(student).then(data => {
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
  console.log('errMsg:', errMsg);

  return (
    <React.Fragment>

      { errMsg &&
      <Alert variant="danger" dismissible onClose={() => setErrMsg('')}>
        <Alert.Heading>Error!</Alert.Heading>{errMsg}
      </Alert>
      }

      <div>
        <h2>
          Student Management <small>[<Link to={portalUrl}>student portal</Link>]</small>
        </h2>

        <Table id="students-tbl">
          <thead>
            <tr>
              <th>Student</th>
              <th className={showPasswords ? '' : 'hidden'}>Password</th>
              <th>Details</th>
              <th>Goal Progress</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {studentRows}
          </tbody>
        </Table>

        <label className="checkbox">
          <input type="checkbox" checked={showPasswords} onChange={togglePasswords} /> Show passwords
        </label>
      </div>

      <div>
          <form id="add_form" className="form-inline" acceptCharset="utf-8">
            <fieldset>
              <legend>Add Student</legend>
              <input type="text" placeholder="Name" ref={newStudentName} />{' '}
              <Button onClick={createStudent}>Add</Button>
            </fieldset>
          </form>
      </div>

    </React.Fragment>
  );
};

const StudentRow = ({ student, showPasswords, deleteStudent, setErrMsg }) => {
  const studentUrl = `/students/${student.id}`;
  const editStudentUrl = `/teacher/students/${student.id}`;
  const skill = student.math_skill.replace(/(?<=.)([A-Z])/g, ' $1');

  const [isUpdatingStudent, setIsUpdatingStudent] = React.useState(false);
  const client = React.useContext(ClientContext);

  const passwordRef = React.createRef();

  const updatePassword = () => {
    setErrMsg('');
    setIsUpdatingStudent(true);
    client.updateStudent(student, { password: passwordRef.current.value })
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
          <Link to={editStudentUrl} title="Click to edit this student's settings">
            manage { /*<i className="icon-pencil" title="Edit student settings"></i>*/ }
          </Link>
        </div>
        <div>
          <Link to={studentUrl} title="Right click to copy private link for student">
            workbook
          </Link>
        </div>
      </td>
      <td className={showPasswords ? '' : 'hidden'}>
        <div className="input-append">
          <input className="input-mini" type="text" defaultValue={student.password} ref={passwordRef} />{' '}
          { isUpdatingStudent 
            ? 'Updating ...'
            : <button className="btn pw_btn" type="button" onClick={updatePassword}>Update</button>
          }
        </div>
      </td>
      <td>
        <div className="student-details">
          <div className="detail-label">Current skill</div>
          <div className="detail-value">{skill}</div>
          <div className="detail-label">Difficulty level</div>
          <div className="detail-value">{student.difficulty}</div>
          <div className="detail-label">Sheets completed</div>
          <div className="detail-value">{student.last_sheet}</div>
        </div>
      </td>
      <StudentProgressTd student={student} />
      <td>
        <Button variant="outline-secondary" onClick={() => deleteStudent(student)}>
          &times;
        </Button>
      </td>
    </tr>
  );
};

export default TeacherMainPage;
