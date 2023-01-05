interface IDsrIcrCalculator {
  sales: number;
  producitionCost: number;
  ownLaborCost: number;
  initBusinessInvestment: number;
  loanPrincipal: number;
}
interface IDSRFundsForRenovation_15year {
  producitionCost: number;
  initBusinessInvestment: number;
}
interface IOperatingProfit__15year {
  sales: number;
  producitionCost: number;
  ownLaborCost: number;
  fundsForRenovation__all: number[];
}
interface IInterestCoverageRatio {
  operatingProfit__all: number[];
  interest__all: number[];
}
interface IDebtSavingsRatio {
  operatingProfit__all: number[];
  totalRepaymentAmount__all: number[];
}

/**
 * 영업이익 계산기
 * @description 매출액 - (매출원가+판관비) + 자가인건비 - 개보수필요자금
 * @param sales 매출액
 * @param producitionCost (매출원가+판관비)
 * @param ownLaborCost 자가인건비
 * @param fundsForRenovation__all 개보수필요자금 배열
 * @returns 15년간 영업이익 배열
 */
const operatingProfit__15year = ({
  sales,
  producitionCost,
  ownLaborCost,
  fundsForRenovation__all
}: IOperatingProfit__15year) => {
  const operatingProfit__all = [];
  for (let i = 0; i < 15; i++) {
    const operatingProfit = sales - producitionCost + ownLaborCost - fundsForRenovation__all[i];
    operatingProfit__all.push(operatingProfit);
  }

  return operatingProfit__all;
};

/**
 * @param producitionCost 생산비
 * @param initBusinessInvestment 초기 사업 투자비
 * @returns 7, 10, 15년에 필요한 개보수필요자금
 */
const fundsForRenovation__15year = ({ producitionCost, initBusinessInvestment }: IDSRFundsForRenovation_15year) => {
  const totalProjectCost = producitionCost + initBusinessInvestment;

  const cashFlow = new Array(15).fill(0).map((cash, index) => {
    if (index === 6) return Math.round(totalProjectCost * 0.04);
    if (index === 9) return Math.round(totalProjectCost * 0.05);
    if (index === 14) return Math.round(totalProjectCost * 0.08);
    return 0;
  });

  return cashFlow;
};

/**
 * 원금 균등 상환 이자율 계산기
 * 만기 = 거치개월수 + 상환개월수
 * 이자율(interestRate) = 연이자율 / 12
 * 상환기간 총 이자 = 원금 * 연이자율 * (상환개월수 + 1) / 24
 *
 * @description 거치기간은 원금에 대한 이자만 갚는 기간을 의미합니다.
 * @param 원금
 * @param 연이자율
 * @param 거치기간
 * @param 상환개월수
 * @return {interest__all ,principalRepayment__all ,totalRepaymentAmount__all} 이자(연), 원금상환액(연), 원리금상환액(연)
 */

const PLevelPayment__interest__15 = (
  loanPrincipal: number,
  연이자율: number = 2,
  거치개월수: number = 60,
  상환개월수: number = 120
) => {
  const interestRate__month = 연이자율 / 100 / 12;
  let interest__all = new Array(5); // 이자(연)
  let principalRepayment__all = new Array(15); // 원금 상환액(연)
  let totalRepaymentAmount__all = []; // 원리금 상환액(연) [ 이자 + 원금 상환액 ]

  // 거치기간
  const gracePeriod__month = Math.round(loanPrincipal * interestRate__month);
  const gracePeriod__year = gracePeriod__month * 12;
  interest__all.fill(gracePeriod__year, 0, 5);

  // 상환기간
  const principalRepayment__month = Math.round(loanPrincipal / 상환개월수);
  const principalRepayment__year = Math.round(loanPrincipal / 10);
  principalRepayment__all.fill(0, 0, 5).fill(principalRepayment__year, 5, 15);

  /**
   * 상환기간 이자 계산
   */
  let tmpLoanPrincipal = loanPrincipal;
  for (let i = 0; i < 상환개월수 / 12; i++) {
    const redemptionPeriod__month__arr = [];

    /**
     * 상환기간 월이자
     */
    for (let i = 0; i < 12; i++) {
      const redemptionPeriod__month = Math.round(tmpLoanPrincipal * interestRate__month);
      redemptionPeriod__month__arr.push(redemptionPeriod__month);
      tmpLoanPrincipal -= principalRepayment__month;
    }

    /**
     * 상환기간 연이자
     */
    const redemptionPeriod__year = redemptionPeriod__month__arr.reduce((sum, redemptionPeriod__month) => {
      return sum + redemptionPeriod__month;
    });
    interest__all.push(redemptionPeriod__year);
  }

  for (let i = 0; i < 15; i++) {
    const totalRepaymentAmount = interest__all[i] + principalRepayment__all[i];
    totalRepaymentAmount__all.push(totalRepaymentAmount);
  }

  return { interest__all, principalRepayment__all, totalRepaymentAmount__all };
};

