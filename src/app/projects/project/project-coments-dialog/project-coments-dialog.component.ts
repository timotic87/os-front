import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {ProjectService} from "../../../services/project.service";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import {RestService} from "../../../services/rest.service";
import {UserService} from "../../../services/user.service";
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-deal-coments-dialog',
  standalone: true,
  imports: [
    DatePipe,
    NgIf,
    NgForOf,
    ReactiveFormsModule
  ],
  templateUrl: './project-coments-dialog.component.html',
  styleUrl: './project-coments-dialog.component.css'
})
export class ProjectComentsDialogComponent implements OnInit{

  commentForm: FormGroup;

  commentText = null;

  constructor(@Inject(MAT_DIALOG_DATA) public project, private projectService: ProjectService, private userService: UserService) {
    // projectService.setProjectComents(project)

  }

  ngOnInit(): void {
        this.commentForm = new FormGroup({
          commentText: new FormControl(null)
        });
    }

  sendComment(){
    const data = {projectID: this.project.ID, comment: this.commentForm.value.commentText, statusID: 1, creatorID: this.userService.getUser().id };
    this.projectService.saveComment(data, this.project);
    this.commentForm.get("commentText").setValue(null);
  }
}
