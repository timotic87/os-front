import {Router, Routes} from '@angular/router';
import {HelpComponent} from "./help/help.component";
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
import {PermissionTemplatesComponent} from "./admin/adminPages/permission-templates/permission-templates.component";
import {SalaryParamsComponent} from "./admin/adminPages/salary-params/salary-params.component";
import {EntityAccessComponent} from "./admin/adminPages/entity-access/entity-access.component";
import {LegalEntitiesComponent} from "./admin/adminPages/legal-entities/legal-entities.component";
import {CostCentersComponent} from "./admin/adminPages/cost-centers/cost-centers.component";
import {SettingsComponent} from "./admin/adminPages/settings/settings.component";
import {FlowsComponent} from "./admin/adminPages/flows/flows.component";
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {DocumentViewComponent} from "./flow-parts/document-view/document-view.component";
import {RecruitingOrderComponent} from "./recruiting-orders/recruiting-order/recruiting-order.component";
import {RecruitingOrdersComponent} from "./recruiting-orders/recruiting-orders.component";
import { authGuard } from './guards/auth.guard';
import {InvoicesComponent} from "./invoices/invoices.component";
import {SalesInvoicesComponent} from "./sales-invoices/sales-invoices.component";
import {AuditLogComponent} from "./audit-log/audit-log.component";
import {ProjectPageComponent} from "./projects/project-page/project-page.component";
import {ProjectsComponent} from "./projects/projects.component";

export const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'clients', component: ClientsComponent, canActivate: [authGuard, ()=>{
      const userService = inject(UserService);
      const dialogService = inject(DialogService);

      if (userService.can('view_all_clients')) {
        return true;
      }
      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  {path: 'profile', component: ProfileComponent, canActivate: [authGuard]},
  {
    path: 'admin', component: AdminComponent, canActivate: [authGuard, () => {
      const userService = inject(UserService);
      const router = inject(Router);
      const dialogService = inject(DialogService);
      if (userService.getUser() && userService.can('admin_access')) {
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
      {path: 'templates', component: PermissionTemplatesComponent, outlet: 'admin'},
      {path: 'salary-params', component: SalaryParamsComponent, outlet: 'admin'},
      {path: 'entity-access', component: EntityAccessComponent, outlet: 'admin'},
      {path: 'legal-entities', component: LegalEntitiesComponent, outlet: 'admin'},
      {path: 'cost-centers', component: CostCentersComponent, outlet: 'admin'},
      {path: 'settings', component: SettingsComponent, outlet: 'admin'},
      {path: 'flows', component: FlowsComponent, outlet: 'admin'},
    ]

  },
  {path: 'deals', component: DealsComponent, canActivate: [authGuard, ()=>{
      const userService = inject(UserService);
      const dialogService = inject(DialogService);

      if (userService.can('view_list_deals') || userService.hasAnyEntityAccess('deal')) {
        return true;
      }

      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  {path: 'deal/:id', component: DealComponent, canActivate: [authGuard, async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
      const userService = inject(UserService);
      const dialogService = inject(DialogService);
      const id = Number(route.paramMap.get('id'));

      const hasGlobal = userService.can('view_deal');
      const hasEntity = await userService.hasEntityAccess('deal', id);

      if (hasGlobal || hasEntity) {
        return true;
      }

      dialogService.showMsgDialog("You don't have permission");
      return false;
    }]
  },
  {path: 'projects', component: ProjectsComponent, canActivate: [authGuard, ()=>{
      const userService = inject(UserService);
      const dialogService = inject(DialogService);
      if (userService.can('view_list_deals') || userService.hasAnyEntityAccess('deal') || userService.hasAnyEntityAccess('project')) {
        return true;
      }
      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  {path: 'projects/deal/:dealID', component: ProjectPageComponent, canActivate: [authGuard, async (route: ActivatedRouteSnapshot) => {
      const userService = inject(UserService);
      const dialogService = inject(DialogService);
      const dealID = Number(route.paramMap.get('dealID'));
      if (userService.can('view_list_invoices') || await userService.hasEntityAccess('deal', dealID)) {
        return true;
      }
      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  {path: 'projects/:id', component: ProjectPageComponent, canActivate: [authGuard, async (route: ActivatedRouteSnapshot) => {
      const userService = inject(UserService);
      const dialogService = inject(DialogService);
      const id = Number(route.paramMap.get('id'));
      if (userService.can('view_list_invoices') || await userService.hasEntityAccess('project', id)) {
        return true;
      }
      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  { path: 'documentview/:id', component: DocumentViewComponent, canActivate: [authGuard] },
  {path: 'recruiting-orders', component: RecruitingOrdersComponent, canActivate: [authGuard, ()=>{
      const userService = inject(UserService);
      const dialogService = inject(DialogService);

      if (userService.can('view_list_recruiting_orders') || userService.hasAnyEntityAccess('recruiting_order')) {
        return true;
      }
      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  {path: 'recruiting-order/:id', component: RecruitingOrderComponent, canActivate: [authGuard, async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
      const userService = inject(UserService);
      const dialogService = inject(DialogService);
      const id = Number(route.paramMap.get('id'));

      const hasGlobal = userService.can('view_recruiting_order');
      const hasEntity = await userService.hasEntityAccess('recruiting_order', id);

      if (hasGlobal || hasEntity) {
        return true;
      }

      dialogService.showMsgDialog("You don't have permission");
      return false;
    }]
  },
  {path: 'invoices', component: InvoicesComponent, canActivate: [authGuard, ()=>{
      const userService = inject(UserService);
      const dialogService = inject(DialogService);

      if (userService.can('view_list_invoices')) {
        return true;
      }
      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},
  {path: 'sales-invoices', component: SalesInvoicesComponent, canActivate: [authGuard]},
  {path: 'help', component: HelpComponent, canActivate: [authGuard]},
  {path: 'audit-log', component: AuditLogComponent, canActivate: [authGuard, ()=>{
      const userService = inject(UserService);
      const dialogService = inject(DialogService);

      if (userService.can('view_audit_log')) {
        return true;
      }
      dialogService.showMsgDialog('You dont have permission');
      return false;
    }]},

];


