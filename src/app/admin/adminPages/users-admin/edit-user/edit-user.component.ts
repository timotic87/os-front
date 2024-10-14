import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgClass, NgIf} from "@angular/common";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../../services/rest.service";
import {DepartmentModel} from "../../../../models/departmentModel";
import {DepartmentService} from "../../../../services/department.service";
import {UnitModel} from "../../../../models/unitModel";
import {PositionModel} from "../../../../models/positionModel";
import {UnitService} from "../../../../services/unit.service";
import {PositionService} from "../../../../services/position.service";
import {DialogService} from "../../../../services/dialog.service";

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [
    FormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    NgIf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit{

  editUserForm: FormGroup;
  departmentsList: DepartmentModel[] = [];
  public unitList: UnitModel[] = [];
  public positionList: PositionModel[] = [];
  public isDepartmentValid: boolean = false;
  public isUnitValid: boolean = false;

  currentDepartment: DepartmentModel = null;
  currentUnit: UnitModel = null;
  public currentPosition: PositionModel = null;

  constructor(private dialogRef: MatDialogRef<EditUserComponent>,@Inject(MAT_DIALOG_DATA) public user: any, private rest: RestService,
              private departmentService: DepartmentService, private unitService: UnitService, private positionService: PositionService, private dialogService: DialogService) {
    this.currentDepartment = user.department;
    this.currentUnit = user.unit;
    this.currentPosition = user.position;
    this.getDepartments();
    this.getUnitsByDepartmentID(this.currentDepartment.id);
    this.getPositionsByUnitID(this.currentUnit.id);
  }

  ngOnInit(): void {
    this.editUserForm = new FormGroup({
      firstName: new FormControl(this.user.firstName, [Validators.required]),
      lastName: new FormControl(this.user.lastName, [Validators.required]),
      department: new FormControl(this.currentDepartment.name, [Validators.required]),
      unit: new FormControl(this.currentUnit.name, Validators.required),
      position: new FormControl(this.currentPosition.name, [Validators.required]),
      mail: new FormControl(this.user.mail),
      username: new FormControl(this.user.userName, [Validators.required])
    });

    this.editUserForm.get('department').valueChanges.subscribe(value => {
      this.isDepartmentValid = this.editUserForm.get('department').valid;
      if (value==='' || !this.editUserForm.get('department').valid){} {
        this.currentDepartment=null;
        this.unitList=[];
      }
      this.editUserForm.get('unit').setValue(null);
    });

    this.editUserForm.get('unit').valueChanges.subscribe(value => {
      this.isUnitValid = this.editUserForm.get('unit').valid;
      if (value==='' || !this.editUserForm.get('unit').valid){
        this.currentUnit = null;
        this.positionList=[];
      }
      this.editUserForm.get('position').setValue(null);
    });
    }


  editUser(){
    if(this.editUserForm.valid){
      this.dialogService.showLoader()
      let userData = this.editUserForm.value;
      userData.id = this.user.id;
      userData.department = this.currentDepartment;
      userData.unit = this.currentUnit;
      userData.position = this.currentPosition;
      this.rest.editUser(userData).subscribe(res=>{
        this.dialogService.closseLoader()
        if(res.status===201){
          this.dialogRef.close(res.status);
          return;
        }
        this.dialogService.showMsgDialog(`Error: ${res.status} msg: ${res.msg}`);
      })
    }else {
      this.dialogService.showMsgDialog("You need to fill in all the blanks");
    }
  }

  closeDialog(){
    this.dialogRef.close();
  }
  getDepartments(){
    this.rest.getDepartments().subscribe(res=>{
      if(res.status===200){
        this.departmentsList = this.departmentService.createListOfDepartments(res.data);
      }
    })
  }
  getUnitsByDepartmentID(departmentID){
    this.rest.getUnitsByDepartmentID(departmentID).subscribe(res=>{
      if(res.status===200){
        this.unitList = this.unitService.createUnitList(res.data);
      }
    });
  }

  getPositionsByUnitID(unitID){
    this.rest.getPositionsByUnitID(unitID).subscribe(res=>{
      if(res.status===200){
        this.positionList = this.positionService.createPositionList(res.data);
      }
    })
  }
  departmentClick(department){
    this.currentDepartment = department;
    this.getUnitsByDepartmentID(department.id);
  }

  onUnitItemClick(unit){
    this.currentUnit = unit;
    this.getPositionsByUnitID(unit.id)

  }
  onPositionClick(position){
    this.currentPosition = position;
  }
}
