import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import RNPrint from 'react-native-print';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PrintPDFButton = ({studentInfo}) => {
  const [username, setUsername] = useState('');
  console.log('Student Info:', studentInfo);
  const exams = studentInfo?.exams_result || [];

  const getSubExamMap = exam => {
    const map = {};
    exam?.sub_exams?.forEach((sub, index) => {
      map[index] = sub.marks; // Map by index (0,1,2,...)
      map[sub.sub_exam_name] = sub.marks; // Also map by name (optional)
    });
    return map;
  };
  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem('username');
      setUsername(name || 'نام موجود نہیں');
    })();
  }, []);

  const handlePrintPDF = async () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مدرسہ دارالعلوم ضیاء القرآن</title>
    <style>
     @font-face {
                font-family: 'Jameel';
               src: url('file:///android_asset/fonts/Jameel.ttf');
              }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial, sans-serif;
        }
        
        body {
            background-color: white;
            padding: 20px;
            display: flex;
            justify-content: center;
            font-family: 'Jameel';
        }
        
        .report-card {
            width: 800px;
            border: 2px solid #000;
            padding: 0;
            background-color: white;
        }
  .main {
    display: flex;
    align-items: center;
    height: 100vh;
    background-color: #f0f0f0;
    width: 100%;
    padding: 20px;
}


        
        .header {
            border-bottom: 2px solid #000;
            padding: 10px;
            text-align: center;
            position: relative;
            background-color: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .header-text {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin: 0 auto;
  font-family: 'Jameel', 'Noto Nastaliq Urdu', serif;
        }
        
        .logo {
            position: absolute;
            left: 20px;
            width: 80px;
            height: 80px;
        }
        
        .header-decoration {
            position: absolute;
            top: 10px;
            width: 100%;
            height: 10px;
            display: flex;
            justify-content: space-between;
        }
        
        .student-info {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            border-bottom: 2px solid #000;
        }
        
      .student-info-cell {
  padding: 10px;
  text-align: center;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  font-family: 'Jameel', 'Noto Nastaliq Urdu', serif;
}

    
        
        .summary-section {
            border-bottom: 2px solid #000;
        }
        
        .summary-title {
            padding: 10px;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            border-bottom: 1px solid #000;
            font-family: 'Jameel', 'Noto Nastaliq Urdu', serif;
        }
        
        .summary-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
            border-bottom: 1px solid #000;
        }
        
        .summary-cell {
            padding: 8px;
            text-align: center;
            border-left: 1px solid #000;
            font-family: 'Jameel', 'Noto Nastaliq Urdu', serif;
        }
        
        .red-text {
            color: red;
            font-weight: bold;
        }
        
        .comments-section {
            display: grid;
            grid-template-columns: 1fr 3fr;
        }
        
        .comments-cell {
            padding: 10px;
            text-align: center;
            border-left: 1px solid #000;
            height: 60px;
            font-family: 'Jameel', 'Noto Nastaliq Urdu', serif;
        }

.exam-section {
  display: flex;
  width: 100%;
  max-width: 1000px; /* 700 + 300 = 1000 */
  margin: 0 auto;
   margin: 20px auto;  
  align-items: flex-start;
}

.exam-newsection {
  width: 300px;
  font-weight: bold;
  font-size: 18px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 158px;
  background-color: #f9f9f9; /* optional for visibility */
  border: 1px solid #000;    /* added black border */
  box-sizing: border-box;    /* ensures border doesn't increase width */
  font-family: 'Jameel', 'Noto Nastaliq Urdu', serif;

}

.exam-table-wrapper {
  width: 700px;
}

table {
  border-collapse: collapse;
  width: 100%;
  max-width: 700px; /* fixed width */
}

th, td {
  border: 1px solid black;
  padding: 8px;
  text-align: center;
  font-family: 'Jameel', 'Noto Nastaliq Urdu', serif;
}


