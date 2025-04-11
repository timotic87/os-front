import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment.development";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {authorizationEnum} from "./enum-sevice";
import {CookieService} from "ngx-cookie-service";
import { io, Socket } from 'socket.io-client';
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {data} from "autoprefixer";

@Injectable({
  providedIn: 'root'
})

export class RestService {

  private socket: Socket;
  private socketId: string | undefined;

  // baseUrl = 'http://10.48.100.232:3000';
  baseUrl  = environment.SERVER_URL
  constructor(private http: HttpClient, private cookieService: CookieService, private matDialog: MatDialog, router: Router) {
    this.socket = io(this.baseUrl);

    this.socket.on('connect', () => {
      this.socketId = this.socket.id;
    });

    // Slušanje 'unauthorized' poruke
    this.socket.on('auth', (data: any) => {
      alert(data.message);  // todo Prikaz poruke kada korisnik nije autorizovan
      matDialog.closeAll();
      router.navigate(['/login'])
    });

  }

  headers(){
    let headers = new HttpHeaders();
    return headers.set('Authorization', `Bearer ${this.cookieService.get('jwt')}`).set('Content-Type', 'application/json').set('x-socket-id', this.socketId || '123');
  }

  login(data: object){
    return this.http.post(`${this.baseUrl}/login`, data) as Observable<any>;
  }

  // @ts-ignore
  getClients(data) {
    return this.http.post(`${this.baseUrl}/getClients`, data,{headers: this.headers()}) as Observable<any>;
  }

  getClientsByName(name) {
    return this.http.get(`${this.baseUrl}/getClients/${name}`,{headers: this.headers()}) as Observable<any>;
  }

  getCurrencyList(){
    return this.http.get(`${this.baseUrl}/currencyList`, {headers: this.headers()}) as Observable<any>;
  }

  editClient(data){
    data.obj.aut = authorizationEnum.EDIT_CLIENTS;
    return this.http.put(`${this.baseUrl}/editClient`,data.obj , {headers: this.headers()}) as Observable<any>;
  }
  deleteClient(data){
    data.aut = authorizationEnum.DELETE_CLIENTS
    return this.http.put(`${this.baseUrl}/deleteClient/${data.id}`,data, {headers: this.headers()}) as Observable<any>;
  }

  createClient(data){
    return this.http.post(`${this.baseUrl}/createClient`, data, {headers: this.headers()}) as Observable<any>;
  }

  getCountryList(){
    return this.http.get(`${this.baseUrl}/countryList`, {headers: this.headers()}) as Observable<any>;
  }

  getLEList(){
    return this.http.get(`${this.baseUrl}/getLegalEntities`, {headers: this.headers()}) as Observable<any>;
  }

