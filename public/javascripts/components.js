
const StudentProgressTd = ({ student }) => {
  const reportUrl = `/students/${student.id}/report`;
  const weekPercent = student.past_week / 7 * 100;
  const monthPercent = student.past_month / 30 * 100;

  return (
    <td>
      <div>
        <a href={reportUrl}>
          <div className="progress pull-left">
            <div className="bar bar-success" style={{width: weekPercent + '%'}}></div>
          </div>
          {student.past_week} / 7
        </a>
      </div>
      <div style={{clear: 'both'}}>
        <a href={reportUrl}>
          <div className="progress pull-left">
            <div className="bar bar-success" style={{width: monthPercent + '%'}}></div>
          </div>
          {student.past_month} / 30
        </a>
      </div>
    </td>
  );
}
