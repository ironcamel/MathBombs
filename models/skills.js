const { irand } = require('./util.js');

exports.sortedSkills = [
  'Addition',
  'Subtraction',
  'Multiplication',
  'Division',
  'DecimalMultiplication',
  'Simplification',
  'FractionMultiplication',
  'FractionDivision',
  'FractionAddition',
];

exports.skills = {
  Addition: {
    name: 'Integer Addition',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty);
      const n1 = irand(max);
      const n2 = irand(max);
      const answer = n1 + n2;
      const question = `${n1} \\; + \\; ${n2}`;
      return { question, answer };
    }
  },
  Subtraction: {
    name: 'Integer Subtraction',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty);
      let n1 = irand(max);
      let n2 = irand(max);
      if (n1 < n2) [n1, n2] = [n2, n1];
      const answer = n1 - n2;
      const question = `${n1} \\; - \\; ${n2}`;
      return { question, answer };
    }
  },
  Multiplication: {
    name: 'Integer Multiplication',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty);
      const n1 = irand(max);
      const n2 = irand(max);
      const answer = n1 * n2;
      const question = `${n1} \\; \\times \\; ${n2}`;
      return { question, answer };
    }
  },
  Division: {
    name: 'Integer Division',
    genProblem: (difficulty) =>  {
      let divisor_max, quotient_max;
      switch (difficulty) {
        case 1:
          [divisor_max, quotient_max] = [10, 10];
          break;
        case 2:
          [divisor_max, quotient_max] = [10, 100];
          break;
        default:
          [divisor_max, quotient_max] = [100, 1000];
      }
      const divisor = irand(divisor_max);
      if (divisor == 0) divisor = 1;
      const answer = irand(quotient_max);
      const dividend = divisor * answer;
      let question;
      switch (irand(3)) {
        case 1: question = `${dividend} \\; / \\; ${divisor}`
          break;
        case 2: question = `${dividend} \\; \\div \\; ${divisor}`;
          break;
        default: question = `\\frac{${dividend}}{${divisor}}`;
      }
      return { question, answer };
    }
  },
  DecimalMultiplication: {
    name: 'Decimal Multiplication',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty+1);
      let n1 = irand(max);
      let n2 = irand(max);
      const log1 = Math.floor(Math.log10(n1));
      const log2 = Math.floor(Math.log10(n2));
      n1 = n1 / Math.pow(10, irand(log1));
      n2 = n2 / Math.pow(10, irand(log2));
      const answer = n1 * n2;
      const question = `${n1} \\; \\times \\; ${n2}`;
      return { question, answer };
    }
  },
  Simplification: {
    name: 'Fraction Simplification',
    genProblem: (difficulty) =>  {
      const max = Math.pow(10, difficulty-1);
      let n1, n2, mux;
      if (difficulty == 1) {
        n1 = irand(10);
        n2 = irand(10);
        mux = irand(5);
      } else if (difficulty == 2) {
        n1 = irand(20);
        n2 = irand(20);
        mux = irand(5);
      } else {
        n1 = irand(20);
        n2 = irand(20);
        mux = irand(20);
      }
      if (n1 > n2) [n1, n2] = [n2, n1];
      n1 *= mux;
      n2 *= mux;
      const question = `\\frac{${n1}}{${n2}}`;
      const answer = simplifyFraction(n1, n2);
      return { question, answer };
    }
  },
  FractionMultiplication: {
    name: 'Fraction Multiplication',
    genProblem: (difficulty) =>  {
      let max, numFractions;
      switch (difficulty) {
        case 1:  [max, numFractions] = [12, 2]; break;
        case 2:  [max, numFractions] = [12, 3]; break;
        default: [max, numFractions] = [16, 3];
      }
      let [ x, y ] = [ irand(max), irand(max) ];
      let question = `\\frac{${x}}{${y}}`;
      let n = [x];
      let d = [y];
      for (let i = 0; i < numFractions-1; i++) {
        const times = irand(2) == 1 ? '\\times' : '\\cdot';
        [ x, y ] = [ irand(max), irand(max) ];
        n.push(x);
        d.push(y);
        question += ` \\; ${times} \\; \\frac{${x}}{${y}}`;
      }
      n = n.reduce((acc, cur) => acc * cur);
      d = d.reduce((acc, cur) => acc * cur);
      const answer = simplifyFraction(n, d);
      return { question, answer };
    }
  },
  FractionDivision: {
    name: 'Fraction Division',
    genProblem: (difficulty) =>  {
      const max = difficulty * 6;
      const [x1, x2, y1, y2] = [...Array(4).keys()].map(x => irand(max));
      const f1 = `\\frac{${x1}}{${x2}}`;
      const f2 = `\\frac{${y1}}{${y2}}`;
      let question;
      switch (irand(3)) {
        case 1: question = `${f1} \\; / \\; ${f2}`;
          break;
        case 2: question = `${f1} \\; \\div \\; ${f2}`;
          break;
        default: question = `\\frac{\\;${f1}\\;}{\\;${f2}\\;}`;
      }
      const answer = simplifyFraction(x1*y2, x2*y1);
      return { question, answer };
    }
  },
  FractionAddition: {
    name: 'Fraction Addition',
    genProblem: (difficulty) =>  {
      let max, numFractions;
      switch (difficulty) {
        case 1:  [max, numFractions] = [12, 2]; break;
        case 2:  [max, numFractions] = [12, 3]; break;
        default: [max, numFractions] = [16, 3];
      }
      let [ x, y ] = [ irand(max), irand(max) ];
      let question = `\\frac{${x}}{${y}}`;
      let n = [x];
      let d = [y];
      for (let i = 0; i < numFractions-1; i++) {
        [ x, y ] = [ irand(max), irand(max) ];
        n.push(x);
        d.push(y);
        question += ` \\; + \\; \\frac{${x}}{${y}}`;
      }
      commonDen = d.reduce((acc, cur) => acc * cur);
      n.forEach((x,i) => n[i] *= commonDen / d[i]);
      const numerator = n.reduce((acc, cur) => acc + cur);
      const answer = simplifyFraction(numerator, commonDen);
      return { question, answer };
    }
  },
};

function simplifyFraction(n, d) {
  for (let i = n; i >= 2; i--) {
    if (isFactorOf(i, n) && isFactorOf(i, d)) {
      n /= i;
      d /= i;
    }
  }
  let answer;
  if (n == 0) {
    answer = 0;
  } else if (d == 1) {
    answer = n;
  } else {
    answer = n + '/' + d;
  }
  return answer + '';
}

function isFactorOf(x, y) {
  if (x > y) return false;
  if (x == 0) return false;
  return y/x == Math.floor(y/x);
}
