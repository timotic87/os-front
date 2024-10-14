import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {NgClass, NgIf} from "@angular/common";
import {MatDialogRef} from "@angular/material/dialog";
import {RestService} from "../../../../services/rest.service";
import {DepartmentModel} from "../../../../models/departmentModel";
import {DepartmentService} from "../../../../services/department.service";
import {UnitModel} from "../../../../models/unitModel";
import {UnitService} from "../../../../services/unit.service";
import {PositionModel} from "../../../../models/positionModel";
import {PositionService} from "../../../../services/position.service";
import {DialogService} from "../../../../services/dialog.service";

@Component({
  selector: 'app-create-user-dialog',
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
  templateUrl: './create-user-dialog.component.html',
  styleUrl: './create-user-dialog.component.css'
})
export class CreateUserDialogComponent implements OnInit{

  public addUserForm: FormGroup;
  public departmentsList: DepartmentModel[] = [];
  public unitList: UnitModel[] = [];
  public positionList: PositionModel[] = [];
  public isDepartmentValid: boolean = false;
  public isUnitValid: boolean = false;

  currentDepartment: DepartmentModel = null;
  currentUnit: UnitModel = null;
  public currentPosition: PositionModel = null;

  constructor(private matDialogRef: MatDialogRef<CreateUserDialogComponent>, private rest: RestService, private departmentService: DepartmentService,
              private unitService: UnitService, private positionService: PositionService, private dialogService: DialogService) {
    this.getDepartments();
  }

  ngOnInit(): void {
    this.addUserForm = new FormGroup({
      firstName: new FormControl(null, [Validators.required]),
      lastName: new FormControl(null, [Validators.required]),
      department: new FormControl(null, [Validators.required]),
      unit: new FormControl(null, Validators.required),
      position: new FormControl(null, [Validators.required]),
      mail: new FormControl(null),
      username: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required])
    });

    this.addUserForm.get('department').valueChanges.subscribe(value => {
      this.isDepartmentValid = this.addUserForm.get('department').valid;
      if (value==='' || !this.addUserForm.get('department').valid){} {
        this.currentDepartment=null;
        this.unitList=[];
      }
      this.addUserForm.get('unit').setValue(null);
    });

    this.addUserForm.get('unit').valueChanges.subscribe(value => {
      this.isUnitValid = this.addUserForm.get('unit').valid;
      if (value==='' || !this.addUserForm.get('unit').valid){
        this.currentUnit = null;
        this.positionList=[];
      }
      this.addUserForm.get('position').setValue(null);
    });
    }

  closeDialog(){
    this.matDialogRef.close();
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

  addUser(){
    if(this.addUserForm.invalid){
      this.dialogService.showMsgDialog('The form is not valid. Please fill in all the blanks!');
      return;
    }
    this.dialogService.showLoader()
    const userData = this.addUserForm.value;
    userData.department = this.currentDepartment.id;
    userData.unit = this.currentUnit.id;
    userData.position = this.currentPosition.id;
    this.rest.createUser(userData).subscribe(res=>{
      this.dialogService.closseLoader()
      if(res.status===200){
        this.matDialogRef.close(res.status)
      }
    })
  }

}
