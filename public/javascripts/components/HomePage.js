
const HomePage = () => {
  return (
    <React.Fragment>

      <div className="hero-unit">
        <h1>MathBombs</h1>
          
        <p>
          Virtual math worksheets for learning and fun!
        </p>
        <p>
          <a className="btn btn-primary btn-large" href="/login">Get started &raquo;</a>{' '}
          <a className="btn btn-large" href="/students/32CBD3D2-41EA-11E2-9427-B740B9B2CD51">Demo</a>
        </p>
      </div>

      <ul className="thumbnails">

        <li className="span4">
          <div className="thumbnail">
            <img src="/images/bomb-128.png"/>
            <h3>Power-ups</h3>
            <p>
              Random problems will give students power-ups which they can use
              to blast away other problems.
            </p>
          </div>
        </li>

        <li className="span4">
          <div className="thumbnail">
            <img src="/images/star6.png" style={{ height: '128px' }}/>
            <h3>Rewards</h3>
            <p>
              A customizable rewards system which can optionally
              print physical coupons in real-time as students win rewards.
            </p>
          </div>
        </li>

        <li className="span4">
          <div className="thumbnail">
            <img src="/images/food_188.gif" style={{ height: '128px' }}/>
            <h3>Teacher/Parent Tools</h3>
            <p>
              A classroom portal page provides an overview of students progress.
              An optional password-less student login workflow can remove the need
              for managing student passwords.
            </p>
          </div>
        </li>

      </ul>
    </React.Fragment>
  );
};
