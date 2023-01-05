interface IIIRData {
  sales: number;
  producitionCost: number;
  ownLaborCost: number;
  initBusinessInvestment: number;
}

/**
 * @param sales 매출액
 * @param producitionCost 생산비
 * @param ownLaborCost 자가인건비
 * @param initBusinessInvestment 초기 사업 투자비
 * @returns 15년간 순현금흐름 배열
 */
const cashFlow_15year = ({ sales, producitionCost, ownLaborCost, initBusinessInvestment }: IIIRData) => {
  const initRevenue = sales - producitionCost + ownLaborCost - initBusinessInvestment;
  const revenue = sales - producitionCost + ownLaborCost;
  const totalProjectCost = producitionCost + initBusinessInvestment;

  const cashFlow = new Array(15).fill(revenue).map((cash, index) => {
    if (index === 0) return initRevenue;
    if (index === 6) return Math.round(revenue - totalProjectCost * 0.04);
    if (index === 9) return Math.round(revenue - totalProjectCost * 0.05);
    if (index === 14) return Math.round(revenue - totalProjectCost * 0.08);
    return cash;
  });

  return cashFlow;
};

const PVCalc = (money: number, interest: number, n: number) => {
  return money / (1 + interest) ** n;
};

const IIRCalc = (cashFlow: Array<number>) => {
  let min = -1.0;
  let max = 1.0;
  let guess = (min + max) / 2;
  let lastGuess = 1.0;
  let notSame = true;
  let NPV = 0;

  do {
    NPV = 0;
    guess = (min + max) / 2;

    if (Math.abs(lastGuess - guess) < 0.000000000000000000001) notSame = false;

    lastGuess = guess;

    cashFlow.map((cash, index) => {
      NPV += PVCalc(cash, guess, index);
    });

    if (NPV > 0) min = guess;
    else max = guess;
  } while (notSame && Math.abs(NPV) > 0.000000000000000000001);

  return guess;
};

/**
 * 15년간의 IRR(내부수익률) 시뮬레이션 계산기입니다.
 *
 * 개보수필요자금
 * 7년차 4%
 * 10년차 5%
 * 15년차 8%
 * @param sales 매출액 ( 생산량 * 단가 )
 * @param producitionCost  생산비 ( 매출원가 * 판관비 )
 * @param ownLaborCost 자가인건비 (매출액 / 자가인건비비율)
 * @param initBusinessInvestment 초기 사업 투자비 (농지구입비 + 시설비)
 */
const iir__calculator = ({ sales, producitionCost, ownLaborCost, initBusinessInvestment }: IIIRData) => {
  const cashFlow = cashFlow_15year({
    sales,
    producitionCost,
    ownLaborCost,
    initBusinessInvestment
  });
  const IRR = IIRCalc(cashFlow);
  const status = IRR > 0.06;
  return { IRR, status };
};

export { iir__calculator };

// example
const sales = 35300429.75241912;
const producitionCost = 36950380.16565876;
const ownLaborCost = 20680000;
const initBusinessInvestment = 52000000;

/**
 * @param sales {매출액} ( 생산량 * 단가 )
 * @param producitionCost {생산비} ( 매출원가 * 판관비 )
 * @param ownLaborCost {자가인건비} ( 매출액 / 자가인건비비율
 * @param initBusinessInvestment {초기사업투자비} ( 농지구입비 + 시설비 )
 */
const calculator = {
  sales,
  producitionCost,
  ownLaborCost,
  initBusinessInvestment
};

console.log(iir__calculator(calculator));
