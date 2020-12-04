import React from 'react';
import { useParams } from 'react-router-dom';
import { ClientContext } from '../MathBombsClient';
import Chart from "react-google-charts";

const ReportPage = () => {
  const { student_id } = useParams();
  const [student, setStudent] = React.useState();
  const [errMsg, setErrMsg] = React.useState();
  const [reportData, setReportData] = React.useState([]);

  React.useEffect(() => {
    getStudent();
    fetchReportData();
  }, []);

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

  const fetchReportData = () => {
    client.getReport(student_id).then(data => {
      if (data.error) {
        setErrMsg(data.error);
        window.scrollTo(0, 0);
      } else {
        setReportData(data.data);
      }
    });
  };

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

      <Chart
        height='1000px'
        chartType="BarChart"
        loader={<div>Loading Chart</div>}
        data={reportData}
        options={{
          title: 'Math Sheets Completed',
          vAxis: { title: 'Day',  titleTextStyle: { color: 'black' } }
        }}
      />

    </div>
  );
}

export default ReportPage;
