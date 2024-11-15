import {data} from "autoprefixer";

export class CDCM {
  private _ID: number;
  private _No_of_employees: number;
  private _Grand_Groos_Salaray_per_Employee: number;
  private _other_cost: number;
  private _disabled_people: number;
  private _Charging_DP: number;
  private _MU_on_salary: number;
  private _MU_on_costs: number;
  private _Flat_fee: number;
  private _MU_on_disabled_people: number
  private _due_days_on_cost: number
  private _due_days_on_fee: number
  private _direct_cost: number
  private _fee: number
  private _revenue: number
  private _projectID: number
  private _isHra: number
  private _isPy: number
  private _hra_conultant_seniority: string
  private _py_conultant_seniority: string
  private _hra_consultant_cost: number
  private _py_consultant_cost: number
  private _hra_consultant_percent: number
  private _py_consultant_percent: number
  private _additional_costs: number
  private _payslips_cost: number
  private _collective_insurance: number
  private _interest_rate: number
  private _franchise_fee_percent: number
  private _franshise_fee: number
  private _financing_cost: number
  private _operational_cost: number
  private _gross_profit: number
  private _gross_profit_percent: number
  private _net_profit: number
  private _net_profit_percent: number
  private _createdDate: Date
  private _createdUserID: number
  private _updatedDate: Date
  private _updatedUserID: number
  private _userName: string
  private _statusID: number
  private _statusName: string


  constructor(ID: number, No_of_employees: number, Grand_Groos_Salaray_per_Employee: number, other_cost: number, disabled_people: number, Charging_DP: number, MU_on_salary: number, MU_on_costs: number,
              Flat_fee: number, MU_on_disabled_people: number, due_days_on_cost: number, due_days_on_fee: number, direct_cost: number, fee: number, revenue: number, projectID: number, isHra: number,
              isPy: number, hra_conultant_seniority: string, py_conultant_seniority: string, hra_consultant_cost: number, py_consultant_cost: number, hra_consultant_percent: number, py_consultant_percent: number,
              additional_costs: number, payslips_cost: number, collective_insurance: number, interest_rate: number, franchise_fee_percent: number, franshise_fee: number, financing_cost: number, operational_cost: number, gross_profit: number,
              gross_profit_percent: number, net_profit: number, net_profit_percent: number, createdDate: Date, createdUserID: number, updatedDate: Date, updatedUserID: number, creatorFirstName: string, creatorLastName: string, statusID: number, statusName: string) {
    this._ID = ID;
    this._No_of_employees = No_of_employees;
    this._Grand_Groos_Salaray_per_Employee = Grand_Groos_Salaray_per_Employee;
    this._other_cost = other_cost;
    this._disabled_people = disabled_people;
    this._Charging_DP = Charging_DP;
    this._MU_on_salary = MU_on_salary;
    this._MU_on_costs = MU_on_costs;
    this._Flat_fee = Flat_fee;
    this._MU_on_disabled_people = MU_on_disabled_people;
    this._due_days_on_cost = due_days_on_cost;
    this._due_days_on_fee = due_days_on_fee;
    this._direct_cost = direct_cost;
    this._fee = fee;
    this._revenue = revenue;
    this._projectID = projectID;
    this._isHra = isHra;
    this._isPy = isPy;
    this._hra_conultant_seniority = hra_conultant_seniority;
    this._py_conultant_seniority = py_conultant_seniority;
    this._hra_consultant_cost = hra_consultant_cost;
    this._py_consultant_cost = py_consultant_cost;
    this._hra_consultant_percent = hra_consultant_percent;
    this._py_consultant_percent = py_consultant_percent;
    this._additional_costs = additional_costs;
    this._payslips_cost = payslips_cost;
    this._collective_insurance = collective_insurance;
    this._interest_rate = interest_rate;
    this._franchise_fee_percent = franchise_fee_percent;
    this._franshise_fee = franshise_fee;
    this._financing_cost = financing_cost;
    this._operational_cost = operational_cost;
    this._gross_profit = gross_profit;
    this._gross_profit_percent = gross_profit_percent;
    this._net_profit = net_profit;
    this._net_profit_percent = net_profit_percent;
    this._createdDate = createdDate;
    this._createdUserID = createdUserID;
    this._updatedDate = updatedDate;
    this._updatedUserID = updatedUserID;
    this._userName = creatorFirstName + creatorLastName;
    this._statusID = statusID;
    this._statusName = statusName;
  }


