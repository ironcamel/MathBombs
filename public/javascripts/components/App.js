
const App = () => {
  const { BrowserRouter, Route, Link, Switch, Redirect } = ReactRouterDOM;
  const [teacher, setTeacher] = React.useState();

  React.useEffect(() => {
    const teacherJson = window.localStorage.getItem('teacher');
    if (teacherJson) {
      setTeacher(JSON.parse(teacherJson));
    }
  }, []);

  const logoutClicked = (e) => {
    console.log('Logout was clicked.');
    window.localStorage.removeItem('auth-token');
    window.localStorage.removeItem('teacher');
    //e.preventDefault();
  }

  const homePage = teacher ? <Redirect to="/teacher/students" /> : <HomePage />;

  return (
    <BrowserRouter>
      <div className="container well" id="page">

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
                    <a href="/logout" onClick={logoutClicked}>Logout</a>
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

        <Switch>
          <Route path="/teacher/students/:student_id">
            { teacher
              ?  <StudentEditPage />
              : <Redirect to="/login" />
            }
          </Route>
          <Route path="/teacher/students">
            { teacher
              ? <TeacherMainPage />
              : <Redirect to="/login" />
            }
          </Route>
          <Route path="/teacher/profile">
            { teacher
              ? <TeacherProfilePage />
              : <Redirect to="/login" />
            }
          </Route>
          <Route path="/portals/:teacher_id">
            <StudentPortalPage />
          </Route>
          <Route path="/help">
            <HelpPage />
          </Route>
          <Route path="/login">
            <LoginPage teacher={teacher} setTeacher={setTeacher} />
          </Route>
          <Route path="/">
            {homePage}
          </Route>
        </Switch>

      </div>

    </BrowserRouter>
  );
};

const HelpPage = () => {
  return (
    <div>
      <p>
      If you have any questions or technical issues,
      you can send an email to <a href="mailto:admin@mathbombs.org">admin@mathbombs.org</a>
      </p>

      <p>
      If you find any bugs or have any feature requests,
      you can create tickets for them on <a href="https://github.com/ironcamel/MathSheets/issues">github</a>.
      </p>

      <div style={{ height: '400px' }}>
        
      </div>
    </div>
  );
};

