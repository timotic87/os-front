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
import {ProjectsComponent} from "./projects/projects.component";
import {ProjectComponent} from "./projects/project/project.component";
import {ApprovalsComponent} from "./admin/adminPages/approvals/approvals.component";
import {RestService} from "./services/rest.service";
import {firstValueFrom} from "rxjs";
import {DealsComponent} from "./deals/deals.component";

export const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'clients', component: ClientsComponent, canActivate: [async ()=>{
      const userService = inject(UserService);
      const rest: RestService = inject(RestService);
      const dialogService = inject(DialogService);

      try {
        const res = await firstValueFrom(rest.getUserPermisions(userService.getUser().id));
        const perm = res.data.find(permision => permision.id === 2);
        if (!perm.userId) {
          dialogService.showMsgDialog('You dont have permission');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Router error - clients:', error);
        return false;
      }
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
    ]

  },
  {path: 'deals', component: DealsComponent},
  {path: 'deal/:id', component: ProjectComponent},//todo reformat name
  {path: 'projects', component: DealsComponent, canActivate: [async ()=>{
      const userService = inject(UserService);
      const rest: RestService = inject(RestService);
      const dialogService = inject(DialogService);

      try {
        const res = await firstValueFrom(rest.getUserPermisions(userService.getUser().id));
        const perm = res.data.find(permision => permision.id === 21);
        if (!perm.userId) {
          dialogService.showMsgDialog('You dont have permission');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Router error - clients:', error);
        return false;
      }
    }]},

];