  saveFile(data){
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${this.cookieService.get('jwt')}`);
    return this.http.post(`${this.baseUrl}/saveFile`, data, {headers: headers}) as Observable<any>;
  }

  getDocumentTypes() {
    //todo treba da se doda model za contractType
    return this.http.get(`${this.baseUrl}/getDocumentTypes`, {headers: this.headers()}) as Observable<any>;
  }

  getDocumentSubTypesByTypeID(typeID) {
    return this.http.post(`${this.baseUrl}/getDocumentSubTypesByTypeID`, {typeID}, {headers: this.headers()}) as Observable<any>;
  }

  getFilesByClientId(clientId) {
    return this.http.get(`${this.baseUrl}/getFilesById/${clientId}`, {headers: this.headers()}) as Observable<any>;
  }

  // getFilesByProjectId(projectID) {
  //   return this.http.get(`${this.baseUrl}/getFilesByProjectId/${projectID}`, {headers: this.headers()}) as Observable<any>;
  // }

  getFile(id){
    return this.http.get(`${this.baseUrl}/getFile/${id}`, {headers: this.headers(), responseType:'blob'}) as Observable<any>;
  }

  deleteDocumentById(id, filename){
    return this.http.post(`${this.baseUrl}/deleteDocumet/${id}`, {filename}, {headers: this.headers()}) as Observable<any>;
  }

  getUsers(){
    return this.http.get(`${this.baseUrl}/userList`, {headers: this.headers()}) as Observable<any>;
  }
  getUsersByPermisionID(permisionID){
    return this.http.get(`${this.baseUrl}/getUSerByPermisionId/${permisionID}`, {headers: this.headers()}) as Observable<any>;
  }

  getDepartments(){
    return this.http.get(`${this.baseUrl}/getDepartments`, {headers: this.headers()}) as Observable<any>;
  }

  getUnitsByDepartmentID(departmentID){
    return this.http.get(`${this.baseUrl}/getUnits/${departmentID}`, {headers: this.headers()}) as Observable<any>;
  }

  getPositionsByUnitID(unitID){
    return this.http.get(`${this.baseUrl}/getPostions/${unitID}`, {headers: this.headers()}) as Observable<any>;
  }
  createUser(user) {
    return this.http.post(`${this.baseUrl}/createUser`, user, {headers: this.headers()}) as Observable<any>;
  }

  changeUserStatus(data){
    return this.http.put(`${this.baseUrl}/changeUserStatus`,data , {headers: this.headers()}) as Observable<any>;
  }

  editUser(data){
    return this.http.put(`${this.baseUrl}/editUser`,data , {headers: this.headers()}) as Observable<any>;
  }

  resetUserPass(data){
    return this.http.put(`${this.baseUrl}/resetPass`,data , {headers: this.headers()}) as Observable<any>;
  }

  getUserPermisions(id){
    return this.http.get(`${this.baseUrl}/getUserPermisions/${id}`, {headers: this.headers()}) as Observable<any>;
  }

  changeUserPermisions(data){
    return this.http.put(`${this.baseUrl}/changeUserPermisions`,data , {headers: this.headers()}) as Observable<any>;
  }

  getNotifications(id){
    return this.http.get(`${this.baseUrl}/getNotifications/${id}`, {headers: this.headers()}) as Observable<any>;
  }

  changeNotificationStatus(data){
    return this.http.put(`${this.baseUrl}/changeNotificationStatus`,data , {headers: this.headers()}) as Observable<any>;
  }

  changeNotificationFlaggedStatus(data){
    return this.http.put(`${this.baseUrl}/changeNotificationFlaggedStatus`,data , {headers: this.headers()}) as Observable<any>;
  }

  deleteNotificationById(id){
    return this.http.delete(`${this.baseUrl}/deleteNotification/${id}`, {headers: this.headers()}) as Observable<any>;
  }

  changePicUrl(data){
    return this.http.put(`${this.baseUrl}/changePicUrl`,data , {headers: this.headers()}) as Observable<any>;
  }

  getServices(){
    return this.http.get(`${this.baseUrl}/services`, {headers: this.headers()}) as Observable<any>;
  }
  getServicesforLe(leID){
    return this.http.get(`${this.baseUrl}/servicesForLe/${leID}`, {headers: this.headers()}) as Observable<any>;
  }
  deleteService(ID){
    return this.http.delete(`${this.baseUrl}/services/${ID}`, {headers: this.headers()}) as Observable<any>;
  }
  createService(data){
    return this.http.post(`${this.baseUrl}/services`, data, {headers: this.headers()}) as Observable<any>;
  }

  editService(data){
    return this.http.put(`${this.baseUrl}/services`, data, {headers: this.headers()}) as Observable<any>;
  }
  getSubservices(){
    return this.http.get(`${this.baseUrl}/subservice`, {headers: this.headers()}) as Observable<any>;
  }
  getSubservicesForLe(leID, serviceID){
    return this.http.get(`${this.baseUrl}/subserviceForLe/${leID}/${serviceID}`, {headers: this.headers()}) as Observable<any>;
  }
  deleteSubservice(ID){
    return this.http.delete(`${this.baseUrl}/subservice/${ID}`, {headers: this.headers()}) as Observable<any>;
  }
  createSubservice(data){
    return this.http.post(`${this.baseUrl}/subservice`, data, {headers: this.headers()}) as Observable<any>;
  }
  editSubservice(data){
    return this.http.put(`${this.baseUrl}/subservice`, data, {headers: this.headers()}) as Observable<any>;
  }
  getSubservicesLE(){
    return this.http.get(`${this.baseUrl}/subserviceLE`, {headers: this.headers()}) as Observable<any>;
  }
  deleteSubserviceLE(ID){
    return this.http.delete(`${this.baseUrl}/subserviceLE/${ID}`, {headers: this.headers()}) as Observable<any>;
  }
  createSubserviceLe(data){
    return this.http.post(`${this.baseUrl}/subserviceLE`, data, {headers: this.headers()}) as Observable<any>;
  }
  editSubserviceLe(data){
    return this.http.put(`${this.baseUrl}/subserviceLE`, data, {headers: this.headers()}) as Observable<any>;
  }
  createDeal(data){
    return this.http.post(`${this.baseUrl}/createDeal`, data, {headers: this.headers()}) as Observable<any>;
  }
  getDeals(){
    return this.http.get(`${this.baseUrl}/getDeals`, {headers: this.headers()}) as Observable<any>;
  }
  //todo get full Deal ispravka
  getFullProject(ID: number){
    return this.http.get(`${this.baseUrl}/getFullProject/${ID}`, {headers: this.headers()}) as Observable<any>;
  }
//todo ispravka na deal history
  getProjectHitory(ID: number){
    return this.http.get(`${this.baseUrl}/getProjectHitory/${ID}`, {headers: this.headers()}) as Observable<any>;
  }

  getDPperNumberOfEmployee(){
    return this.http.get(`${this.baseUrl}/getDPperNumberOfEmployee`, {headers: this.headers()}) as Observable<any>;
  }

  getCDCMSeniority(){
    return this.http.get(`${this.baseUrl}/getCDCMSeniority`, {headers: this.headers()}) as Observable<any>;
  }

  // getComentsByProjectID(projectID){
  //   return this.http.get(`${this.baseUrl}/getComentsByProjectId/${projectID}`, {headers: this.headers()}) as Observable<any>;
  // }

  saveProjectComment(data){
    return this.http.post(`${this.baseUrl}/saveProjectComment`, data, {headers: this.headers()});
  }

  getCDCMStatics(){
    return this.http.get(`${this.baseUrl}/getCDCMStatics`, {headers: this.headers()}) as Observable<any>;
  }

  calculateCDCM(data){
    return this.http.post(`${this.baseUrl}/calculateCDCM`, data, {headers: this.headers()})
  }

  createCDCM(data){
    return this.http.post(`${this.baseUrl}/createCDCM`, data, {headers: this.headers()})
  }

  updateCDCM(data){
    return this.http.put(`${this.baseUrl}/editCDCM`, data, {headers: this.headers()}) as Observable<any>;
  }

  deleteCDCM(ID: number){
    return this.http.put(`${this.baseUrl}/deleteCDCM/${ID}`, null, {headers: this.headers()}) as Observable<any>;
  }
  lockCDCM(ID: number, approvalTemplateID: number, projectID:number){
    return this.http.put(`${this.baseUrl}/lockCDCM`, {ID, approvalTemplateID, projectID}, {headers: this.headers()}) as Observable<any>;
  }
  getApprovalTemplates(){
    return this.http.get(`${this.baseUrl}/getApprovalTemplates`, {headers: this.headers()}) as Observable<any>;
  }
  getApprovalTemplateByID(ID: number){
    return this.http.get(`${this.baseUrl}/getApprovalTemplateByID/${ID}`, {headers: this.headers()}) as Observable<any>;
  }
  deleteApprovalTemplateStep(data){
    return this.http.put(`${this.baseUrl}/deleteApprovalTemplateStep`, data, {headers: this.headers()}) as Observable<any>;
  }
  getUsersNamesBySearch(searchText){
    return this.http.get(`${this.baseUrl}/getUsersNamesBySearch/${searchText}`, {headers: this.headers()}) as Observable<any>;
  }
  addApprovalStepTemplate(data){
    return this.http.post(`${this.baseUrl}/addApprovalStepTemplate`, data, {headers: this.headers()}) as Observable<any>;
  }
  editApprovalTemplate(data) {
    return this.http.put(`${this.baseUrl}/editApprovalTemplate`, data, {headers: this.headers()}) as Observable<any>;
  }
  getApprovalsByCdcmID(cdcmID) {
    return this.http.get(`${this.baseUrl}/getApprovalsByCdcmID/${cdcmID}`, {headers: this.headers()}) as Observable<any>;
  }
  changeStatusApprovalStep(data){
    return this.http.put(`${this.baseUrl}/changeStatusAppruvalStep`, data, {headers: this.headers()}) as Observable<any>;
  }
  // getCdcmByProjectID(projectID: number){
  //   return this.http.get(`${this.baseUrl}/getCdcmByProjectID/${projectID}`, {headers: this.headers()}) as Observable<any>;
  // }
  isNotificationShow(themeID:number){
    return this.http.get(`${this.baseUrl}/isNotificationShow/${themeID}`, {headers: this.headers()}) as Observable<any>;
  }
  getLastNotification(themeID:number){
    return this.http.get(`${this.baseUrl}/getLastNotification/${themeID}`, {headers: this.headers()}) as Observable<any>;
  }
  getCDCMComments(cdcmID: number){
    return this.http.get(`${this.baseUrl}/getCDCMcomments/${cdcmID}`, {headers: this.headers()}) as Observable<any>;
  }

  getFeeTypes(){
    return this.http.get(`${this.baseUrl}/feeTypes`, {headers: this.headers()}) as Observable<any>;
  }

  getSalaryTypes(){
    return this.http.get(`${this.baseUrl}/salaryTypes`, {headers: this.headers()}) as Observable<any>;
  }
  // createDeal(data) {
  //     let headers = new HttpHeaders();
  //     headers = headers.set('Authorization', `Bearer ${this.cookieService.get('jwt')}`);
  //     return this.http.post(`${this.baseUrl}/createDeal`, data, {headers: headers}) as Observable<any>;
  // }
  //
  // getDealByProjectId(projectID){
  //   return this.http.get(`${this.baseUrl}/getDealByProjectId/${projectID}`, {headers: this.headers()}) as Observable<any>;
  // }

  // getDeals(){
  //   return this.http.get(`${this.baseUrl}/getDeals`, {headers: this.headers()}) as Observable<any>;
  // }
  // getDealHRA(dealID){
  //   return this.http.get(`${this.baseUrl}/getDealHRA/${dealID}`, {headers: this.headers()}) as Observable<any>;
  // }

}
