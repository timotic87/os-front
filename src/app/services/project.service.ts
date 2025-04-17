import {Injectable} from '@angular/core';
import {RestService} from "./rest.service";
import {DialogService} from "./dialog.service";
import {ProjectModel, Comment} from "../models/projectModel";
import {CDCM} from "../models/cdcm";

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  projectsList: ProjectModel[] = [];
  currentProject: ProjectModel;

  constructor(private rest: RestService, private dialogService: DialogService) {
  }


  // createNewProject(data: any, dialogRef) {
  //   this.dialogService.showLoader()
  //   this.rest.createProject(data).subscribe(res => {
  //     this.dialogService.closseLoader()
  //     if (res.status === 201) {
  //       this.projectsList.unshift(ProjectModel.createProjectModel(res.data.row.recordset[0]))
  //       dialogRef.close(res.status);
  //     } else {
  //       this.dialogService.errorDialog(res)
  //     }
  //     dialogRef.close(res.status);
  //   });
  // }

  updateProjectList() {
    this.projectsList = [];
    this.dialogService.showLoader()
    // this.rest.getProjects().subscribe(res => {
    //   this.dialogService.closseLoader();
    //   if (res.status === 200) {
    //     for (let item of res.data) {
    //       this.projectsList.push(ProjectModel.createProjectModel(item));
    //     }
    //   }
    // })
  }

  // async getFullPageProject(ID): Promise<any> {
  //   let data: any = [];
  //   this.dialogService.showLoader();
  //   try {
  //     const res = await this.rest.getFullProject(ID).toPromise();
  //     this.dialogService.closseLoader();
  //     let cdcmArr: CDCM[] = [];
  //     if (res.status === 200) {
  //       data[0] = ProjectModel.createProjectModel(res.data[0]);
  //       if (Array.isArray(res.data[1])){
  //         for (let item of res.data[1]) {
  //           const cdcm = CDCM.createCDCMModel(item)
  //           cdcmArr.push(cdcm)
  //         }
  //
  //       }
  //       else{
  //         cdcmArr.push(CDCM.createCDCMModel(res.data[1]));
  //       }
  //       data[1]=cdcmArr
  //     }
  //   } catch (error) {
  //     this.dialogService.closseLoader();
  //   }
  //   return data;
  // }
//todo promena na deal
  // async setProjectComents(project: ProjectModel) {
  //   this.dialogService.showLoader();
  //   try {
  //     const res = await this.rest.getComentsByProjectID(project.ID).toPromise();
  //     if (res.status === 200) {
  //       project.comments = Comment.createCommnetArr(res.data);
  //     }
  //     this.dialogService.closseLoader();
  //   } catch (error) {
  //     console.error(error);
  //     this.dialogService.closseLoader();
  //   }
  // }

  // async saveComment(data, project: ProjectModel) {
  //   this.dialogService.showLoader();
  //   try {
  //     const res = await this.rest.saveProjectComment(data).toPromise() as any;
  //     if (res.status === 201) {
  //       let item = res.data.row.recordset[0]
  //       let commentTime = new Date(item.createdDate);
  //       commentTime.setHours(commentTime.getHours()-2);
  //       let comment = new Comment(item.comment, commentTime, item.commentUserFirstname, item.commentUserLastname, item.commentUserPicUrl, item.statusID)
  //       project.comments.unshift(comment);
  //     }
  //     this.dialogService.closseLoader();
  //
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
}
