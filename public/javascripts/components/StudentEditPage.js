
const StudentEditPage = () => {
  const [student, setStudent] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState(null);
  const [skills, setSkills] = React.useState([]);
  const [skill, setSkill] = React.useState('');
  const [numProblems, setNumProblems] = React.useState(1);
  const [difficulty, setDifficulty] = React.useState(0);
  const [isUpdatingStudent, setIsUpdatingStudent] = React.useState(false);
  const [isCreatingRewards, setIsCreatingRewards] = React.useState(false);
  const [sampleProblem, setSampleProblem] = React.useState(null);
  const [rewards, setRewards] = React.useState([]);
  const [powerup1, setPowerup1] = React.useState('');
  const [powerup2, setPowerup2] = React.useState('');
  const [isUpdatingPowerup1, setIsUpdatingPowerup1] = React.useState(false);
  const [isUpdatingPowerup2, setIsUpdatingPowerup2] = React.useState(false);
  const [updatedPowerup, setUpdatedPowerup] = React.useState(false);

  const { student_id } = ReactRouterDOM.useParams();

  const rewardRef = React.createRef();
  const sheetRef = React.createRef();

  const authToken = window.localStorage.getItem('auth-token');

  const getStudent = () => {
    fetch('/api/students/' + student_id, {
      method: 'GET',
      headers: { 'x-auth-token': authToken },
    })
    .then(res => res.json())
    .then(data => {
      console.log('student:', data);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        const s = data.data;
        setStudent(s);
        setSkill(s.math_skill);
        setNumProblems(s.problems_per_sheet);
        setDifficulty(s.difficulty);
        setPowerup1(s.powerups[1].cnt);
        setPowerup2(s.powerups[2].cnt);
        getRewards(s);
      }
    });
  };

  const getSampleProblem = () => {
    fetch('/api/students/' + student_id + '/sample-problem', {
      method: 'POST',
      headers: { 'x-auth-token': authToken },
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setSampleProblem(data.data.question);
      }
    });
  };

  const getSkills = () => {
    fetch('/api/skills', {
      method: 'GET',
      headers: { 'x-auth-token': authToken },
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setSkills(data.data);
    });
  };

  const updateStudent = (params) => {
    params = params || {};
    const data = {
      student_id: student.id,
      math_skill: skill,
      problems_per_sheet: numProblems,
      difficulty: difficulty,
      ...params
    }
    setErrMsg('');
    setIsUpdatingStudent(true);
    console.log('updating skill to: ' + skill);
    fetch('/api/students/' + student.id, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
      body: JSON.stringify(data),
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setIsUpdatingStudent(false);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        getSampleProblem();
      }
    });
  };

  const getRewards = (student) => {
    setErrMsg('');
    fetch('/api/rewards?student_id=' + student.id, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
    })
    .then(res => res.json())
    .then(data => {
      console.log('rewards:', data);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setRewards(data.data);
      }
    });
  };

  const createReward = () => {
    setErrMsg('');
    setIsCreatingRewards(true);
    fetch('/api/rewards', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
      body: JSON.stringify({
        reward: rewardRef.current.value,
        student_id: student.id,
        sheet_id: parseInt(sheetRef.current.value),
      }),
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setIsCreatingRewards(false);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setRewards([...rewards, data.data]);
      }
    });
  };

  const updatePowerups = () => {
    setErrMsg('');
    updatePowerup({ powerup_id: 1, cnt: powerup1 });
    updatePowerup({ powerup_id: 2, cnt: powerup2 });
  };

  const updatePowerup = ({ powerup_id, cnt }) => {
    if (powerup_id == 1) {
      setIsUpdatingPowerup1(true);
    } else if (powerup_id == 2) {
      setIsUpdatingPowerup2(true);
    }
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
      console.log(data);
      setIsUpdatingPowerup1(false);
      setIsUpdatingPowerup2(false);
      setUpdatedPowerup(true);
      setTimeout(() => setUpdatedPowerup(false), 3000);
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

  const deleteReward = (reward_id) => {
    setErrMsg('');
    fetch('/api/rewards/' + reward_id, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
        'x-auth-token': authToken,
      },
      body: JSON.stringify({
        student_id: student.id,
      }),
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setRewards(rewards.filter((r) => r.id != reward_id));
      }
    });
  };

  const rewardRows = rewards.map((reward) => {
    let condition;
    if (reward.sheet_id) {
      condition = `Sheet ${reward.sheet_id}`;
    }
    if (reward.week_goal) {
      condition = `Week goal >= ${reward.week_goal}`;
    }
    if (reward.month_goal) {
      condition = `Month goal >= ${reward.month_goal}`;
    }
    return (
      <tr key={reward.id}>
        <td>{condition}</td>
        <td>{reward.reward}</td>
        <td>{ reward.is_given ? 'Yes' : 'No' }</td>
        <td>
          <button type="button" onClick={() => deleteReward(reward.id)}>&times;</button>
        </td>
      </tr>
    );
  });

  React.useEffect(() => {
    getStudent();
    getSkills();
    getSampleProblem();
  }, []);

  const skillOptions = skills.map(s => <option key={s.type} value={s.type}>{s.name}</option>);

  const sheetOptions = [];
  for (let i = 1; i <= 50; i++) {
    if (!student) break;
    const val = student.last_sheet + i;
    sheetOptions[val] = <option key={val} value={val}>{val}</option>;
  }

  const numProblemsOptions = [];
  for (let i = 1; i <= 20; i++) {
    numProblemsOptions.push(<option key={i} value={i}>{i}</option>);
  }

  const skillChanged = (e) => {
    setSkill(e.target.value);
    updateStudent({ math_skill: e.target.value });
  };

  const numProblemsChanged = (e) => {
    setNumProblems(e.target.value);
    updateStudent({ problems_per_sheet: parseInt(e.target.value) });
  };

  const difficultyChanged = (e) => {
    setDifficulty(e.target.value);
    updateStudent({ difficulty: parseInt(e.target.value) });
  };

  const pu1Changed = (e) => setPowerup1(e.target.value);
  const pu2Changed = (e) => setPowerup2(e.target.value);

  const isUpdatingPowerups = isUpdatingPowerup1 || isUpdatingPowerup2;

  return (
    <React.Fragment>

      { errMsg &&
      <div className="alert alert-error">
        <button type="button" className="close" onClick={() => setErrMsg('')}>×</button>
        <strong>Error!</strong> {errMsg}
      </div>
      }

          <form method="post" acceptCharset="utf-8">
            <fieldset>

              <legend>
                { student &&
                <div>
                  {student.name} Settings
                  [<a href={"/students/" + student.id}>workbook</a>]
                </div>
                }
              </legend>

              <div style={{ display: 'flex', flexWrap: 'wrap' }}>

                <div style={{ marginRight: '30px' }}>
                  <label htmlFor="skill_sel">Math skill</label>
                  <select id="skill_sel" value={skill} onChange={skillChanged}>
                    {skillOptions}
                  </select>

                  <label htmlFor="count_sel">Problems per sheet</label>
                  <select id="count_sel" className="input-small" value={numProblems} onChange={numProblemsChanged}>
                    {numProblemsOptions}
                  </select>

                  <p>
                    Difficulty<br/>
                    <label className="radio inline">
                      <input type="radio" value="1" checked={difficulty == 1} onChange={difficultyChanged}/> 1
                    </label>
                    <label className="radio inline">
                      <input type="radio" value="2" checked={difficulty == 2} onChange={difficultyChanged}/> 2
                    </label>
                    <label className="radio inline">
                      <input type="radio" value="3" checked={difficulty == 3} onChange={difficultyChanged}/> 3
                    </label>
                  </p>

                </div>

                <div>
                  <p> Sample problem </p>
                  { sampleProblem &&
                  <div>
                    <p style={{fontSize: '2em'}}>
                      <ReactMathJax.Provider>
                        <ReactMathJax.Node inline formula={sampleProblem} />
                      </ReactMathJax.Provider>
                    </p>
                    <button type="button" onClick={getSampleProblem}>Refresh</button>
                  </div>
                  }
                  { isUpdatingStudent &&
                  <img src="/images/spinner.gif" style={{ width: '100px', marginLeft: '-30px' }} />
                  }
                </div>

              </div>

            </fieldset>
          </form>


      <form id="award_form" acceptCharset="utf-8">
        <fieldset>
          <legend> Rewards </legend>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>

            <div style={{ marginRight: '30px' }}>
              <label htmlFor="sheet_sel">Sheet</label>
              <select id="sheet_sel" className="input-small" ref={sheetRef}>
                {sheetOptions}
              </select>
              <label htmlFor="reward_ta">Reward</label>
              <textarea id="reward_ta" rows="3" ref={rewardRef}
                placeholder="Great Job! Your reward is ..."
              />
              <div>
                <button type="button" onClick={createReward}>Add Reward</button>
              </div>
            </div>

            <div>
              <table className="table table-hover" style={{ width: 'auto' }}>
                <thead>
                  <tr>
                    <th>Condition</th>
                    <th>Reward</th>
                    <th>Awarded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>{rewardRows}</tbody>
              </table>
            </div>

          </div>

        </fieldset>
      </form>

      <div>
        <form id="award_form" acceptCharset="utf-8">
          <fieldset>
            <legend> Power-ups </legend>
            { student &&
            <div>
              <p>
                <img src="/images/bomb-64.png" />
                &times;{' '}
                <input className="input-mini" type="text"
                  onChange={pu1Changed}
                  defaultValue={student.powerups[1].cnt}
                />
              </p>
              <p>
                <img src="/images/nuclear.gif" style={{width: '64px'}} />
                &times;{' '}
                <input className="input-mini" type="text"
                  onChange={pu2Changed}
                  defaultValue={student.powerups[2].cnt}
                />
              </p>
              <button type="button" onClick={updatePowerups} disabled={isUpdatingPowerups}>
                Update power-ups
              </button>{' '}
              { updatedPowerup && <span style={{ color: 'green' }}>Updated power-up</span> }
              { isUpdatingPowerups &&
              <img src="/images/spinner.gif" style={{ width: '100px', marginLeft: '30px', marginTop: '-50px' }} />
              }
            </div>
            }
          </fieldset>
        </form>
      </div>

    </React.Fragment>
  );
};

