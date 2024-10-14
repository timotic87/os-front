import {CurrencyModel} from "./currencyModel";
import {CountryModel} from "./countryModel";
export class ClientModel {
  private _id: number;
  private _name: string;
  private _address: string;
  private _city: string;
  private _country: CountryModel;
  private _pib: string;
  private _mb: string;
  private _zipCode: string;
  private _mail: string;
  private _currency: CurrencyModel;

  constructor(id: number, name: string, address: string, city: string, country: CountryModel, pib: string, mb: string, zipCode: string, mail: string, currency: CurrencyModel) {
    this._id = id;
    this._name = name;
    this._address = address;
    this._city = city;
    this._country = country;
    this._pib = pib;
    this._mb = mb;
    this._zipCode = zipCode;
    this._mail = mail;
    this._currency = currency;
  }


  public get id(): number {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get address(): string {
    return this._address;
  }

  public get city(): string {
    return this._city;
  }

  public get country(): CountryModel {
    return this._country;
  }

  public get pib(): string {
    return this._pib;
  }

  public get mb(): string {
    return this._mb;
  }

  public get zipCode(): string {
    return this._zipCode;
  }

  public get mail(): string {
    return this._mail;
  }

  public get currency(): CurrencyModel {
    return this._currency;
  }

  set id(value: number) {
    this._id = value;
  }

  set name(value: string) {
    this._name = value;
  }

  set address(value: string) {
    this._address = value;
  }

  set city(value: string) {
    this._city = value;
  }

  set country(value: CountryModel) {
    this._country = value;
  }

  set pib(value: string) {
    this._pib = value;
  }

  set mb(value: string) {
    this._mb = value;
  }

  set zipCode(value: string) {
    this._zipCode = value;
  }

  set mail(value: string) {
    this._mail = value;
  }

  set currency(value: CurrencyModel) {
    this._currency = value;
  }

  public static createClientModel(data: any){
    const currency: CurrencyModel = CurrencyModel.createCurrencyModel({id: data.currencyId, name: data.currencyName, nbsCode: data.nbsCode});
    const country: CountryModel = CountryModel.createCountryModel({id: data.countryId, name: data.countryName});
    return new ClientModel(data.id, data.name, data.address, data.city, country, data.pib, data.mb, data.zipCode, data.mail, currency);
  }
}
