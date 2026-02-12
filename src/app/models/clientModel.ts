export class ClientModel {
  private _id: number;
  private _customerNo: string;
  private _customerName: string;
  private _address: string;
  private _city: string;
  private _country: string;
  private _vatRegistrationNo: string;
  private _registrationNo: string;
  private _zipCode: string;
  private _email: string;
  private _emailInFinance: string;
  private _phoneInFinance: string;

  constructor(id: number, customerNo: string, customerName: string, address: string, city: string,
              country: string, vatRegistrationNo: string, registrationNo: string,
              zipCode: string, email: string, emailInFinance: string, phoneInFinance: string) {
    this._id = id;
    this._customerNo = customerNo;
    this._customerName = customerName;
    this._address = address;
    this._city = city;
    this._country = country;
    this._vatRegistrationNo = vatRegistrationNo;
    this._registrationNo = registrationNo;
    this._zipCode = zipCode;
    this._email = email;
    this._emailInFinance = emailInFinance;
    this._phoneInFinance = phoneInFinance;
  }

  get id(): number { return this._id; }
  set id(value: number) { this._id = value; }

  get customerNo(): string { return this._customerNo; }
  set customerNo(value: string) { this._customerNo = value; }

  get customerName(): string { return this._customerName; }
  set customerName(value: string) { this._customerName = value; }

  get address(): string { return this._address; }
  set address(value: string) { this._address = value; }

  get city(): string { return this._city; }
  set city(value: string) { this._city = value; }

  get country(): string { return this._country; }
  set country(value: string) { this._country = value; }

  get vatRegistrationNo(): string { return this._vatRegistrationNo; }
  set vatRegistrationNo(value: string) { this._vatRegistrationNo = value; }

  get registrationNo(): string { return this._registrationNo; }
  set registrationNo(value: string) { this._registrationNo = value; }

  get zipCode(): string { return this._zipCode; }
  set zipCode(value: string) { this._zipCode = value; }

  get email(): string { return this._email; }
  set email(value: string) { this._email = value; }

  get emailInFinance(): string { return this._emailInFinance; }
  set emailInFinance(value: string) { this._emailInFinance = value; }

  get phoneInFinance(): string { return this._phoneInFinance; }
  set phoneInFinance(value: string) { this._phoneInFinance = value; }

  public static createClientModel(data: any): ClientModel {
    return new ClientModel(
      data.id, data.customerNo, data.customerName, data.address, data.city,
      data.country, data.vatRegistrationNo, data.registrationNo,
      data.zipCode, data.email, data.emailInFinance, data.phoneInFinance
    );
  }
}
