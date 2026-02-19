import {Component, OnInit} from '@angular/core';
import {RestService} from '../../../services/rest.service';
import {DialogService} from '../../../services/dialog.service';
import {CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent} from '../../../shared/components/ui/card/card.component';
import {ButtonComponent} from '../../../shared/components/ui/button/button.component';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-entity-access',
  standalone: true,
  imports: [
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent,
    ButtonComponent, FormsModule, NgForOf, NgIf
  ],
  templateUrl: './entity-access.component.html',
  styleUrl: './entity-access.component.css'
})
export class EntityAccessComponent implements OnInit {

  entityTypes = ['deal', 'recruiting_order', 'client'];
  accessLevels = ['view', 'edit'];

  // Search
  searchEntityType = 'deal';
  searchEntityId: number | null = null;
  accessList: any[] = [];
  searched = false;

  // Grant form
  allUsers: any[] = [];
  grantUserId: number | null = null;
  grantAccessLevel = 'view';

  constructor(private rest: RestService, private dialogService: DialogService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.rest.getUsers().subscribe(res => {
      if (res.status === 200) {
        this.allUsers = res.data;
      }
    });
  }

  search() {
    if (!this.searchEntityId) return;
    this.rest.getEntityAccessUsers(this.searchEntityType, this.searchEntityId).subscribe({
      next: res => {
        if (res.status === 200) {
          this.accessList = res.data;
          this.searched = true;
        }
      },
      error: err => this.dialogService.errorServDialog(err)
    });
  }

  grant() {
    if (!this.grantUserId || !this.searchEntityId) return;
    this.rest.grantEntityAccess({
      userId: this.grantUserId,
      entityType: this.searchEntityType,
      entityId: this.searchEntityId,
      accessLevel: this.grantAccessLevel
    }).subscribe({
      next: res => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Access granted!', '', 3000);
          this.search();
          this.grantUserId = null;
        }
      },
      error: err => this.dialogService.errorServDialog(err)
    });
  }

  revoke(access: any) {
    this.rest.revokeEntityAccess({
      userId: access.userId,
      entityType: access.entityType,
      entityId: access.entityId
    }).subscribe({
      next: res => {
        if (res.status === 200) {
          this.dialogService.showSnackBar('Access revoked!', '', 3000);
          this.search();
        }
      },
      error: err => this.dialogService.errorServDialog(err)
    });
  }
}
