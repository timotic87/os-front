import {Component, Inject, OnInit} from '@angular/core';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgIf} from "@angular/common";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {RestService} from "../../services/rest.service";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

@Component({
  selector: 'app-assign-admin',
  standalone: true,
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './assign-admin.component.html',
  styleUrl: './assign-admin.component.css'
})
export class AssignAdminComponent implements OnInit {

  assigneForm: FormGroup;

  currentUserList = [];
  currentUserChoosen;

  dealHraList = []

  constructor(private rest: RestService, @Inject(MAT_DIALOG_DATA) public deal) {
    this.loadDealHra()
  }

  ngOnInit(): void {
    this.assigneForm = new FormGroup({
      userChooser: new FormControl(null)
    });

    this.assigneForm.get('userChooser').valueChanges.subscribe(value => {
      this.rest.getUsersNamesBySearch(value).subscribe(res=>{
        console.log(res.data)
        if (res['status']===200) this.currentUserList = res['data'];
      })
    })
    }

  deleteUser(user){

  }

  addUser(){

  }

  onUserClick(user){
  this.currentUserChoosen = user;
  }

  loadDealHra(){
    // this.rest.getDealHRA(this.deal.ID).subscribe(res=>{
    //   if (res.status===200) {
    //     this.dealHraList = res['data'];
    //   }
    // })
  }
}
