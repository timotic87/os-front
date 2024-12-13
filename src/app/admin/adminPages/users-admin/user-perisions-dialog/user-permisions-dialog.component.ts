import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../../services/rest.service";
import {DialogService} from "../../../../services/dialog.service";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-user-perisions-dialog',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './user-permisions-dialog.component.html',
  styleUrl: './user-permisions-dialog.component.css'
})
export class UserPermisionsDialogComponent implements OnInit{

  permisionForm: FormGroup;

  arrayOfArrays = [];

  constructor(@Inject(MAT_DIALOG_DATA) public user: any, private rest: RestService, private dialogRef: MatDialogRef<UserPermisionsDialogComponent>, private dialogService: DialogService) {
    console.log(user)

    // @ts-ignore
    const groupedBySection = this.user.permisions.reduce<Record<number, any[]>>((acc, item) => {
      if (!acc[item.sectionID]) {
        acc[item.sectionID] = [];
      }
      acc[item.sectionID].push(item);
      return acc;
    }, {});
    this.arrayOfArrays = Object.values(groupedBySection);

    console.log(this.arrayOfArrays);
  }

  ngOnInit(): void {
        this.permisionForm = new FormGroup({
          createUser: new FormControl(this.user.permisions[0].userId===this.user.id),
          changeUserStatus: new FormControl(this.user.permisions[5].userId===this.user.id),
          userList: new FormControl(this.user.permisions[6].userId===this.user.id),
          editUser: new FormControl(this.user.permisions[7].userId===this.user.id),
          resetUserPass: new FormControl(this.user.permisions[8].userId===this.user.id),
          showUserPermisions: new FormControl(this.user.permisions[9].userId===this.user.id),
          getClient: new FormControl(this.user.permisions[1].userId===this.user.id),
          editClient: new FormControl(this.user.permisions[2].userId===this.user.id),
          deleteClient: new FormControl(this.user.permisions[3].userId===this.user.id),
          createClient: new FormControl(this.user.permisions[4].userId===this.user.id),
          addDoc: new FormControl(this.user.permisions[12].userId===this.user.id),
          viewDoc: new FormControl(this.user.permisions[11].userId===this.user.id),
          deleteDoc: new FormControl(this.user.permisions[10].userId===this.user.id),
          services: new FormControl(this.user.permisions[13].userId===this.user.id),
          subservices: new FormControl(this.user.permisions[14].userId===this.user.id),
          subservicesLe: new FormControl(this.user.permisions[15].userId===this.user.id)
        });
    }


  changePermision(){
    this.dialogService.showLoader();
    this.rest.changeUserPermisions(this.user.permisions).subscribe(res=>{
      this.dialogService.closseLoader();
      console.log(res)
    })

  }

  closeDialog(){
    this.dialogRef.close();
  }

  onChange(permision){
    if(permision.userId===this.user.id){
      permision.userId = null;

    }else {
      permision.userId=this.user.id;
    }
  }

}
