const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // Admin
  admin_access: 'Access to the Admin panel (users, settings, permissions, documents, etc.)',
  // Clients
  view_all_clients: 'View all clients in the system, not just assigned ones',
  create_client: 'Create new client records',
  edit_all_clients: 'Edit any client record, not just assigned ones',
  delete_client: 'Delete client records',
  // Deals
  view_list_deals: 'See the Deals list page',
  view_deal: 'Open and view individual deal details',
  edit_deal: 'Edit deal data and advance deal flow steps',
  change_deal_status: 'Manually change the status of a deal',
  change_deal_bd: 'Reassign the BD consultant on a deal',
  view_deal_history: 'View the change history/audit log for deals',
  view_entity_history: 'View the change history for any entity (deals, orders, etc.)',
  view_all_comments: 'View comments on all deals, not just own',
  create_all_comments: 'Post comments on any deal',
  // Recruiting Orders
  view_list_recruiting_orders: 'See the Recruiting Orders list page',
  view_recruiting_order: 'Open and view individual recruiting order details',
  create_recruiting_order: 'Create new recruiting orders',
  edit_recruiting_order: 'Edit recruiting order data',
  edit_position: 'Edit position entries on recruiting orders',
  delete_position: 'Delete position entries from recruiting orders',
  // Invoices — Sales
  view_list_invoices: 'Access the Invoices page (both sales and recruiting)',
  view_invoice: 'View individual invoice details',
  create_invoice: 'Create new sales invoices',
  create_sales_invoice: 'Create new sales invoices',
  edit_invoice: 'Edit existing sales invoices',
  delete_invoice: 'Delete invoices',
  send_sales_invoice_to_bc: 'Send sales invoices to Business Central',
  create_sales_credit_note: 'Create KO (credit) or KZ (debit) notes for sales invoices',
  complete_sales_credit_note: 'Fill in and complete sales KO/KZ notes before sending to BC',
  // Invoices — Recruiting
  approve_recruiting_invoice: 'Approve recruiting invoices before they can be sent to BC',
  send_recruiting_invoice_to_bc: 'Send recruiting invoices to Business Central',
  create_rec_credit_note: 'Create KO (credit) or KZ (debit) notes for recruiting invoices',
  complete_rec_credit_note: 'Fill in and complete recruiting KO/KZ notes before sending to BC',
  // Audit
  view_audit_log: 'View the system-wide audit log',
};

export function getPermissionDescription(name: string): string {
  if (PERMISSION_DESCRIPTIONS[name]) {
    return PERMISSION_DESCRIPTIONS[name];
  }
  if (name.startsWith('view_')) {
    const type = name.replace(/^view_/, '').replace(/_/g, ' ');
    return `View "${type}" documents`;
  }
  if (name.startsWith('download_')) {
    const type = name.replace(/^download_/, '').replace(/_/g, ' ');
    return `Download "${type}" documents`;
  }
  return '';
}
