
const StudentProgressTd = ({ student }) => {
  const { Link } = ReactRouterDOM;
  const reportUrl = `/students/${student.id}/report`;
  const weekPercent = student.past_week / 7 * 100;
  const monthPercent = student.past_month / 30 * 100;

  return (
    <td>
      <div>
        <Link to={reportUrl}>
          <div className="progress pull-left">
            <div className="bar bar-success" style={{width: weekPercent + '%'}}></div>
          </div>
          {student.past_week} / 7
        </Link>
      </div>
      <div style={{clear: 'both'}}>
        <Link to={reportUrl}>
          <div className="progress pull-left">
            <div className="bar bar-success" style={{width: monthPercent + '%'}}></div>
          </div>
          {student.past_month} / 30
        </Link>
      </div>
    </td>
  );
}