th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
}

        .print-button {
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            z-index: 1000;
        }
        
        .print-button:hover {
            background-color: #45a049;
        }


 
        
        @media print {
            .print-button {
                display: none;
            }
            body {
                padding: 0;
                margin: 0;
            }
            .report-card {
                width: 100%;
                border: 2px solid #000;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">Print Report Card</button>
    <div class='main'>
    <div class="report-card">

            <img src="https://i.postimg.cc/rFHqt9hv/Screenshot-2025-05-16-095804-Copy-1.png"  
            style="width:100%; height:100px;" />

        <div class="student-info">
            <div class="student-info-cell">نام</div>
            <div class="student-info-cell">${studentInfo?.name}</div>
            <div class="student-info-cell">اسٹوڈنٹ نمبر</div>
            <div class="student-info-cell">${studentInfo?.student_id}</div>
        </div>
        
        <div class="student-info">
            <div class="student-info-cell">کلاس</div>
            <div class="student-info-cell">${studentInfo?.current_class}</div>
            <div class="student-info-cell">ٹیچر</div>
            <div class="student-info-cell">${username}</div>
        </div>
        
 <!-- Exam 1 Section -->
<div class="exam-section">
  <div class="exam-newsection">امتحان نمبر 1</div>
  <table>
    <tr>
      <td>تجوید (30)</td>
      <td>${getSubExamMap(exams[0])[1] || 'No Data'}</td>
      <td>اوسط حاضری</td>
      <td>${exams[0]?.attendance_result || 'No Data'}</td>
    </tr>
    <tr>
      <td>پڑھنے کا طریقہ (30)</td>
      <td>${getSubExamMap(exams[0])[2] || 'No Data'}</td>
      <td>امتحان (%80)</td>
      <td>${exams[0]?.exam_contribution || 'No Data'}</td>
    </tr>
    <tr>
      <td>نصاب (40)</td>
      <td>${getSubExamMap(exams[0])[3] || 'No Data'}</td>
      <td>حاضری (%20)</td>
      <td>${exams[0]?.attendance_contribution || 'No Data'}</td>
    </tr>
    <tr>
      <td>کل نمبر امتحان (100)</td>
      <td>${exams[0]?.total_result || 'No Data'}</td>
      <td>کل فیصد (٪100)</td>
      <td>${exams[0]?.exam_result || 'No Data'}</td>
    </tr>
  </table>
</div>

<!-- Exam 2 Section -->
<div class="exam-section">
  <div class="exam-newsection">امتحان نمبر 2</div>
  <table>
    <tr>
      <td>تجوید (30)</td>
      <td>${getSubExamMap(exams[1])[1] || 'No Data'}</td>
      <td>اوسط حاضری</td>
      <td>${exams[1]?.attendance_result}</td>
    </tr>
    <tr>
      <td>پڑھنے کا طریقہ (30)</td>
      <td>${getSubExamMap(exams[1])[2] || 'No Data'}</td>
      <td>امتحان (%80)</td>
      <td>${exams[1]?.exam_contribution || 'No Data'}</td>
    </tr>
    <tr>
      <td>نصاب (40)</td>
      <td>${getSubExamMap(exams[1])[3] || 'No Data'}</td>
      <td>حاضری (%20)</td>
      <td>${exams[1]?.attendance_contribution || 'No Data'}</td>
    </tr>
    <tr>
      <td>کل نمبر امتحان (100)</td>
      <td>${exams[1]?.total_result || 'No Data'}</td>
      <td>کل فیصد (٪100)</td>
      <td>${exams[1]?.exam_result || 'No Data'}</td>
    </tr>
  </table>
</div>

<!-- Exam 3 Section -->
<div class="exam-section">
  <div class="exam-newsection">حتمی امتحان</div>
  <table>
    <tr>
      <td>تجوید (30)</td>
      <td>${getSubExamMap(exams[2])[1] || 'No Data'}</td>
      <td>اوسط حاضری</td>
      <td>${exams[2]?.attendance_result || 'No Data'}</td>
    </tr>
    <tr>
      <td>پڑھنے کا طریقہ (30)</td>
      <td>${getSubExamMap(exams[2])[2] || 'No Data'}</td>
      <td>امتحان (%80)</td>
      <td>${exams[2]?.exam_contribution || 'No Data'}</td>
    </tr>
    <tr>
      <td>نصاب (40)</td>
      <td>${getSubExamMap(exams[2])[3] || 'No Data'}</td>
      <td>حاضری (%20)</td>
      <td>${exams[2]?.attendance_contribution || 'No Data'}</td>
    </tr>
    <tr>
      <td>کل نمبر امتحان (100)</td>
      <td>${exams[2]?.total_result || 'No Data'}</td>
      <td>کل فیصد (٪100)</td>
      <td>${exams[2]?.exam_result || 'No Data'}</td>
    </tr>
  </table>
</div>

        
        <!-- Summary Section -->
        <div class="summary-section">
            <div class="summary-title">حتمی نتیجہ</div>
            
            <div class="summary-row">
                <div class="summary-cell">امتحان نمبر 1 (%15)</div>
                <div class="summary-cell">${
                  studentInfo?.final_result?.['Internal Exam 1']
                }</div>
                <div class="summary-cell">امتحان نمبر 2 (%15)</div>
                <div class="summary-cell">${
                  studentInfo?.final_result?.['Internal Exam 2']
                }</div>
                <div class="summary-cell">حتمی امتحان (%70)</div>
                <div class="summary-cell">${
                  studentInfo?.final_result?.['Final Exam']
                }</div>
            </div>
            
            <div class="summary-row">
              <div class="summary-cell">قاعدہ/ناظرہ کورس مکمل؟</div>
<div class="summary-cell">${
      studentInfo?.final_result?.['Qaida/Nazra_Status'] ?? 'No'
    }</div>

<div class="summary-cell">نصاب کورس مکمل؟</div>
<div class="summary-cell">${
      studentInfo?.final_result?.['Syllabus_Status'] ?? 'No'
    }</div>

                <div class="summary-cell">اوسط سالانہ حاضری (%100)</div>
            <div class="summary-cell">${studentInfo?.final_attendance}</div>

            </div>
            
            <div class="summary-row">
                <div class="summary-cell red-tex">حتمی نتیجہ (%100)</div>
                <div class="summary-cell red-text">${
                  studentInfo?.final_result?.['total_result']
                }</div>
                <div class="summary-cell">پاس /کنڈیشنل</div>
                <div class="summary-cell">${
                  studentInfo?.final_result?.['Status']
                }</div>
                <div class="summary-cell">پوزیشن</div>
                <div class="summary-cell">${
                  studentInfo?.final_result?.['Position'] || 'No Postion'
                }</div>
            </div>
        </div>
        
        <!-- Comments Section -->
        <div class="comments-section">
        <div class="comments-cell">ٹیچر کمنٹس</div>
            <div class="comments-cell"></div>
        </div>
    </div>
    </div>
</body>
</html>
`;

    await RNPrint.print({html: htmlContent});
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePrintPDF}>
      <Icon name="file-pdf-box" size={24} color="#fff" />
      <Text style={styles.buttonText}>PDF</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#5B4DBC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 100,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default PrintPDFButton;
