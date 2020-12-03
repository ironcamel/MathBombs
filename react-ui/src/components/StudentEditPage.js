import React from 'react';
import { useParams } from 'react-router-dom';
import { ClientContext } from '../MathBombsClient';
import MathJax from 'react-mathjax';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

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
  const [conditionType, setConditionType] = React.useState('sheet');

  const client = React.useContext(ClientContext);

  const { student_id } = useParams();

  const rewardRef = React.createRef();
  const sheetRef = React.createRef();
  const weekGoalRef = React.createRef();
  const monthGoalRef = React.createRef();

  const authToken = window.localStorage.getItem('auth-token');

  const getStudent = () => {
    client.getStudent(student_id).then(data => {
      //console.log('student:', data);
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
    client.createSampleProblem({ student_id }).then(res => {
      if (res.error) {
        setErrMsg(res.error);
        window.scrollTo(0, 0);
      } else {
        setSampleProblem(res.problem.question);
      }
    });
  };

  const getSkills = () => {
    client.getSkills().then(data => {
      setSkills(data.data);
    });
  };

  const updateStudent = (params) => {
    setErrMsg('');
    setIsUpdatingStudent(true);
    client.updateStudent(student, params).then(data => {
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
    client.getRewards({ student_id }).then(data => {
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

    const payload = {
      reward: rewardRef.current.value.trim(),
      student_id,
    };
    if (conditionType === 'sheet') {
      payload.sheet_id = parseInt(sheetRef.current.value);
    } else if (conditionType === 'weekGoal') {
      payload.week_goal = parseInt(weekGoalRef.current.value);
    } else if (conditionType === 'monthGoal') {
      payload.month_goal = parseInt(monthGoalRef.current.value);
    } else {
      return;
    }

    client.createReward(payload).then(data => {
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
    if (!Number.isInteger(cnt) || cnt < 0) {
      setErrMsg('Power-up count must be an integer >= 0');
      window.scrollTo(0, 0);
      return;
    }
    client.updatePowerup({ powerup_id, student_id }, { cnt }).then(data => {
      //console.log(data);
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
    client.deleteReward({ reward_id }).then(data => {
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
      condition = `sheet ${reward.sheet_id}`;
    }
    if (reward.week_goal) {
      condition = `sheets / week >= ${reward.week_goal}`;
    }
    if (reward.month_goal) {
      condition = `sheets / month >= ${reward.month_goal}`;
    }
    return (
      <tr key={reward.id}>
        <td>{condition}</td>
        <td>{reward.reward}</td>
        <td>{ reward.is_given ? 'Yes' : 'No' }</td>
        <td>
          <Button variant="secondary" onClick={() => deleteReward(reward.id)}>&times;</Button>
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
  for (let i = 1; i <= 50 && student; i++) {
    const val = student.last_sheet + i;
    sheetOptions[val] = <option key={val} value={val}>{val}</option>;
  }

  const weekGoalOptions = [];
  for (let i = 1; i <= 50 && student; i++) {
    weekGoalOptions[i] = <option key={i} value={i}>{i}</option>;
  }

  const monthGoalOptions = [];
  for (let i = 1; i <= 100 && student; i++) {
    monthGoalOptions[i] = <option key={i} value={i}>{i}</option>;
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

  const condChanged = (e) => {
    setConditionType(e.target.value);
  }

  return (
    <React.Fragment>

      { errMsg &&
      <div className="alert alert-error">
        <button type="button" className="close" onClick={() => setErrMsg('')}>×</button>
        <strong>Error!</strong> {errMsg}
      </div>
      }

          <form>
            <fieldset>

              <legend>
                { student &&
                <div>
                  {student.name} Settings
                  [<a href={"/students/" + student_id}>workbook</a>]
                </div>
                }
              </legend>

              <div style={{ display: 'flex', flexWrap: 'wrap' }}>

                <div style={{ marginRight: '30px' }}>

                  <Form.Group>
                    <Form.Label>Math skill</Form.Label>
                    <Form.Control as="select" value={skill} onChange={skillChanged}>
                      {skillOptions}
                    </Form.Control>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Problems per sheet</Form.Label>
                    <Form.Control as="select" value={numProblems} onChange={numProblemsChanged}>
                      {numProblemsOptions}
                    </Form.Control>
                  </Form.Group>

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
                      <MathJax.Provider>
                        <MathJax.Node inline formula={sampleProblem} />
                      </MathJax.Provider>
                    </p>
                    <Button variant="secondary" onClick={getSampleProblem}>Refresh</Button>
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
              <div>
                <strong>Give reward when the student:</strong>
              </div>

              <input type="radio" value="sheet" checked={conditionType === 'sheet'} onChange={condChanged} />
              completes sheet number
              <Form.Group>
                <Form.Control as="select" ref={sheetRef}>{sheetOptions}</Form.Control>
              </Form.Group>

              <input type="radio" value="weekGoal" checked={conditionType === 'weekGoal'} onChange={condChanged} />
              completes X sheets in a week
              <Form.Group>
                <Form.Control as="select" defaultValue="10" ref={weekGoalRef}>{weekGoalOptions}</Form.Control>
              </Form.Group>

              <label className="radio">
                <input type="radio" value="monthGoal" checked={conditionType === 'monthGoal'} onChange={condChanged} />
                completes X sheets in a month
              </label>
              <Form.Group>
                <Form.Control as="select" defaultValue="10" ref={monthGoalRef}>{monthGoalOptions}</Form.Control>
              </Form.Group>

              <Form.Group>
                <Form.Label> <strong>Reward</strong> </Form.Label>
                <Form.Control as="textarea" ref={rewardRef} placeholder="Great Job! Your reward is ...">
                </Form.Control>
              </Form.Group>

              <Button onClick={createReward}>Add reward</Button>
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
              <Button onClick={updatePowerups} disabled={isUpdatingPowerups}>
                Update power-ups
              </Button>{' '}
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

export default StudentEditPage;
