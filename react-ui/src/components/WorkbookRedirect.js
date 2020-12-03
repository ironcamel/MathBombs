import React from 'react';
import { Redirect, useParams } from "react-router-dom";
import { ClientContext } from '../MathBombsClient';

const WorkbookRedirect = () => {
  const [student, setStudent] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState(null);

  React.useEffect(() => getStudent(), []);

  const client = React.useContext(ClientContext);

  let { student_id } = useParams();

  const getStudent = () => {
    client.getStudent(student_id).then(data => {
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

export default WorkbookRedirect;
