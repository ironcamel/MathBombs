import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClientContext } from '../MathBombsClient';
import MathJax from 'react-mathjax';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import $ from 'jquery'; 
import '../fire';

const MathSheetPage = () => {
  const [student, setStudent] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState(null);
  const [problemsById, setProblemsById] = React.useState({});
  const [isUpdatingStudent, setIsUpdatingStudent] = React.useState(false);
  const [isCreatingRewards, setIsCreatingRewards] = React.useState(false);
  const [sampleProblem, setSampleProblem] = React.useState(null);
  const [rewards, setRewards] = React.useState([]);
  const [isTargeting, setIsTargeting] = React.useState(false);
  const [fetchingProblems, setFetchingProblems] = React.useState(false);
  const [wonPowerup, setWonPowerup] = React.useState();
  const [showPowerup1, setShowPowerup1] = React.useState(false);
  const [showPowerup2, setShowPowerup2] = React.useState(false);
  const modal1Ref = React.createRef();
  const modal2Ref = React.createRef();
  const client = React.useContext(ClientContext);

  let { student_id, sheet_id } = useParams();
  sheet_id = parseInt(sheet_id);
  const probObjects = Object.values(problemsById);
  const isAllSolved = probObjects.length && probObjects.every(p => p.guess == p.answer);
  const powerup1 = student ? student.powerups[1].cnt : 0;
  const powerup2 = student ? student.powerups[2].cnt : 0;

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
        setShowPowerup1(true);
      } else if (wonPowerup.id == 2) {
        setShowPowerup2(true);
      }
    }
  }, [wonPowerup]);

  const getStudent = () => {
    client.getStudent({ id: student_id }).then(data => {
      const { student, error } = data;
      if (error) {
        setErrMsg(error);
        window.scrollTo(0, 0);
      } else {
        setStudent(student);
      }
    });
  };

  const getProblems = () => {
    setFetchingProblems(true);
    client.createProblems({ student_id, sheet_id }).then(data => {
      setFetchingProblems(false);
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setProblemsById(data.problems.reduce((o,p) => ({...o, [p.id]: p}), {}));
      }
    });
  };

  const saveProblem = (problem) => {
    client.updateProblem(problem).then(data => {
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
          const meta = data.meta || {};
          const { powerup, reward } = meta;
          if (powerup) {
            setStudent({
              ...student,
              powerups: { ...student.powerups, [powerup.id]: powerup }
            });
            setWonPowerup(powerup);
          }
          if (reward) {
            alert(reward);
          }
      }
    });
  };

  const consumePowerup = ({ powerup_id }) => {
    client.usePowerup({ powerup_id, student_id }).then(data => {
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setStudent(data.student);
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
      consumePowerup({ powerup_id: 1 });
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
    consumePowerup({ powerup_id: 2 });
    document.querySelectorAll('div.problem').forEach(p => {
      setTimeout(() => killWithFire(p), Math.random() * 1000);
    });
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
        <h2>
          <div>
          {student.name}'s Workbook <small> sheet {sheet_id} </small>
          </div>
        </h2>
      </div>

      <div className="sheet-body">
        <div className="problems">
          <MathJax.Provider>{problemBlocks}</MathJax.Provider>
        </div>

        <div className="sheet-sidebar">
          <h4> Progress </h4>
            <Link to={`/students/${student_id}/report`}>
              7 day goal: {student.past_week} / 7
              <ProgressBar variant="success" now={student.past_week / 7 * 100}/>
            </Link>
            <Link to={`/students/${student_id}/report`}>
              30 day goal: {student.past_month} / 30
              <ProgressBar variant="success" now={student.past_month / 30 * 100}/>
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
        <Link to={prevUrl}>
          <Button size="small" variant="secondary">&lt;&lt; previous</Button>
        </Link>
        }

        { isAllSolved &&
        <Link to={nextUrl}>
          <Button size="small" className="float-right" variant="primary">next &gt;&gt;</Button>
        </Link>
        }

      </div>

      <PowerupModal powerup_id={1} setIsTargeting={setIsTargeting} showModal={showPowerup1} setShowModal={setShowPowerup1} />
      <PowerupModal powerup_id={2} setIsTargeting={setIsTargeting} showModal={showPowerup2} setShowModal={setShowPowerup2} />

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
        <MathJax.Node formula={problem.question} />
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

const PowerupModalOrig = React.forwardRef(({ powerup_id, setIsTargeting }, ref) => {
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

const PowerupModal = ({ powerup_id, setIsTargeting, showModal, setShowModal }) => {
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
  const handleClose = () => setShowModal(false);

  return (
    <Modal show={showModal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>You got the {name}!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p style={{textAlign: 'center'}}>
          <img src={bombPath} />
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>OK</Button>
      </Modal.Footer>
    </Modal>
  );

};

export default MathSheetPage;

// vi: fdm=indent fdn=2 syntax=javascript
