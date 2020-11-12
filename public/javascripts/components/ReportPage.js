
const ReportPage = () => {
  const { student_id } = ReactRouterDOM.useParams();
  const [student, setStudent] = React.useState();
  const [errMsg, setErrMsg] = React.useState();

  React.useEffect(() => getStudent(), []);

  const client = React.useContext(ClientContext);

  const authToken = window.localStorage.getItem('auth-token');

  const getStudent = () => {
    client.getStudent(student_id).then(data => {
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setStudent(data.data);
      }
    });
  };

  google.load("visualization", "1", { packages: ["corechart"] });
  google.setOnLoadCallback(drawChart);

  function drawChart() {
    client.getReport(student_id).then(data => {
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        const chartData = google.visualization.arrayToDataTable(data.data);
        const chart = new google.visualization.BarChart(document.getElementById('chart_div'));
        chart.draw(chartData, {
          title: 'Math Sheets Completed',
          vAxis: { title: 'Day',  titleTextStyle: { color: 'black' } }
        });
      }
    });
  }

  return (
    <div>
      { errMsg &&
      <div className="alert alert-error">
        <button type="button" className="close" onClick={() => setErrMsg('')}>×</button>
        <strong>Error!</strong> {errMsg}
      </div>
      }

      { student &&
      <div>
        <h1> {student.name} </h1>
        <hr/>
        <h2> past week: {student.past_week} </h2>
        <h2> past month: {student.past_month} </h2>
      </div>
      }

      <div id="chart_div" style={{ height: '1000px' }}></div>

    </div>
  );
}
