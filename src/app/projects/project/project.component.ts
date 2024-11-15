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

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    NgIf,
    ColorLabelComponent,
    DatePipe,
    StuffingFlowComponent,
    PyFlowComponent
  ],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit{

  projectId: number;
  project: ProjectModel;
  cdcm:CDCM[];

  approval: ApprovalModel;


  constructor(private route: ActivatedRoute, public projectService: ProjectService, private matDialog: MatDialog, cdcmService: CDCMService) {
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

}
