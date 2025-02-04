import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import DatePicker from 'react-native-date-picker';

interface AttendanceDay {
  date: string;
  status: 'present' | 'absent' | 'late' | 'holiday' | 'excused';
}

interface PieChartAttendanceProps {
  attendanceData: AttendanceDay[];
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  isOffline?: boolean;
}

const AttendanceChart: React.FC<PieChartAttendanceProps> = ({ 
  attendanceData, 
  onDateRangeChange,
  isOffline = false 
}) => {
  const screenWidth = Dimensions.get('window').width;

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Attendance History</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No attendance data available</Text>
          {isOffline && (
            <Text style={styles.offlineText}>You are currently offline</Text>
          )}
        </View>
      </View>
    );
  }

  const presentDays = attendanceData.filter(day => day.status === 'present').length;
  const lateDays = attendanceData.filter(day => day.status === 'late').length;
  const absentDays = attendanceData.filter(day => day.status === 'absent').length;
  const holidayDays = attendanceData.filter(day => day.status === 'holiday').length;
  const excusedDays = attendanceData.filter(day => day.status === 'excused').length;
  const totalDays = attendanceData.length;

  const chartData = [
    {
      name: 'Present',
      population: presentDays,
      color: 'rgba(91, 77, 188, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Late',
      population: lateDays,
      color: 'rgba(91, 77, 188, 0.7)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Absent',
      population: absentDays,
      color: 'rgba(91, 77, 188, 0.4)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Holiday',
      population: holidayDays,
      color: 'rgba(91, 77, 188, 0.2)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Excused',
      population: excusedDays,
      color: 'rgba(91, 77, 188, 0.1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ].filter(item => item.population > 0);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(91, 77, 188, ${opacity})`,
  };

  const attendancePercentage = totalDays - holidayDays > 0
    ? (((presentDays + lateDays * 0.5 + excusedDays * 0.75) / 
       (totalDays - holidayDays) * 100)
      ).toFixed(1)
    : '0.0';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Attendance History
        {isOffline && <Text style={styles.offlineIndicator}> (Offline)</Text>}
      </Text>
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Summary:</Text>
        <Text style={styles.summaryText}>Total Days: {totalDays}</Text>
        {presentDays > 0 && (
          <Text style={styles.summaryText}>Present: {presentDays} days</Text>
        )}
        {lateDays > 0 && (
          <Text style={styles.summaryText}>Late: {lateDays} days</Text>
        )}
        {absentDays > 0 && (
          <Text style={styles.summaryText}>Absent: {absentDays} days</Text>
        )}
        {holidayDays > 0 && (
          <Text style={styles.summaryText}>Holiday: {holidayDays} days</Text>
        )}
        {excusedDays > 0 && (
          <Text style={styles.summaryText}>Excused: {excusedDays} days</Text>
        )}
        <Text style={styles.attendanceText}>
          Attendance: {attendancePercentage}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  summary: {
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4DBC',
    marginTop: 8,
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  offlineText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  offlineIndicator: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default AttendanceChart;