  get ID(): number {
    return this._ID;
  }

  get No_of_employees(): number {
    return this._No_of_employees;
  }

  get Grand_Groos_Salaray_per_Employee(): number {
    return this._Grand_Groos_Salaray_per_Employee;
  }

  get other_cost(): number {
    return this._other_cost;
  }

  get disabled_people(): number {
    return this._disabled_people;
  }

  get Charging_DP(): number {
    return this._Charging_DP;
  }

  get MU_on_salary(): number {
    return this._MU_on_salary;
  }

  get MU_on_costs(): number {
    return this._MU_on_costs;
  }

  get Flat_fee(): number {
    return this._Flat_fee;
  }

  get MU_on_disabled_people(): number {
    return this._MU_on_disabled_people;
  }

  get due_days_on_cost(): number {
    return this._due_days_on_cost;
  }

  get due_days_on_fee(): number {
    return this._due_days_on_fee;
  }

  get direct_cost(): number {
    return this._direct_cost;
  }

  get fee(): number {
    return this._fee;
  }

  get revenue(): number {
    return this._revenue;
  }

  get projectID(): number {
    return this._projectID;
  }

  get isHra(): number {
    return this._isHra;
  }

  get isPy(): number {
    return this._isPy;
  }

  get hra_conultant_seniority(): string {
    return this._hra_conultant_seniority;
  }

  get py_conultant_seniority(): string {
    return this._py_conultant_seniority;
  }

  get hra_consultant_cost(): number {
    return this._hra_consultant_cost;
  }

  get py_consultant_cost(): number {
    return this._py_consultant_cost;
  }

  get hra_consultant_percent(): number {
    return this._hra_consultant_percent;
  }

  get py_consultant_percent(): number {
    return this._py_consultant_percent;
  }

  get additional_costs(): number {
    return this._additional_costs;
  }

  get payslips_cost(): number {
    return this._payslips_cost;
  }

  get collective_insurance(): number {
    return this._collective_insurance;
  }

  get interest_rate(): number {
    return this._interest_rate;
  }

  get franchise_fee_percent(): number {
    return this._franchise_fee_percent;
  }

  get franshise_fee(): number {
    return this._franshise_fee;
  }

  get financing_cost(): number {
    return this._financing_cost;
  }

  get operational_cost(): number {
    return this._operational_cost;
  }

  get gross_profit(): number {
    return this._gross_profit;
  }

  get gross_profit_percent(): number {
    return this._gross_profit_percent;
  }

  get net_profit(): number {
    return this._net_profit;
  }

  get net_profit_percent(): number {
    return this._net_profit_percent;
  }

  get createdDate(): Date {
    return this._createdDate;
  }

  get createdUserID(): number {
    return this._createdUserID;
  }

  get updatedDate(): Date {
    return this._updatedDate;
  }

  get updatedUserID(): number {
    return this._updatedUserID;
  }

  get userName(): string {
    return this._userName;
  }

  get statusID(): number {
    return this._statusID;
  }

  get statusName(): string {
    return this._statusName;
  }

  setStatus(statusID: number, name: string){
    this._statusID = statusID;
    this._statusName = name;
  }

  public static createCDCMModel(data){
    let createDate: Date = new Date(data.createdDate);
    createDate.setHours(createDate.getHours()-2);
    let updateDate: Date;
    if (data.updatedDate){
      updateDate = new Date(data.updatedDate);
    }

    return new CDCM(data.ID, data.No_of_employees, data.Grand_Groos_Salaray_per_Employee, data.other_cost, data.disabled_people, data.Charging_DP, data.MU_on_salary, data.MU_on_costs,
      data.Flat_fee, data.MU_on_disabled_people, data.due_days_on_cost, data.due_days_on_fee, data.direct_cost, data.fee, data.revenue, data.projectID, data.isHra,
      data.isPy, data.hra_conultant_seniority, data.py_conultant_seniority, data.hra_consultant_cost, data.py_consultant_cost, data.hra_consultant_percent, data.py_consultant_percent,
      data.additional_costs, data.payslips_cost, data.collective_insurance, data.interest_rate, data.franchise_fee_percent, data.franshise_fee, data.financing_cost, data.operational_cost,
      data.gross_profit, data.gross_profit_percent, data.net_profit, data.net_profit_percent, createDate, data.createdUserID, updateDate, data.updatedUserID, data.creatorFirstName, data.creatorLastName, data.statusID, data.statusName);
  }
}
