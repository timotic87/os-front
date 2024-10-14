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

export const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'clients', component: ClientsComponent},
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
      {path: 'services', component: ServicesAndSubservicesComponent, outlet: 'admin'}]

  },
  {path: 'projects', component: ProjectsComponent},
  {path: 'project/:id', component: ProjectComponent},

];
