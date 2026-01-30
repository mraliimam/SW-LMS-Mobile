import {API_URL} from '@env';

export const getExams = async data => {
  try {
    const response = await fetch(`${API_URL}/getExams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const data1 = await response.json();
    // console.log('response of Getattendance:>>',data1)
    return data1;
  } catch (error) {
    console.error('Network or server error:', error.message);
    return {success: false, message: 'Network error, please try again later.'};
  }
};
export const addExamRecord = async data => {
  console.log(JSON.stringify(data), 'api data to submitted');
  try {
    const response = await fetch(`${API_URL}/addExamRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const data1 = await response.json();
    console.log('response of addExamRecord:>>', data1);
    return data1;
  } catch (error) {
    console.error('Network or server error:', error.message);
    return {success: false, message: 'Network error, please try again later.'};
  }
};
