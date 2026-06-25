import { EPF_RATE, SOCSO_RATE, SOCSO_CAP, EIS_RATE, EIS_SALARY_CAP } from './constants.js'

export const calcEPF = (gross) => gross * EPF_RATE
export const calcSOCSO = (gross) => Math.min(gross * SOCSO_RATE, SOCSO_CAP)
export const calcEIS = (gross) => Math.min(gross, EIS_SALARY_CAP) * EIS_RATE
