import React from 'react';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <React.Fragment>

      <div className="hero-unit">
        <h1>MathBombs</h1>
          
        <p>
          Virtual math worksheets for learning and fun!
        </p>
        <p>
          <Link to="/login">
            <Button>Get started</Button>
          </Link>
          {' '}
          <Link to="/students/32CBD3D2-41EA-11E2-9427-B740B9B2CD51">
            <Button variant="secondary">Demo</Button>
          </Link>
        </p>
      </div>

      <div className="thumbnails">

          <div className="thumbnail">
            <img src="/images/bomb-128.png"/>
            <h3>Power-ups</h3>
            <p>
              Random problems will give students power-ups which they can use
              to blast away other problems.
            </p>
          </div>

          <div className="thumbnail">
            <img src="/images/star6.png" style={{ height: '128px' }}/>
            <h3>Rewards</h3>
            <p>
              A customizable rewards system which can optionally
              print physical coupons in real-time as students win rewards.
            </p>
          </div>

          <div className="thumbnail last-thumbnail">
            <img src="/images/food_188.gif" style={{ height: '128px' }}/>
            <h3>Teacher/Parent Tools</h3>
            <p>
              A classroom portal page provides an overview of students progress.
              An optional password-less student login workflow can remove the need
              for managing student passwords.
            </p>
          </div>

      </div>

    </React.Fragment>
  );
};

export default HomePage;
