const LoginPage = ({ teacher, setTeacher, setAuthToken }) => {
  const { Link, Redirect } = ReactRouterDOM;
  const [errMsg, setErrMsg] = React.useState(null);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isCreatingTeacher, setIsCreatingTeacher] = React.useState(false);
  const emailRef = React.createRef();
  const newEmailRef = React.createRef();
  const passwordRef = React.createRef();
  const password1Ref = React.createRef();
  const password2Ref = React.createRef();
  const nameRef = React.createRef();

  const client = React.useContext(ClientContext);

  const signIn = () => {
    setErrMsg('');
    setIsLoggingIn(true);
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    client.createAuthToken({ email, password }).then(data => {
      setIsLoggingIn(false);
      if (data.error) {
        setErrMsg(data.error);
      } else {
        const { teacher, token } = data.data;
        window.localStorage.setItem('teacher', JSON.stringify(teacher));
        window.localStorage.setItem('auth-token', token);
        setAuthToken(token);
        if (email === 'admin@mathbombs.org') {
          setIsAdmin(true);
        } else {
          setTeacher(teacher);
          setLoggedIn(true);
        }
      }
    });
  };

  if (loggedIn && teacher) {
    return <Redirect to="/teacher/students" />;
  }
  if (isAdmin) return <Redirect to="/admin" />;

  const createTeacher = () => {
    setErrMsg('');
    const name = nameRef.current.value;
    const email = newEmailRef.current.value;
    const password1 = password1Ref.current.value;
    const password2 = password2Ref.current.value;
    const password = password1;

    if (!password1.length) {
      setErrMsg("A passwords is required for new accounts");
      window.scrollTo(0, 0);
      return;
    }

    if (password1 != password2) {
      setErrMsg("The passwords don't match");
      window.scrollTo(0, 0);
      return;
    }

    setIsCreatingTeacher(true);
    client.createTeacher({ name, email, password }).then(data => {
      setIsCreatingTeacher(false);
      if (data.error) {
        setErrMsg(data.error);
      } else {
        const { data: teacher, meta } = data;
        window.localStorage.setItem('auth-token', meta.auth_token);
        window.localStorage.setItem('teacher', JSON.stringify(teacher));
        setTeacher(teacher);
        setLoggedIn(true);
      }
    });
  };

  const loginBtn = isLoggingIn
    ? "Signing in ..."
    : <button type="button" className="btn" onClick={signIn}>Sign in</button>;

  const createBtn = isCreatingTeacher
    ? "Creating teacher ..."
    : <button type="button" className="btn" onClick={createTeacher}>Create account</button>;

  return (
    <React.Fragment>

      { errMsg &&
      <div className="alert alert-error">
        <button type="button" className="close" onClick={() => setErrMsg('')}>×</button>
        <strong>Error!</strong> {errMsg}
      </div>
      }

      <form className="form-inline well" acceptCharset="utf-8">
        <fieldset>
          <legend>Login</legend>
          <input type="text" placeholder="Email" ref={emailRef} />{' '}
          <input type="password" className="input-small" placeholder="Password" ref={passwordRef} />{' '}
          {loginBtn}
        </fieldset>
      </form>

      <p>
        <Link to="forgot-password">Forgot Password?</Link>
      </p>

      <br />
      <br />

      <form className="form-horizontal well" acceptCharset="utf-8">
        <fieldset>
          <legend>Create a new account</legend>

          <div className="control-group">
            <label className="control-label" htmlFor="new_name">Name</label>
            <div className="controls">
              <input type="text" maxLength="100" ref={nameRef} />
            </div>
          </div>

          <div className="control-group">
            <label className="control-label" htmlFor="new_email">Email</label>
            <div className="controls">
              <input type="text" maxLength="100" ref={newEmailRef} />
            </div>
          </div>

          <div className="control-group">
            <label className="control-label" htmlFor="new_password">Password</label>
            <div className="controls">
              <input type="password" ref={password1Ref} />
            </div>
          </div>

          <div className="control-group">
            <label className="control-label" htmlFor="new_password2">Verify password</label>
            <div className="controls">
              <input type="password" ref={password2Ref} />
            </div>
          </div>

          <div className="control-group">
            <div className="controls">
              {createBtn}
            </div>
          </div>

        </fieldset>
      </form>

    </React.Fragment>
  );
};
