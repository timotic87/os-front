import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {observableToBeFn} from "rxjs/internal/testing/TestScheduler";
import {ProjectService} from "../../services/project.service";
import {ProjectModel} from "../../models/projectModel";
import {DatePipe, NgIf} from "@angular/common";
import {ColorLabelComponent} from "../../customComponents/color-label/color-label.component";
import {MatDialog} from "@angular/material/dialog";
import {CdcmDialogComponent} from "../cdcm-dialog/cdcm-dialog.component";
import {ProjectComentsDialogComponent} from "./project-coments-dialog/project-coments-dialog.component";
import {StuffingFlowComponent} from "./stuffing-flow/stuffing-flow.component";
import {CDCM} from "../../models/cdcm";

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    NgIf,
    ColorLabelComponent,
    DatePipe,
    StuffingFlowComponent
  ],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit{

  projectId: number;
  project: ProjectModel;
  cdcm:CDCM[];

  constructor(private route: ActivatedRoute, public projectService: ProjectService, private matDialog: MatDialog) {
    this.projectId = +this.route.snapshot.paramMap.get('id');
    this.projectService.getFullPageProject(this.projectId).then(data => {
      this.project = data[0];
      this.cdcm = data[1];
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
