import {API_URL} from '@env';
import axios from 'axios';

export async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({username, password}),
    });
    console.log('AAAAAAA', JSON.stringify(response));
    return response.json();
  } catch (error) {
    console.error('Network or server error:', error.message);
    return {success: false, message: 'Network error, please try again later.'};
  }
}

export async function getStudents(username) {
  // console.log('for getstudents:>',username)
  try {
    const response = await fetch(`${API_URL}/getStudents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({username}),
    });
    const data = await response.json();
    // console.log(data)
    return data;
  } catch (error) {
    console.error('Network or server error:', error.message);
    return {success: false, message: 'Network error, please try again later.'};
  }
}
export async function getAllClasses(user) {
  try {
    // console.log('POHOOOOOOOOOOO', user);
    const dataa = {
      username: 'Teacher',
    };

    const response = await axios.post(
      `${API_URL}/getAllClasses`,
      {username: 'admin'},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Network or server error:', error.message);
    return {success: false, message: 'Network error, please try again later.'};
  }
}
// export async function getStudentsByClass(data) {
//   try {
//     // console.log('AIEEEEEEEy', data);
//     console.log('Sending data:', data);
// console.log('Type of data:', typeof data);

//     // const response = await axios.post(
//     //   `${API_URL}/getStudentsInfoByClass`,
//     //   {username:'Teacher', class_id:1},
//     //   {
//     //     headers: {
//     //       'Content-Type': 'application/json',
//     //     },
//     //   },
//     // );
//     // console.log('RESPOSSSSS', response);

//     // return response.data;
//   } catch (error) {
//     console.error('Error while getting studentssssss:', error.message);
//     return {success: false, message: 'Network error, please try again later.'};
//   }
// }
export async function getStudentsByClass(data) {
  try {
    const response = await axios.post(
      `${API_URL}/getStudentsInfoByClass`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error(
      'Network or server error:',
      error?.response?.data || error.message,
    );
    return {success: false};
  }
}

export async function getExamsByClass(data) {
  try {
    const response = await axios.post(`${API_URL}/getClassExamRecords`, data);
    return response.data;
  } catch (error) {
    console.error(error.message); // Just show the error message
  }
}
export async function getExamsObject(data) {
  try {
    const response = await axios.post(`${API_URL}/getExams`, data);
    return response.data;
  } catch (error) {
    console.error(error.message); // Just show the error message
  }
}

export async function addAttendance(data) {
  // console.log(API_URL);
  try {
    const response = await fetch(`${API_URL}/addAttendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const data1 = await response.json();
    // console.log('response:>>',data1)
    return data1;
  } catch (error) {
    console.error('Network or server error:', error.message);
    return {success: false, message: 'Network error, please try again later.'};
  }
}
export async function getAttendance(data) {
  // console.log(API_URL)
  // console.log('data:>>',data)
  try {
    const response = await fetch(`${API_URL}/getAttendance`, {
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
}
export async function getStudentAttendance(data) {
  try {
    const response = await fetch(`${API_URL}/getStudentAttendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const data1 = await response.json();
    return data1;
  } catch (error) {
    console.error('Network or server error:', error.message);
    return {success: false, message: 'Network error, please try again later.'};
  }
}
