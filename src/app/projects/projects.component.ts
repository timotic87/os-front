import { Component } from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {CreateProjectDialogComponent} from "./create-project-dialog/create-project-dialog.component";
import {ProjectService} from "../services/project.service";
import {DatePipe, NgIf} from "@angular/common";
import {Router} from "@angular/router";
import {UserService} from "../services/user.service";
import {RestService} from "../services/rest.service";

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent {

  createProjectDisable = true;

  constructor(private matDialog: MatDialog, public projectService: ProjectService, private router: Router, private userService: UserService, private rest: RestService) {
    projectService.updateProjectList();
    this.rest.getUserPermisions(userService.getUser().id).subscribe(permisions => {
      console.log(permisions)
      let perm = permisions.find(permision => permision.id === 17);
      this.createProjectDisable = perm.userId ? false : true;
    })
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
