import { format, addDays } from 'date-fns';

export const calculateDueDates = (createdAt: string, dueDaysArray: number[]) => {
  const baseDate = new Date(createdAt);
  
  return dueDaysArray.map((days, index) => {
    const dueDate = addDays(baseDate, days);
    return {
      installmentNumber: index + 1,
      days,
      dueDate: format(dueDate, 'dd/MM/yyyy')
    };
  });
};

export const formatDueDatesText = (createdAt: string, dueDaysArray: number[]) => {
  const dueDates = calculateDueDates(createdAt, dueDaysArray);
  return dueDates.map(item => 
    `${item.installmentNumber}º: ${item.days} dias (${item.dueDate})`
  ).join(', ');
};