/**
 * 이자상환비율
 * 영업이익 / 이자납입액
 */
const InterestCoverageRatio = ({ operatingProfit__all, interest__all }: IInterestCoverageRatio) => {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += operatingProfit__all[i] / interest__all[i];
  }

  return sum / 15;
};

/**
 * 총부채 원리금상환비율
 * 영업이익 / 원리금 상환액
 */
const DebtSavingsRatio = ({ operatingProfit__all, totalRepaymentAmount__all }: IDebtSavingsRatio) => {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += operatingProfit__all[i] / totalRepaymentAmount__all[i];
  }

  return sum / 15;
};

/**
 * 15년간의DSR(총부채 원리금 상환비율) 시뮬레이션 계산기입니다.
 * 산정 기준
 *  - 대출자의 연간 소득
 * 대출에 미치는 영향
 *  - 낮을 수록 좋음
 * 계산 방법
 *  - {(담보대출 원리금 상환액 + 기대출 원리금 상환액) / 연간소득}  * 100
 * 개보수필요자금
 * 7년차 4%
 * 10년차 5%
 * 15년차 8%
 * @param sales 매출액 ( 생산량 * 단가 )
 * @param producitionCost   생산비 ( 매출원가 * 판관비 )
 * @param ownLaborCost 자가인건비 (매출액 / 자가인건비비율)
 * @param initBusinessInvestment 초기 사업 투자비 (농지구입비 + 시설비)
 * @param loanPrincipal 대출 원금
 * @returns {RTI , DSR, status}
 */
const dsr__icr__calculator = ({
  sales,
  producitionCost,
  ownLaborCost,
  initBusinessInvestment,
  loanPrincipal
}: IDsrIcrCalculator) => {
  // 개보수필요자금
  const fundsForRenovation__all = fundsForRenovation__15year({
    producitionCost,
    initBusinessInvestment
  });
  // 영업이익
  const operatingProfit__all = operatingProfit__15year({
    sales,
    producitionCost,
    ownLaborCost,
    fundsForRenovation__all
  });
  // 이자, 상환원금, 상환원리금
  const PLevelPayment__interest__all = PLevelPayment__interest__15(loanPrincipal);
  const { interest__all, totalRepaymentAmount__all } = PLevelPayment__interest__all;
  // RTI 이자상환비율
  const RTI = InterestCoverageRatio({ operatingProfit__all, interest__all });
  // DSR 총부채원리금상환비율
  const DSR = DebtSavingsRatio({
    operatingProfit__all,
    totalRepaymentAmount__all
  });

  const status = RTI > 1 && DSR > 1;

  return { RTI, DSR, status };
};

export { dsr__icr__calculator };

// example
const sales = 35300429.75241912;
const producitionCost = 36950380.16565876;
const ownLaborCost = 20680000;
const initBusinessInvestment = 52000000;
const loanPrincipal = 34880000;
/**
 * @param sales {매출액} ( 생산량 * 단가 )
 * @param producitionCost {생산비} ( 매출원가 * 판관비 )
 * @param ownLaborCost {자가인건비} ( 매출액 / 자가인건비비율
 * @param initBusinessInvestment {초기사업투자비} ( 농지구입비 + 시설비 )
 * @param loanPrincipal {대출원금}
 */
const calculatorInfo = {
  sales,
  producitionCost,
  ownLaborCost,
  initBusinessInvestment,
  loanPrincipal
};
console.log(dsr__icr__calculator(calculatorInfo));
