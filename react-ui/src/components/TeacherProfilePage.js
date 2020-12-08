import React from 'react';
import { ClientContext } from '../MathBombsClient';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const TeacherProfilePage = () => {
  const [errMsg, setErrMsg] = React.useState(null);
  const [isUpdatingTeacher, setIsUpdatingTeacher] = React.useState(null);

  const printerRef = React.createRef();

  const teacher = JSON.parse(window.localStorage.getItem('teacher'));
  const client = React.useContext(ClientContext);

  const updateTeacher = () => {
    setErrMsg('');
    setIsUpdatingTeacher(true);
    const update = { rewards_email: printerRef.current.value };
    client.updateTeacher(teacher, update).then(data => {
      setIsUpdatingTeacher(false);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        window.localStorage.setItem('teacher', JSON.stringify(data.data));
      }
    });
  };

  return (
    <React.Fragment>

      { errMsg &&
      <div className="alert alert-error">
        <button type="button" className="close" onClick={() => setErrMsg('')}>×</button>
        <strong>Error!</strong> {errMsg}
      </div>
      }

      <div>

          <form acceptCharset="utf-8">
            <fieldset>

              <legend> {teacher.name}'s Profile </legend>

              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" readOnly defaultValue={teacher.email} />
              </Form.Group>

              <Form.Group>
                <Form.Label>Printer email (for printing reward coupons)</Form.Label>
                <Form.Control type="text" ref={printerRef} defaultValue={teacher.rewards_email} />
              </Form.Group>

              { isUpdatingTeacher ?
              <div>
                Saving ...
                <img src="/images/spinner.gif" style={{ width: '50px', marginLeft: '0px' }} alt=''/>
              </div>
              :
              <Button onClick={updateTeacher}>Save</Button>
              }

            </fieldset>
          </form>
      </div>

    </React.Fragment>
  );

};

export default TeacherProfilePage;
