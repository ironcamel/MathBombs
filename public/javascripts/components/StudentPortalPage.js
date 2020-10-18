
const StudentPortalPage = () => {
  const { Redirect } = ReactRouterDOM;
  const [students, setStudents] = React.useState([]);
  const [loggedInStudent, setLoggedInStudent] = React.useState();
  const [teacher, setTeacher] = React.useState();
  const [errMsg, setErrMsg] = React.useState();

  const { teacher_id } = ReactRouterDOM.useParams();

  const client = React.useContext(ClientContext);

  React.useEffect(() => getStudents(), []);

  const getStudents = () => {
    client.getStudents({ teacher_id }).then(data => {
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setStudents(data.data);
        setTeacher(data.meta.teacher);
      }
    });
  };

  const checkPassword = (student) => {
    var password = prompt('What is your password?');
    if (password == null) return;
    if (student.password === password) {
      setLoggedInStudent(student);
    } else {
      alert('Invalid password');
    }
  };

  if (loggedInStudent) {
    const student = loggedInStudent;
    const url = `/students/${student.id}/sheets/${student.last_sheet+1}`;
    return <Redirect push to={url} />;
  }

  const studentRows = students.map((student) => (
    <StudentPortalRow key={student.id} student={student} checkPassword={checkPassword} />
  ));

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

          { teacher &&
          <h2 className="offset1"> {teacher.name}'s Students </h2>
          }

          <table id="students-tbl" className="table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Goal Progress</th>
              </tr>
            </thead>
            <tbody>
              {studentRows}
            </tbody>
          </table>

        </div>
      </div>

    </React.Fragment>
  );
};

const StudentPortalRow = ({ student, checkPassword }) => {
  const { Link } = ReactRouterDOM;
  const studentClicked = (student) => (e) => {
    e.preventDefault();
    checkPassword(student)
  };

  return (
    <tr key={student.id}>
      <td>
        <Link to="#" onClick={studentClicked(student)}>{student.name}</Link>
      </td>
      <StudentProgressTd student={student} />
    </tr>
  );
}

