import React from 'react';
import MathJax from 'react-mathjax';
import { BrowserRouter, Link, Route, Switch, Redirect } from "react-router-dom";
import { ClientContext, MathBombsClient } from '../MathBombsClient';
import ForgotPasswordPage from './ForgotPasswordPage';
import HelpPage from './HelpPage';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import MathSheetPage from './MathSheetPage';
import PasswordResetPage from './PasswordResetPage';
import ReportPage from './ReportPage';
import StudentEditPage from './StudentEditPage';
import StudentPortalPage from './StudentPortalPage';
import TeacherMainPage from './TeacherMainPage';
import TeacherProfilePage from './TeacherProfilePage';
import WorkbookRedirect from './WorkbookRedirect';
import config from '../config';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import NavDropdown from 'react-bootstrap/NavDropdown';

function createClient({ authToken }) {
  const baseUrl = config.api_base_url;
  return new MathBombsClient({ authToken, baseUrl });
}

function App() {
  const [teacher, setTeacher] = React.useState();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [authToken, setAuthToken] = React.useState(window.localStorage.getItem('auth-token'));
  const [client, setClient] = React.useState(createClient({ authToken }));

  React.useEffect(() => {
    const teacherJson = window.localStorage.getItem('teacher');
    if (teacherJson) {
      setTeacher(JSON.parse(teacherJson));
    }
    setIsInitializing(false);
  }, []);

  React.useEffect(() => {
    setClient(createClient({ authToken }));
  }, [authToken]);

  const body = isInitializing 
    ? <img src="/images/spinner.gif" className="spinner" alt=""/>
    : <Routes teacher={teacher} setTeacher={setTeacher} setAuthToken={setAuthToken} />;

  return (
    <div className="container well" id="page">
      <BrowserRouter>
        <ClientContext.Provider value={client}>
          <NavbarCont teacher={teacher} setTeacher={setTeacher} setAuthToken={setAuthToken} />
          {body}
        </ClientContext.Provider>
      </BrowserRouter>
    </div>
  );
}

const NavbarCont = ({ teacher, setTeacher, setAuthToken }) => {
  const client = React.useContext(ClientContext);

  const logoutClicked = (e) => {
    //e.preventDefault();
    window.localStorage.removeItem('auth-token');
    window.localStorage.removeItem('teacher');
    setAuthToken(null);
    setTeacher(null);
    client.deleteAuthTokens();
  }

  return (
    <Navbar bg="light">
        <Navbar.Brand>MathBombs</Navbar.Brand>
        <Nav className="mr-auto">
          <Nav.Item>
            <Nav.Link as={Link} to="/">Home</Nav.Link>
          </Nav.Item>
          { teacher &&
          <Nav.Item>
            <Nav.Link as={Link} to="/teacher/students">Students</Nav.Link>
          </Nav.Item>
          }
          <Nav.Item>
            <Nav.Link as={Link} to="/help">Help</Nav.Link>
          </Nav.Item>
        </Nav>
        { teacher
        ? <NavDropdown title={teacher.email}>
          <NavDropdown.Item as={Link} to="/logout" onClick={logoutClicked}>Logout</NavDropdown.Item>
          <NavDropdown.Item as={Link} to="/teacher/profile">Edit profile</NavDropdown.Item>
        </NavDropdown>
        : <Nav.Item>
          <Nav.Link as={Link} to="/login">login</Nav.Link>
        </Nav.Item>
        }
    </Navbar>
  );
}

const Routes = ({ teacher, setTeacher, setAuthToken }) => {
  return (
    <Switch>
      <Route path="/logout">
        <Redirect to="/login" />;
      </Route>
      <Route path="/students/:student_id/sheets/:sheet_id">
        <MathSheetPage />
      </Route>
      <Route path="/students/:student_id/report">
        <ReportPage />
      </Route>
      <Route path="/students/:student_id">
        <WorkbookRedirect />
      </Route>
      <Route path="/teacher/students/:student_id">
        { teacher
          ? <StudentEditPage />
          : <Redirect push to="/login" />
        }
      </Route>
      <Route path="/teacher/students">
        { teacher
          ? <TeacherMainPage teacher={teacher} />
          : <Redirect push to="/login" />
        }
      </Route>
      <Route path="/teacher/profile">
        { teacher
          ? <TeacherProfilePage />
          : <Redirect push to="/login" />
        }
      </Route>
      <Route path="/forgot-password">
        <ForgotPasswordPage />
      </Route>
      <Route path="/password-reset">
        <PasswordResetPage />
      </Route>
      <Route path="/portals/:teacher_id">
        <StudentPortalPage />
      </Route>
      <Route path="/help">
        <HelpPage />
      </Route>
      <Route path="/foo">
        <Foo />
      </Route>
      <Route path="/login">
        <LoginPage teacher={teacher} setTeacher={setTeacher} setAuthToken={setAuthToken} />
      </Route>
      <Route path="/">
        <HomePage />
        {/*
          teacher
          ? <Redirect push to="/teacher/students" />
          : <HomePage />
        */}
      </Route>
    </Switch>
  );
};

/*
const Foo = () => {
  // our tex equation, using String.raw so we don't have to escape backslashes
  const example = String.raw`\int_{-\infty}^{\infty}e^{-x^2}\ dx`;
  return (
    <div>
      <MathComponent tex={example} display={true} />
      <p style={{'textAlign': 'center'}}> It is hard to compute <MathComponent tex={example} display={false} /> if you don't know much math.
      </p>
    </div>
  );
};
*/

 
const Foo = () => {
  const tex = `f(x) = \\int_{-\\infty}^\\infty
      \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
      \\,d\\xi`;
  return (
    <MathJax.Provider>
        <div>
            This is an inline math formula: <MathJax.Node inline formula={'a = b'} />
            <br/>
            And a block one:
            <MathJax.Node formula={tex} />
        </div>
    </MathJax.Provider>
  );
};

export default App;
