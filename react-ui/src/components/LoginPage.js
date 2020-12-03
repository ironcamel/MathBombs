import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { ClientContext } from '../MathBombsClient';
import StudentProgressTd from './StudentProgressTd';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';

const LoginPage = ({ teacher, setTeacher, setAuthToken }) => {
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

    if (password1 !== password2) {
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
    : <Button onClick={signIn}>Sign in</Button>;

  const createBtn = isCreatingTeacher
    ? "Creating teacher ..."
    : <Button onClick={createTeacher}>Create account</Button>;

  return (
    <React.Fragment>

      { errMsg &&
      <div className="alert alert-error">
        <button type="button" className="close" onClick={() => setErrMsg('')}>×</button>
        <strong>Error!</strong> {errMsg}
      </div>
      }

      <br/>

      <h4>Login</h4>

      <Form>
        <Form.Row>
          <Col>
            <Form.Control ref={emailRef} type="email" placeholder="Email" />
          </Col>
          <Col>
            <Form.Control ref={passwordRef} type="password" placeholder="Password" />
          </Col>
          <Col>
          {loginBtn}
          </Col>
        </Form.Row>
      </Form>

      <p>
        <Link to="forgot-password">Forgot password?</Link>
      </p>

<hr/>
      <h4>Create a new account</h4>

      <Form.Group controlId="new-name">
        <Form.Label>Name</Form.Label>
        <Form.Control type="text" ref={nameRef}>
        </Form.Control>
      </Form.Group>

      <Form.Group controlId="new-email">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" ref={newEmailRef}/>
      </Form.Group>

      <Form.Group controlId="new-pw1">
        <Form.Label>Password</Form.Label>
        <Form.Control type="password" ref={password1Ref}/>
      </Form.Group>

      <Form.Group controlId="new-pw2">
        <Form.Label>Verify password</Form.Label>
        <Form.Control type="password" ref={password2Ref}/>
      </Form.Group>

      {createBtn}

    </React.Fragment>
  );
};

export default LoginPage;
