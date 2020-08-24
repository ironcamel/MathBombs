
const ForgotPasswordPage = () => {
  const [email, setEmail] = React.useState('');
  const [errMsg, setErrMsg] = React.useState(null);
  const [statusMsg, setStatusMsg] = React.useState('');
  const [isDone, setIsDone] = React.useState(false);

  const checkEmail = () => {
    setStatusMsg('Checking email ...');
    setErrMsg('');
    fetch('/api/password-reset-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({email}),
    })
    .then(res => res.json())
    .then(data => {
      if (data.err) {
        setStatusMsg('');
        setErrMsg(data.err);
      } else {
        setIsDone(true);
        setStatusMsg("An email has been set to you. Click the link in the email to reset your password.");
        setErrMsg('');
      }
    });
  };

  const emailChanged = (e) => setEmail(e.target.value);

  const alertDiv = errMsg ?
    (
      <div className="alert alert-error">
        <strong>Error!</strong> {errMsg}
      </div>
    ) : '';

  return (
    <React.Fragment>

      <form className="form-inline well" method="post" acceptCharset="utf-8">
        <fieldset>
          <legend>Enter your email</legend>
          <input name='email' type="text" placeholder="Email" onChange={emailChanged} />{' '}
          { isDone || <button type="button" className="btn" onClick={checkEmail}>Submit</button> }
        </fieldset>
      </form>

      <div>
        {statusMsg}
      </div>

      {alertDiv}

    </React.Fragment>
  );
};
