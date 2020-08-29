
const WorkbookRedirect = () => {
  const { Redirect } = ReactRouterDOM;
  const [student, setStudent] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState(null);
  React.useEffect(() => getStudent(), []);

  let { student_id } = ReactRouterDOM.useParams();

  const authToken = window.localStorage.getItem('auth-token');

  const getStudent = () => {
    fetch('/api/students/' + student_id, {
      method: 'GET',
      headers: { 'x-auth-token': authToken },
    })
    .then(res => res.json())
    .then(data => {
      //console.log('student:', data);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setStudent(data.data);
      }
    });
  };

  if (student) {
    const url = `/students/${student_id}/sheets/${student.last_sheet+1}`;
    return <Redirect to={url} />;
  }

  return (
    <div>
      { errMsg &&
      <div className="alert alert-error">
        <button type="button" className="close" onClick={() => setErrMsg('')}>×</button>
        <strong>Error!</strong> {errMsg}
      </div>
      }
      <img src="/images/spinner.gif" className="spinner" />
    </div>
  );

};
