
const ClientContext = React.createContext();

const App = () => {
  const { BrowserRouter, Link, Redirect } = ReactRouterDOM;
  const [teacher, setTeacher] = React.useState();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [authToken, setAuthToken] = React.useState(window.localStorage.getItem('auth-token'));
  const [client, setClient] = React.useState(new MathBombsClient({ authToken }));

  React.useEffect(() => {
    const teacherJson = window.localStorage.getItem('teacher');
    if (teacherJson) {
      setTeacher(JSON.parse(teacherJson));
    }
    setIsInitializing(false);
  }, []);

  React.useEffect(() => {
    setClient(new MathBombsClient({ authToken }));
  }, [authToken]);

  const body = isInitializing 
    ? <img src="/images/spinner.gif" className="spinner" />
    : <ClientContext.Provider value={client}>
      <Routes teacher={teacher} setTeacher={setTeacher} setAuthToken={setAuthToken} />
    </ClientContext.Provider>;

  return (
    <div className="container well" id="page">
      <BrowserRouter>
        <NavBar teacher={teacher} setTeacher={setTeacher} setAuthToken={setAuthToken} />
        {body}
      </BrowserRouter>
    </div>
  );
};

const NavBar = ({ teacher, setTeacher, setAuthToken }) => {
  const { Link } = ReactRouterDOM;

  const authToken = window.localStorage.getItem('auth-token');

  const logoutClicked = (e) => {
    //e.preventDefault();
    window.localStorage.removeItem('auth-token');
    window.localStorage.removeItem('teacher');
    setAuthToken(null);
    setTeacher(null);
    fetch('/api/auth-tokens', {
      method: 'DELETE',
      headers: { 'x-auth-token': authToken },
    });
  }

  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" >MathBombs</Link>
        <ul className="nav">
          <li>
            <Link to="/">Home</Link>
          </li>
          { teacher &&
          <li><Link to="/teacher/students">Students</Link></li>
          }
          <li>
            <Link to="/help">Help</Link>
          </li>
        </ul>
        { teacher
        ? <ul className="nav pull-right">
          <li id="fat-menu" className="dropdown">
            <a href="#" id="drop1" role="button" className="dropdown-toggle" data-toggle="dropdown">{teacher.email} <b className="caret"></b></a>
            <ul className="dropdown-menu" role="menu" aria-labelledby="drop1">
              <li>
                <Link to="/logout" onClick={logoutClicked}>Logout</Link>
              </li>
              <li>
                <Link to="/teacher/profile">Edit profile</Link>
              </li>
            </ul>
          </li>
        </ul>
        : <ul className="nav pull-right">
          <li>
            <Link to="/login">login</Link>
          </li>
        </ul>
        }
      </div>
    </div>
  );
}

const Routes = ({ teacher, setTeacher, setAuthToken }) => {
  const { Route, Switch, Redirect } = ReactRouterDOM;
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
          : <Redirect to="/login" />
        }
      </Route>
      <Route path="/teacher/students">
        { teacher
          ? <TeacherMainPage teacher={teacher} />
          : <Redirect to="/login" />
        }
      </Route>
      <Route path="/teacher/profile">
        { teacher
          ? <TeacherProfilePage />
          : <Redirect to="/login" />
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
        { teacher
          ? <Redirect to="/teacher/students" />
          : <HomePage />
        }
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
    <ReactMathJax.Provider>
        <div>
            This is an inline math formula: <ReactMathJax.Node inline formula={'a = b'} />
            <br/>
            And a block one:
            <ReactMathJax.Node formula={tex} />
        </div>
    </ReactMathJax.Provider>
  );
};


