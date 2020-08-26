
const MathSheetPage = () => {
  const { Link } = ReactRouterDOM;
  const [student, setStudent] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState(null);
  const [skills, setSkills] = React.useState([]);
  const [skill, setSkill] = React.useState('');
  const [problemsPerSheet, setProblemsPerSheet] = React.useState(0);
  const [problems, setProblems] = React.useState([]);
  const [problemsById, setProblemsById] = React.useState({});
  const [difficulty, setDifficulty] = React.useState(0);
  const [isUpdatingStudent, setIsUpdatingStudent] = React.useState(false);
  const [isCreatingRewards, setIsCreatingRewards] = React.useState(false);
  const [sampleProblem, setSampleProblem] = React.useState(null);
  const [rewards, setRewards] = React.useState([]);
  const [powerup1, setPowerup1] = React.useState(0);
  const [powerup2, setPowerup2] = React.useState(0);
  const [isTargeting, setIsTargeting] = React.useState(false);

  let { student_id, sheet_id } = ReactRouterDOM.useParams();
  sheet_id = parseInt(sheet_id);

  React.useEffect(() => {
    getStudent();
  }, []);

  React.useEffect(() => {
    getProblems();
  }, [sheet_id]);

  const authToken = window.localStorage.getItem('auth-token');

  const getStudent = () => {
    fetch('/api/students/' + student_id, {
      method: 'GET',
      headers: { 'x-auth-token': authToken },
    })
    .then(res => res.json())
    .then(data => {
      //console.log('student:', data);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        const s = data.data;
        setStudent(s);
        setSkill(s.math_skill);
        setProblemsPerSheet(s.problems_per_sheet);
        setDifficulty(s.difficulty);
        setPowerup1(s.powerups[1].cnt);
        setPowerup2(s.powerups[2].cnt);
      }
    });
  };

  const getProblems = () => {
    fetch('/api/problems', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
      body: JSON.stringify({ student_id, sheet_id }),
    })
    .then(res => res.json())
    .then(data => {
      //console.log('problems:', data);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setProblemsById(data.data.reduce((o,p) => ({...o, [p.id]: p}), {}));
        setProblems(data.data.map(p => p.id));
      }
    });
  };

  const saveProblem = (problem) => {
    fetch('/api/problems/' + problem.id, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
      body: JSON.stringify({ student_id, sheet_id, guess: problem.guess }),
    })
    .then(res => res.json())
    .then(data => {
      //console.log('saved:', data);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
          if (data.meta && data.meta.reward) {
            alert(data.meta.reward);
          }
      }
    });
  };

  const updatePowerup = ({ powerup_id, cnt }) => {
    cnt = parseInt(cnt);
    fetch('/api/powerups', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
      body: JSON.stringify({
        student_id: student.id,
        powerup_id,
        cnt,
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        const cnt = data.data.cnt;
        if (powerup_id == 1) {
          setPowerup1(cnt)
        } else if (powerup_id == 2) {
          setPowerup2(cnt)
        }
      }
    });
  };

  const updateProblem = (problem) => {
    setProblemsById({ ...problemsById, [problem.id]: problem });
    saveProblem(problem);
  };

  const killWithFire = (problemDiv) => {
    $(problemDiv).killWithFire({ image_path: '/images/' });
  };

  const problemClicked = (problem) => (e) => {
    if (isTargeting) {
      setIsTargeting(false);
      updateProblem({ ...problem, guess: problem.answer });
      updatePowerup({ powerup_id: 1, cnt: powerup1 - 1 });
      killWithFire(e.target.closest('div.problem'));
    }
  };

  const problemBlocks = problems.map((pId) => {
    const p = problemsById[pId];
    return (
      <ProblemBlock
        key={p.id}
        problem={p}
        updateProblem={updateProblem}
        isTargeting={isTargeting}
        problemClicked={problemClicked}
      />
    );
  });

  const prevUrl = `/students/${student_id}/sheets/${sheet_id - 1}`;
  const nextUrl = `/students/${student_id}/sheets/${sheet_id + 1}`;

  const errorDiv = errMsg ? (
    <div className="alert alert-error">
      <button type="button" className="close" onClick={() => setErrMsg('')}>×</button>
      <strong>Error!</strong> {errMsg}
    </div>
  ) : null;

  const pu1Clicked = () => {
    if (powerup1 <= 0) {
      setIsTargeting(false);
    } else {
      setIsTargeting(!isTargeting);
    }
  };

  const isAllSolved = Object.values(problemsById).every(p => p.guess == p.answer);

  const pu2Clicked = () => {
    if (powerup2 <= 0 || isAllSolved) return;
    const newProblemsById = {};
    problems.forEach((id) => {
      const problem = problemsById[id];
      const newProblem = { ...problem, guess: problem.answer };
      if (problem.guess !== newProblem.guess) {
        saveProblem(newProblem);
      }
      newProblemsById[problem.id] = newProblem;
    });
    setProblemsById(newProblemsById);
    updatePowerup({ powerup_id: 2, cnt: powerup2 - 1 });
    document.querySelectorAll('div.problem').forEach(p => killWithFire(p));
  };

  const showNextLink = !!problems.length && isAllSolved;

  if (!student) {
    return errorDiv ? errorDiv : (
      <img src="/images/spinner.gif" style={{ width: '100px' }} />
    );
  }

  return (
    <div className={ isTargeting ? "targeting" : "" }>
      {errorDiv}

      <div className="row">
        <h1 className="offset1">
          { student &&
          <div>
          {student.name}'s Workbook <small> sheet {sheet_id} </small>
          </div>
          }
        </h1>
      </div>

      <div className="row">
        <div className="span10 problems">
          <ReactMathJax.Provider>{problemBlocks}</ReactMathJax.Provider>
        </div>

        { student &&
        <div className="span2">
          <h4> Progress </h4>
            <a href={`/students/${student_id}/report`}>
              7 day goal: {student.past_week} / 7
              <div className="progress">
                <div className="bar bar-success" style={{width: (student.past_week / 7 * 100) + '%'}}></div>
              </div>
            </a>
            <a href={`/students/${student_id}/report`}>
              30 day goal: {student.past_month} / 30
              <div className="progress">
                <div className="bar bar-success" style={{width: (student.past_month / 30 * 100) + '%'}}></div>
              </div>
            </a>
          <hr />
          <h4> Power-Ups </h4>
          <p>
            <img src="/images/bomb-64.png" onClick={pu1Clicked} />
            &times; <span>{powerup1}</span>
          </p>
          <p>
            <img src="/images/nuclear.gif" style={{width: '64px'}} onClick={pu2Clicked} />
            &times; <span>{powerup2}</span>
          </p>
        </div>
        }

      </div>

      <div className="row">
        <div className="span12 prev-next">

          { (sheet_id > 1) &&
          <span className="prev-link">
            <Link className="btn btn-small" to={prevUrl}>&lt;&lt; previous</Link>
          </span>
          }

          { showNextLink &&
          <span className="next-link pull-right">
            <Link className="btn btn-small btn-primary" to={nextUrl}>next &gt;&gt;</Link>
          </span>
          }

        </div>
      </div>
    </div>
  );

};

const ProblemBlock = ({ problem, updateProblem, isTargeting, problemClicked }) => {
  const answerChanged = (problem) => (e) => {
    updateProblem({ ...problem, guess: e.target.value });
  };

  const cls = isTargeting ? 'problem problem-targetable' : 'problem';

  return (
    <div className={cls} onClick={problemClicked(problem)}>
      <span className="problem_number">{problem.id})</span>
      <div className="eqn">
        <ReactMathJax.Node formula={problem.question} />
      </div>
      <hr/>
      <input type="text"
        className={problem.guess == problem.answer ? "guess correct-answer" : "guess"}
        onChange={answerChanged(problem)}
        value={problem.guess == null ? '' : problem.guess }
      />
    </div>
  );
};

// vi: fdm=indent fdn=2 syntax=javascript
