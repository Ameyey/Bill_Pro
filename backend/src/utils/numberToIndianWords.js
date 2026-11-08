function numberToIndianWords(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  
  const b = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n) {
    if (n === 0) return '';
    if (n < 20) return a[n];
    const tens = b[Math.floor(n / 10)];
    const units = a[n % 10];
    return units ? `${tens}-${units}` : tens;
  }

  function convertGroup(n) {
    let str = '';
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    
    if (hundreds > 0) {
      str += `${a[hundreds]} Hundred`;
      if (rem > 0) str += ' ';
    }
    if (rem > 0) {
      str += convertTwoDigits(rem);
    }
    return str;
  }

  const roundedNum = Math.round(Number(num) * 100) / 100;
  if (roundedNum === 0) return 'Rupees Zero Only';

  const parts = roundedNum.toFixed(2).split('.');
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let isNegative = false;
  if (integerPart < 0) {
    isNegative = true;
    integerPart = Math.abs(integerPart);
  }

  let words = '';

  const crore = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;

  const lakh = Math.floor(integerPart / 100000);
  integerPart %= 100000;

  const thousand = Math.floor(integerPart / 1000);
  integerPart %= 1000;

  const remaining = integerPart;

  if (crore > 0) {
    words += `${convertTwoDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (remaining > 0) {
    words += `${convertGroup(remaining)} `;
  }

  words = words.trim();

  let result = 'Rupees ' + (words || 'Zero');

  if (decimalPart > 0) {
    result += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }

  result += ' Only';

  if (isNegative) {
    result = 'Minus ' + result;
  }

  return result;
}

module.exports = { numberToIndianWords };

