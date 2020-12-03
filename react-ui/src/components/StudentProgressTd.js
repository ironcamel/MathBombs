import { Link } from 'react-router-dom';
import ProgressBar from 'react-bootstrap/ProgressBar';

const StudentProgressTd = ({ student }) => {
  const reportUrl = `/students/${student.id}/report`;
  const weekPercent = student.past_week / 7 * 100;
  const monthPercent = student.past_month / 30 * 100;

  return (
    <td style={{minWidth: '200px'}}>
      <div>
        <Link to={reportUrl}>
          <div style={{display: 'flex'}}>
            <ProgressBar variant="success" now={weekPercent}/>
            <div style={{lineHeight: 1}}>
              {student.past_week} / 7
            </div>
          </div>
        </Link>
      </div>
      <div style={{clear: 'both'}}>
        <Link to={reportUrl}>
          <div style={{display: 'flex'}}>
            <ProgressBar variant="success" now={monthPercent}/>
            <div style={{lineHeight: 1}}>
              {student.past_month} / 30
            </div>
          </div>
        </Link>
      </div>
    </td>
  );
}

export default StudentProgressTd;
