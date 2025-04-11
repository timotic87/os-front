import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ProjectService} from "../../services/project.service";
import {ProjectModel} from "../../models/projectModel";
import {DatePipe, NgIf} from "@angular/common";
import {ColorLabelComponent} from "../../customComponents/color-label/color-label.component";
import {MatDialog} from "@angular/material/dialog";
import {ProjectComentsDialogComponent} from "./project-coments-dialog/project-coments-dialog.component";
import {StuffingFlowComponent} from "./stuffing-flow/stuffing-flow.component";
import {CDCM} from "../../models/cdcm";
import {ApprovalModel} from "../../models/approval/approvalModel";
import {CDCMService} from "../../services/cdcm.service";
import {PyFlowComponent} from "./py-flow/py-flow.component";
import {RestService} from "../../services/rest.service";
import {DialogService} from "../../services/dialog.service";
import {HistoryModel} from "../../models/historyModel";
import {HistoryDialogComponent} from "../../customComponents/history-dialog/history-dialog.component";
import {
  ContractDocumentFormComponent
} from "../../clients/documentaton/elements/contract-document-form/contract-document-form.component";
import {PickFileComponent} from "../../clients/documentaton/elements/pick-file/pick-file.component";
import {FormGroup} from "@angular/forms";

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    NgIf,
    ColorLabelComponent,
    DatePipe,
    StuffingFlowComponent,
    PyFlowComponent,
    ContractDocumentFormComponent,
    PickFileComponent
  ],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit{

  file: File = null;

  projectId: number;
  project: ProjectModel;
  cdcm:CDCM[];

  approval: ApprovalModel;

  formGroup: FormGroup;


  constructor(private route: ActivatedRoute, public projectService: ProjectService, private matDialog: MatDialog,
              cdcmService: CDCMService, private rest: RestService, private dialogService: DialogService) {
    cdcmService.getFields();
    this.projectId = +this.route.snapshot.paramMap.get('id');
    this.projectService.getFullPageProject(this.projectId).then(data => {
      this.project = data[0];
    });

  }

  ngOnInit(): void {
    }

  openComment(){
    this.matDialog.open(ProjectComentsDialogComponent, {
      width: '70vh',
      maxHeight: '90vh',
      data: this.project
    });
  }

  viewHistory(){
    this.dialogService.showLoader();
    this.rest.getProjectHitory(this.projectId).subscribe(res => {
      this.dialogService.closseLoader();
      let histories: HistoryModel[] = [];
      if (res.status == 200) {
        for (let ho of res.data){
          histories.push(new HistoryModel(ho.ID, ho.description, ho.actionTime, ho.projectID, ho.userID, ho.firstName, ho.lastName, ho.profilePicUrl));
        }
        this.matDialog.open(HistoryDialogComponent,  {
          width: '40vw',
          height: '50vh',
          data: histories
        })
      }
    })
  }

}
