import { Component } from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {CreateProjectDialogComponent} from "./create-project-dialog/create-project-dialog.component";
import {ProjectService} from "../services/project.service";
import {DatePipe} from "@angular/common";
import {MatMenuTrigger} from "@angular/material/menu";
import {Router} from "@angular/router";

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatMenuTrigger
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent {

  constructor(private matDialog: MatDialog, public projectService: ProjectService, private router: Router) {
    projectService.updateProjectList();
  }

  createProject(){
    this.matDialog.open(CreateProjectDialogComponent, {
      minWidth: '900px',
      maxWidth: '1200px',
      maxHeight: '90vh'
    })
  }

  onProjectClick(project){
    this.projectService.currentProject = project;
    this.router.navigate([`/project/${project.ID}`])
    // const url = window.location.origin + `/project/${project.ID}`; // Dodaj query parametar`
    // window.open(url, '_blank');
  }

}
