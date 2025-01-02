import { API_URL } from '@env';

export  async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),  // Use "username" instead of "email"
    });
    return response.json();
  } catch (error) {
    console.error('Network or server error:', error.message);
    return { success: false, message: 'Network error, please try again later.' };
  }
}
export async function getStudents(username) {
    try {
      const response = await fetch(`${API_URL}/getStudents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Network or server error:', error.message);
      return { success: false, message: 'Network error, please try again later.' };
    }
  }
export async function addAttendance(data) {
    // console.log("Request body:", JSON.stringify( data ));
    try {
      const response = await fetch(`${API_URL}/addAttendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data ),
      });
      const data1 = await response.json();
      return data1;
    } catch (error) {
      console.error('Network or server error:', error.message);
      return { success: false, message: 'Network error, please try again later.' };
    }
  }
export async function getAttendance(data) {
    try {
      const response = await fetch(`${API_URL}/getAttendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data ),
      });
      const data1 = await response.json();
      return data1;
    } catch (error) {
      console.error('Network or server error:', error.message);
      return { success: false, message: 'Network error, please try again later.' };
    }
  }
export async function getStudentAttendance(data) {
    try {
      const response = await fetch(`${API_URL}/getStudentAttendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data ),
      });
      const data1 = await response.json();
      return data1;
    } catch (error) {
      console.error('Network or server error:', error.message);
      return { success: false, message: 'Network error, please try again later.' };
    }
  }
