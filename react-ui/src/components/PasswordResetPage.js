import React from 'react';
import { Link } from 'react-router-dom';
import { ClientContext } from '../MathBombsClient';

const PasswordResetPage = () => {
  const [password1, setPassword1] = React.useState('');
  const [password2, setPassword2] = React.useState('');
  const [errMsg, setErrMsg] = React.useState(null);
  const [isDone, setIsDone] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const client = React.useContext(ClientContext);

  const resetPassword = () => {
    setErrMsg('');
    const query = new URLSearchParams(window.location.search);
    const token = query.get('token');
    if (!password1 || password1.length < 4) {
      setErrMsg("password is too short");
      return;
    }
    if (password1 != password2) {
      setErrMsg("Passwords don't match");
      return;
    }
    setIsResetting(true);
    client.resetPassword({ token, password: password1 }).then(data => {
      setIsResetting(false);
      if (data.err) {
        setErrMsg(data.err);
      } else {
        setIsDone(true);
      }
    });
  };

  const password1Changed = (e) => setPassword1(e.target.value);
  const password2Changed = (e) => {
    setPassword2(e.target.value);
    if (password1 == e.target.value) {
      setErrMsg('');
    } else {
      setErrMsg("passwords don't match");
    }
  };

  const errDiv = (
    <div className="alert alert-error">
      <strong>Error!</strong> {errMsg}
    </div>
  );

  return (
    <div>

      <form className="form-horizontal well" acceptCharset="utf-8">
        <fieldset>
          <legend>Reset password</legend>

          <div className="control-group">
            <label className="control-label" htmlFor="new_password">Password</label>
            <div className="controls">
              <input type="password" id="new_password" name="new_password" onChange={password1Changed} />
            </div>
          </div>

          <div className="control-group">
            <label className="control-label" htmlFor="new_password2">Verify password</label>
            <div className="controls">
              <input type="password" id="new_password2" name="new_password2" onChange={password2Changed} />
            </div>
          </div>

          { isDone ||
          <div className="control-group">
            <div className="controls">
              <button type="button" className="btn" onClick={resetPassword}>Submit</button>
            </div>
          </div>
          }

        </fieldset>
      </form>

      { isResetting &&
      <p>
        Resetting password ...
      </p>
      }

      { isDone &&
      <p>
        Your password has been reset. Click here to <Link to="/login">login</Link>.
      </p>
      }

      {errMsg && errDiv}

    </div>
  );
};

export default PasswordResetPage;
