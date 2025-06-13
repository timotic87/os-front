import {Router, Routes} from '@angular/router';
import {LoginComponent} from "./login/login.component";
import {ClientsComponent} from "./clients/clients.component";
import {ProfileComponent} from "./profile/profile.component";
import {AdminComponent} from "./admin/admin.component";
import {inject} from "@angular/core";
import {UserService} from "./services/user.service";
import {DialogService} from "./services/dialog.service";
import {UsersAdminComponent} from "./admin/adminPages/users-admin/users-admin.component";
import {
  ServicesAndSubservicesComponent
} from "./admin/adminPages/services-and-subservices/services-and-subservices.component";
import {ApprovalsComponent} from "./admin/adminPages/approvals/approvals.component";
import {DealsComponent} from "./deals/deals.component";
import {DealComponent} from "./deals/deal/deal.component";
import {DocumentsComponent} from "./admin/adminPages/documents/documents.component";
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {DocumentViewComponent} from "./flow-parts/document-view/document-view.component";

export const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'clients', component: ClientsComponent, canActivate: [()=>{

      const userService = inject(UserService);
      const dialogService = inject(DialogService);

      if (userService.can('view_all_clients')) {
        return true;
      }
      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  {path: 'profile', component: ProfileComponent},
  {
    path: 'admin', component: AdminComponent, canActivate: [() => {
      const userService = inject(UserService);
      const router = inject(Router);
      const dialogService = inject(DialogService);
      if (userService.getUser() && userService.getUser().unit.id === 19 && userService.getUser().position.id === 44) {
        return true;
      }
      router.navigate(['login']);
      dialogService.showMsgDialog("You don't have rights for Admin Page!");
      return false;
    }],
    children: [{path: 'users', component: UsersAdminComponent, outlet: 'admin'},
      {path: 'services', component: ServicesAndSubservicesComponent, outlet: 'admin'},
      {path: 'approvals', component: ApprovalsComponent, outlet: 'admin'},
      {path: 'documents', component: DocumentsComponent, outlet: 'admin'},
    ]

  },
  {path: 'deals', component: DealsComponent, canActivate: [()=>{
      const userService = inject(UserService);
      const dialogService = inject(DialogService);

      if (userService.can('view_list_deals')) {
        return true;
      }

      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  {path: 'deal/:id', component: DealComponent, canActivate: [async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
      const userService = inject(UserService);
      const dialogService = inject(DialogService);
      const id = Number(route.paramMap.get('id'));

      const hasGlobal = userService.can('view_deal');
      const hasEntity = await userService.hasEntityAccess('deal', id);

      if (hasGlobal || hasEntity) {
        return true;
      }

      dialogService.showMsgDialog('You don’t have permission');
      return false;
    }]
  },
  {path: 'projects', component: DealsComponent, canActivate: [async ()=>{
      const userService = inject(UserService);
      const dialogService = inject(DialogService);
      if (userService.can('')) {//todo dodati ime permisije
        return true;
      }
      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  { path: 'documentview/:id', component: DocumentViewComponent }

];


