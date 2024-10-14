import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {RestService} from "../../../../services/rest.service";
import {NgClass, NgIf} from "@angular/common";

@Component({
  selector: 'app-choose-document-type',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf
  ],
  templateUrl: './choose-document-type.component.html',
  styleUrl: './choose-document-type.component.css'
})
export class ChooseDocumentTypeComponent implements OnInit{

  @Output() isValid: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() types: EventEmitter<any> = new EventEmitter<any>();

  saveDockForm: FormGroup;
  documentTypes;
  documentSubTypes: any[] = [];

  documentTypeObj = {type: null, subType: null};

  isTypeValid: boolean = false;
  isSubtypeValid: boolean = false;

  constructor(private rest: RestService) {
    this.isValid.emit(false);
    rest.getDocumentTypes().subscribe(res=>{
      if (res.status == 200) {
        this.documentTypes=res.data;
      }
    })
  }

  ngOnInit(): void {
        this.saveDockForm = new FormGroup({
          typeOfDockument: new FormControl(),
          subTypeOfDocument: new FormControl()
        });

        this.saveDockForm.get('typeOfDockument').valueChanges.subscribe(value => {

          this.saveDockForm.get('subTypeOfDocument').setValue(null);
          this.isSubtypeValid = false;
          this.onTypeClick(value)
          if (value !=null){
            this.isTypeValid = true;
          }
          this.isValid.emit(this.isTypeValid && this.isSubtypeValid);
          this.documentTypeObj.type = value;
          this.documentTypeObj.subType = null;
          this.types.emit(this.documentTypeObj);
        });
        this.saveDockForm.get('subTypeOfDocument').valueChanges.subscribe(value => {
          this.isSubtypeValid = value != null;
          this.isValid.emit(this.isTypeValid && this.isSubtypeValid);
          this.documentTypeObj.subType = value;
          this.types.emit(this.documentTypeObj);
        });
    }

  onTypeClick(type: any){
    this.documentSubTypes = [];
    this.rest.getDocumentSubTypesByTypeID(type.ID).subscribe(res=>{
      if (res.status == 200){
        this.documentSubTypes=res.data;
        this.isSubtypeValid = this.documentSubTypes.length===0
        this.isValid.emit(this.isTypeValid && this.isSubtypeValid)
      }
    })
  }

}
