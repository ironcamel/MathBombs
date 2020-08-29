
const MathSheetPage = () => {
  const { Link } = ReactRouterDOM;
  const [student, setStudent] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState(null);
  const [skills, setSkills] = React.useState([]);
  const [skill, setSkill] = React.useState('');
  const [problemsPerSheet, setProblemsPerSheet] = React.useState(0);
  const [problemsById, setProblemsById] = React.useState({});
  const [difficulty, setDifficulty] = React.useState(0);
  const [isUpdatingStudent, setIsUpdatingStudent] = React.useState(false);
  const [isCreatingRewards, setIsCreatingRewards] = React.useState(false);
  const [sampleProblem, setSampleProblem] = React.useState(null);
  const [rewards, setRewards] = React.useState([]);
  const [powerup1, setPowerup1] = React.useState(0);
  const [powerup2, setPowerup2] = React.useState(0);
  const [isTargeting, setIsTargeting] = React.useState(false);
  const [fetchingProblems, setFetchingProblems] = React.useState(false);
  const [wonPowerup, setWonPowerup] = React.useState();
  const modal1Ref = React.createRef();
  const modal2Ref = React.createRef();

  let { student_id, sheet_id } = ReactRouterDOM.useParams();
  sheet_id = parseInt(sheet_id);
  const probObjects = Object.values(problemsById);
  const isAllSolved = probObjects.length && probObjects.every(p => p.guess == p.answer);

  React.useEffect(() => {
    getStudent();
  }, []);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    getProblems();
  }, [sheet_id]);

  React.useEffect(() => {
    if (wonPowerup) {
      setWonPowerup(null);
      if (wonPowerup.id == 1) {
        $(modal1Ref.current).modal();
      } else if (wonPowerup.id == 2) {
        $(modal2Ref.current).modal();
      }
    }
  }, [wonPowerup]);

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
    setFetchingProblems(true);
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
      setFetchingProblems(false);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setProblemsById(data.data.reduce((o,p) => ({...o, [p.id]: p}), {}));
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
          const meta = data.meta || {};
          const { powerup, reward } = meta;
          if (powerup) {
            if (powerup.id == 1) {
              setPowerup1(powerup.cnt)
            } else if (powerup.id == 2) {
              setPowerup2(powerup.cnt)
            }
            setWonPowerup(powerup);
          }
          if (reward) {
            alert(reward);
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

  const problemBlocks = Object.values(problemsById).sort((a, b) => a.id - b.id).map(p => (
      <ProblemBlock
        key={p.id}
        problem={p}
        updateProblem={updateProblem}
        isTargeting={isTargeting}
        problemClicked={problemClicked}
      />
  ));

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

  const pu2Clicked = () => {
    if (powerup2 <= 0 || isAllSolved) return;
    const newProblemsById = {};
    Object.values(problemsById).forEach((problem) => {
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

  if (!student || fetchingProblems) {
    return errorDiv ? errorDiv : (
      <img src="/images/spinner.gif" className="spinner" />
    );
  }

  return (
    <div className={ isTargeting ? "targeting" : "" }>
      {errorDiv}

      <div>
        <h1 className="offset1">
          <div>
          {student.name}'s Workbook <small> sheet {sheet_id} </small>
          </div>
        </h1>
      </div>

      <div className="sheet-body">
        <div className="problems">
          <ReactMathJax.Provider>{problemBlocks}</ReactMathJax.Provider>
        </div>

        <div className="sheet-sidebar">
          <h4> Progress </h4>
            <Link to={`/students/${student_id}/report`}>
              7 day goal: {student.past_week} / 7
              <div className="progress">
                <div className="bar bar-success" style={{width: (student.past_week / 7 * 100) + '%'}}></div>
              </div>
            </Link>
            <Link to={`/students/${student_id}/report`}>
              30 day goal: {student.past_month} / 30
              <div className="progress">
                <div className="bar bar-success" style={{width: (student.past_month / 30 * 100) + '%'}}></div>
              </div>
            </Link>
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

      </div>

      <div className="prev-next">

        { (sheet_id > 1) &&
        <span className="prev-link">
          <Link className="btn btn-small" to={prevUrl}>&lt;&lt; previous</Link>
        </span>
        }

        { isAllSolved &&
        <span className="next-link pull-right">
          <Link className="btn btn-small btn-primary" to={nextUrl}>next &gt;&gt;</Link>
        </span>
        }

      </div>

      <PowerupModal powerup_id={1} ref={modal1Ref} setIsTargeting={setIsTargeting} />
      <PowerupModal powerup_id={2} ref={modal2Ref} setIsTargeting={setIsTargeting} />

    </div>
  );

};

const ProblemBlock = ({ problem, updateProblem, isTargeting, problemClicked }) => {
  const answerChanged = (problem) => (e) => {
    updateProblem({ ...problem, guess: e.target.value });
  };

  const cls = isTargeting ? 'problem problem-targetable' : 'problem';
  const isCorrect = problem.guess == problem.answer;

  return (
    <div className={cls} onClick={problemClicked(problem)}>
      <span className="problem_number">{problem.id})</span>
      <div className="eqn">
        <ReactMathJax.Node formula={problem.question} />
      </div>
      <hr/>
      <input type="text"
        className={isCorrect ? "guess correct-answer" : "guess"}
        disabled={false && isCorrect}
        onChange={answerChanged(problem)}
        value={problem.guess == null ? '' : problem.guess }
      />
    </div>
  );
};

const PowerupModal = React.forwardRef(({ powerup_id, setIsTargeting }, ref) => {
  let name, img;
  if (powerup_id == 1) {
    name = 'Bomb';
    img = 'bomb-128.png';
  } else {
    name = 'Super Bomb';
    img = 'nuclear.gif';
  }
  const bombPath = "/uidesign-images/" + img;

  const boomClicked = () => {
    setIsTargeting(true);
  };

  return (
    <div className="modal hide fade" ref={ref} >
      <div className="modal-header">
        <button type="button" className="close" data-dismiss="modal"
            aria-hidden="true">&times;</button>
        <h3>You got the {name}!</h3>
      </div>
      <div className="modal-body">
        <p style={{textAlign: 'center'}}>
          <img src={bombPath} />
        </p>
      </div>
      <div className="modal-footer">
        { powerup_id == 1
        ? <div>
          <button type="button" className="btn" data-dismiss="modal">Save for later</button>
          <button type="button" className="btn btn-primary" data-dismiss="modal" onClick={boomClicked}>Boom!</button>
        </div>
        : <button type="button" className="btn btn-primary" data-dismiss="modal">OK</button>
        }
      </div>
    </div>
  );
});

// vi: fdm=indent fdn=2 syntax=javascript
