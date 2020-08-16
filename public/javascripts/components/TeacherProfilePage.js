
const TeacherProfilePage = () => {
  const [errMsg, setErrMsg] = React.useState(null);
  const [isUpdatingTeacher, setIsUpdatingTeacher] = React.useState(null);

  const printerRef = React.createRef();

  const teacher = JSON.parse(window.localStorage.getItem('teacher'));
  const authToken = window.localStorage.getItem('auth-token');

  const updateTeacher = () => {
    setErrMsg('');
    setIsUpdatingTeacher(true);
    fetch('/api/teachers/' + teacher.id, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
      body: JSON.stringify({
        rewards_email: printerRef.current.value
      }),
    })
    .then(res => res.json())
    .then(data => {
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

      <div className="row">
        <div className="span12">

          <form acceptCharset="utf-8">
            <fieldset>

              <legend> {teacher.name} Profile </legend>

              <label className="control-label" htmlFor="email">Email</label>
              <input type="text" id="email" disabled="disabled" className="input-large"
                defaultValue={teacher.email}
              />

              <label htmlFor="printer_email">Printer email (for printing reward coupons)</label>
              <input type="text" id="printer_email" className="input-large"
                defaultValue={teacher.rewards_email}
                ref={printerRef}
              />

              <br/>

              { isUpdatingTeacher
                ? <div>
                  Saving ...
                  <img src="/images/spinner.gif" style={{ width: '50px', marginLeft: '0px' }} />
                </div>
                : <button type="button" className="btn" onClick={updateTeacher}>Save</button>
              }

            </fieldset>
          </form>
        </div>
      </div>

    </React.Fragment>
  );

};
