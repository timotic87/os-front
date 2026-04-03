import { Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Subsection {
  sr: { title: string; content: string[] };
  en: { title: string; content: string[] };
}

interface HelpSection {
  id: string;
  icon: string;
  color: string;
  open: boolean;
  sr: { title: string };
  en: { title: string };
  subsections: Subsection[];
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, NgClass, RouterModule],
  templateUrl: './help.component.html'
})
export class HelpComponent {

  lang: 'sr' | 'en' = 'sr';

  sections: HelpSection[] = [
    {
      id: 'clients',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      color: 'text-blue-600 dark:text-blue-400',
      open: false,
      sr: { title: 'Clients' },
      en: { title: 'Clients' },
      subsections: [
        {
          sr: {
            title: 'Pregled i pretraga',
            content: [
              'Tabela prikazuje sve klijente: ime, grad, adresa, email i ID.',
              'Ukucajte deo naziva u polje za pretragu i pritisnite Enter ili kliknite "Search".',
              'Kliknite "Clear" da resetujete pretragu.',
              'Broj redova po stranici se bira u padajućoj listi (30 / 50 / 100).',
            ]
          },
          en: {
            title: 'Overview and search',
            content: [
              'The table shows all clients: name, city, address, email and ID.',
              'Type part of the name in the search field and press Enter or click "Search".',
              'Click "Clear" to reset the search.',
              'Number of rows per page is selected from a dropdown (30 / 50 / 100).',
            ]
          }
        },
        {
          sr: {
            title: 'Detalji klijenta',
            content: [
              'Kliknite na klijenta u tabeli da otvorite detaljnu stranu.',
              'Prikazuju se kontakt podaci, adresa, PIB, matični broj i email za finansije.',
              'Na detaljima klijenta se vide svi vezani Deals i Projects.',
              'Kliknite "New Deal" da pokrenete novi deal za tog klijenta.',
            ]
          },
          en: {
            title: 'Client details',
            content: [
              'Click on a client in the table to open the detail page.',
              'Contact info, address, VAT number, registration number and finance email are displayed.',
              'All related Deals and Projects are visible on the client detail page.',
              'Click "New Deal" to start a new deal for that client.',
            ]
          }
        },
        {
          sr: {
            title: 'Kreiranje i brisanje',
            content: [
              'Dugme "Add Client" je vidljivo samo korisnicima sa odgovarajućom dozvolom.',
              'Brisanje klijenta je moguće samo ako nema vezanih zapisa i ako imate dozvolu.',
            ]
          },
          en: {
            title: 'Creating and deleting',
            content: [
              'The "Add Client" button is visible only to users with the appropriate permission.',
              'Deleting a client is only possible if there are no related records and you have permission.',
            ]
          }
        }
      ]
    },
    {
      id: 'deals',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'text-violet-600 dark:text-violet-400',
      open: false,
      sr: { title: 'Deals' },
      en: { title: 'Deals' },
      subsections: [
        {
          sr: {
            title: 'Lista i filteri',
            content: [
              'Na vrhu stranice su kartice koje filtriraju po statusu: Total Deals, Active, Pending, Completed — kliknite na karticu da filtrirate.',
              'Dostupni filteri: Legal Entity, Business Line, Status i Search Client.',
              'Kliknite "Search" da primenite filtere ili "Clear" da ih resetujete.',
              'U tabeli se vide: ID, datum, Business Line, klijent, pravno lice, BD konsultant, flow status i status deala.',
            ]
          },
          en: {
            title: 'List and filters',
            content: [
              'At the top are stat cards that filter by status: Total Deals, Active, Pending, Completed — click a card to filter.',
              'Available filters: Legal Entity, Business Line, Status and Search Client.',
              'Click "Search" to apply filters or "Clear" to reset them.',
              'The table shows: ID, date, Business Line, client, legal entity, BD consultant, flow status and deal status.',
            ]
          }
        },
        {
          sr: {
            title: 'Tipovi Deal-ova',
            content: [
              'REG — Recruiting Deal: prolazi kroz flow za regrutaciju.',
              'PY — Payroll Deal: prolazi kroz Payroll flow.',
              'Stuffing — privremeno zapošljavanje, prolazi kroz Stuffing flow.',
              'Tip Deal-a se bira pri kreiranju i ne može se naknadno menjati.',
            ]
          },
          en: {
            title: 'Deal types',
            content: [
              'REG — Recruiting Deal: goes through the recruitment flow.',
              'PY — Payroll Deal: goes through the Payroll flow.',
              'Stuffing — temporary staffing, goes through the Stuffing flow.',
              'The deal type is selected at creation and cannot be changed afterwards.',
            ]
          }
        },
        {
          sr: {
            title: 'Deal stranica — pregled',
            content: [
              'Na vrhu se vide: Status, Flow Status, Legal Entity, Business Line i BD Consultant.',
              'Sekcija "Client Information" prikazuje sve kontakt podatke klijenta.',
              'Komentari su dostupni u donjem delu — broj komentara je klikljiv, otvara sve komentare.',
              'Novi komentar se dodaje direktno u polje na dnu i šalje klikom na Send.',
            ]
          },
          en: {
            title: 'Deal page — overview',
            content: [
              'At the top you can see: Status, Flow Status, Legal Entity, Business Line and BD Consultant.',
              '"Client Information" section shows all client contact details.',
              'Comments are in the bottom section — the comment count is clickable and opens all comments.',
              'Add a new comment in the input field at the bottom and send by clicking Send.',
            ]
          }
        },
        {
          sr: {
            title: 'Akcije na Deal-u (meni "Actions")',
            content: [
              'Change BD Consultant — promena odgovornog BD konsultanta (zahteva odobrenje).',
              'View History — pregled celokupne istorije izmena na deal-u.',
              'Cancel / Stop / Activate — promena statusa deal-a (vidljivo prema trenutnom statusu).',
            ]
          },
          en: {
            title: 'Deal actions ("Actions" menu)',
            content: [
              'Change BD Consultant — change the responsible BD consultant (requires approval).',
              'View History — view the complete change history of the deal.',
              'Cancel / Stop / Activate — change the deal status (visible based on current status).',
            ]
          }
        },
        {
          sr: {
            title: 'Flow — koraci i odobrenja',
            content: [
              'Svaki Deal prolazi kroz predefinisane korake zavisno od tipa (REG, PY, Stuffing ili Custom).',
              'Trenutni korak i dostupne akcije su prikazani u centralnom delu Deal stranice.',
              'Odobrenja se šalju određenim korisnicima — svako odobrenje se prati zasebno.',
              'Dokumenti se učitavaju u okviru odgovarajućeg koraka flow-a.',
            ]
          },
          en: {
            title: 'Flow — steps and approvals',
            content: [
              'Each Deal goes through predefined steps depending on its type (REG, PY, Stuffing or Custom).',
              'The current step and available actions are shown in the central part of the Deal page.',
              'Approvals are sent to specific users — each approval is tracked separately.',
              'Documents are uploaded within the appropriate flow step.',
            ]
          }
        },
        {
          sr: {
            title: 'Projects',
            content: [
              'Project je aktivan angažman vezan za Deal.',
              'Svaki Project ima datum početka i kraj — notifikacije se šalju pred istek.',
              'Moguće je dodati Annex ugovora direktno na Project-u.',
            ]
          },
          en: {
            title: 'Projects',
            content: [
              'A Project is an active engagement linked to a Deal.',
              'Each Project has a start and end date — notifications are sent before expiry.',
              'Contract annexes can be added directly on the Project.',
            ]
          }
        }
      ]
    },
    {
      id: 'recruiting',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'text-emerald-600 dark:text-emerald-400',
      open: false,
      sr: { title: 'Recruiting Orders' },
      en: { title: 'Recruiting Orders' },
      subsections: [
        {
          sr: {
            title: 'Lista Orders',
            content: [
              'Kartice na vrhu filtriraju po statusu: Total Orders, Open, In Progress, Filled.',
              'Filteri: Status, Search Client, i toggle dugme "My Assignments" (prikazuje samo Orders na kojima ste dodeljeni).',
              'U tabeli se vide: Order #, Client, Status, Creator, broj popunjenih pozicija (X/Y filled) i tip (Umbrella ili Standard).',
              'Kliknite na Order da otvorite detalje.',
            ]
          },
          en: {
            title: 'Orders list',
            content: [
              'Stat cards at the top filter by status: Total Orders, Open, In Progress, Filled.',
              'Filters: Status, Search Client, and the "My Assignments" toggle (shows only Orders assigned to you).',
              'The table shows: Order #, Client, Status, Creator, filled positions count (X/Y filled) and type (Umbrella or Standard).',
              'Click on an Order to open the details.',
            ]
          }
        },
        {
          sr: {
            title: 'Order detalji — pozicije i fakture',
            content: [
              'Na vrhu Order stranice su detalji pozicije: klijent, broj ordina, status, kreator i link ka Deal-u.',
              'Vidljive su sve fakture vezane za tu poziciju u tabeli ispod.',
              'Kolone fakture: ID (RI-XXX), tip, kandidat, iznos, valuta, datum, status (BC badge).',
            ]
          },
          en: {
            title: 'Order details — positions and invoices',
            content: [
              'At the top of the Order page are position details: client, order number, status, creator and link to the Deal.',
              'All invoices linked to that position are shown in the table below.',
              'Invoice columns: ID (RI-XXX), type, candidate, amount, currency, date, status (BC badge).',
            ]
          }
        },
        {
          sr: {
            title: 'Fakture — kreiranje i KO/KZ',
            content: [
              'Faktura se kreira u okviru Deal/REG flow-a, a ovde je prikazana kao rezultat.',
              'Klikom na "KO" (ljubičasto dugme) kreira se Credit Note za tu fakturu.',
              'Klikom na "KZ" (narandžasto dugme) kreira se Debit Note za tu fakturu.',
              'KO i KZ dugmad su vidljiva samo za originalne fakture i samo korisnicima sa odgovarajućom dozvolom.',
              'Zeleni badge "BC ✓" znači da je faktura poslata u Business Central.',
            ]
          },
          en: {
            title: 'Invoices — creating and KO/KZ',
            content: [
              'Invoices are created within the Deal/REG flow and are displayed here as a result.',
              'Click "KO" (purple button) to create a Credit Note for that invoice.',
              'Click "KZ" (orange button) to create a Debit Note for that invoice.',
              'KO and KZ buttons are visible only for original invoices and only to users with the appropriate permission.',
              'The green "BC ✓" badge means the invoice has been sent to Business Central.',
            ]
          }
        },
        {
          sr: {
            title: 'Statusi Orders',
            content: [
              'Open — pozicija otvorena, čeka se regrutacija.',
              'In Progress — regrutacija u toku.',
              'Filled — sve pozicije popunjene.',
              'Cancelled — order otkazan.',
            ]
          },
          en: {
            title: 'Order statuses',
            content: [
              'Open — position is open, awaiting recruitment.',
              'In Progress — recruitment is ongoing.',
              'Filled — all positions have been filled.',
              'Cancelled — order has been cancelled.',
            ]
          }
        }
      ]
    },
    {
      id: 'invoices',
      icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
      color: 'text-amber-600 dark:text-amber-400',
      open: false,
      sr: { title: 'Invoices' },
      en: { title: 'Invoices' },
      subsections: [
        {
          sr: {
            title: 'Recruiting Invoices tab — filteri',
            content: [
              'Search — pretraga po imenu kandidata (Enter ili klik na "Search").',
              'Legal Entity — filter po pravnom licu.',
              'Type — Placement, Admin Fee ili Cancel Fee.',
              'Status — All / Not sent to BC / Sent to BC.',
              '"Clear" se pojavljuje samo kada je aktivan neki filter.',
            ]
          },
          en: {
            title: 'Recruiting Invoices tab — filters',
            content: [
              'Search — search by candidate name (Enter or click "Search").',
              'Legal Entity — filter by legal entity.',
              'Type — Placement, Admin Fee or Cancel Fee.',
              'Status — All / Not sent to BC / Sent to BC.',
              '"Clear" appears only when a filter is active.',
            ]
          }
        },
        {
          sr: {
            title: 'Recruiting Invoices tab — tabela i akcije',
            content: [
              'Kolone: ID (RI-XXX), Order #, Position, Client, Legal Entity, Type, Fee Amount, Invoice Date, Payment Date, Created By.',
              'Credit Note je označena ljubičastim badge-om "KO", Debit Note narandžastim "KZ" pored ID-ja.',
              'Ikona oka — pregled fakture (Invoice Preview).',
              'Ikona download — export kalkulacije u Excel.',
              'Ikona olovke — izmena fakture (vidljiva samo pre slanja u BC i samo za originalne fakture).',
              'Dugme "Send to BC" šalje fakturu u Business Central — jednosmerna akcija, ne može se poništiti.',
            ]
          },
          en: {
            title: 'Recruiting Invoices tab — table and actions',
            content: [
              'Columns: ID (RI-XXX), Order #, Position, Client, Legal Entity, Type, Fee Amount, Invoice Date, Payment Date, Created By.',
              'Credit Note is marked with a purple "KO" badge, Debit Note with an orange "KZ" badge next to the ID.',
              'Eye icon — invoice preview.',
              'Download icon — export calculation to Excel.',
              'Pencil icon — edit invoice (visible only before sending to BC and only for original invoices).',
              '"Send to BC" button sends the invoice to Business Central — one-way action, cannot be undone.',
            ]
          }
        },
        {
          sr: {
            title: 'Post-BC statusi',
            content: [
              'Nakon slanja u BC, kliknite na zeleni "BC ✓" badge da postavite post-BC status.',
              'Opcije za domaće fakture (RSD): SEF, Paid, Cancelled, Void.',
              'Opcije za inostrane fakture: Delivered, Paid, Cancelled, Void.',
              'Status se može promeniti ili poništiti u svakom trenutku.',
            ]
          },
          en: {
            title: 'Post-BC statuses',
            content: [
              'After sending to BC, click the green "BC ✓" badge to set a post-BC status.',
              'Options for domestic invoices (RSD): SEF, Paid, Cancelled, Void.',
              'Options for foreign invoices: Delivered, Paid, Cancelled, Void.',
              'The status can be changed or cleared at any time.',
            ]
          }
        },
        {
          sr: {
            title: 'Credit/Debit Note na Invoices stranici',
            content: [
              'Dugmad "KO" i "KZ" su vidljiva u redu svake originalne fakture.',
              'Link ↑ vodi na izvornu fakturu (vidljiv na KO/KZ redu).',
              'Link ↓ vodi na kreiranu notu (vidljiv na originalnoj fakturi).',
              'Finansije dovršavaju notu klikom na ikonu olovke — unose Ref. Invoice No. i komentar.',
            ]
          },
          en: {
            title: 'Credit/Debit Note on Invoices page',
            content: [
              '"KO" and "KZ" buttons are visible in the row of each original invoice.',
              'Link ↑ leads to the source invoice (visible on the KO/KZ row).',
              'Link ↓ leads to the created note (visible on the original invoice).',
              'Finance completes the note by clicking the pencil icon — entering Ref. Invoice No. and a comment.',
            ]
          }
        },
        {
          sr: {
            title: 'Manual Invoices tab',
            content: [
              'Prikazuje ručne fakture u statusu Draft, Ready ili Sent.',
              'Filteri: Search (klijent, broj fakture, opis), Legal Entity, Type (Invoice / Credit Note / Debit Note), Status (Sent to BC).',
              'Akcije i Send to BC rade identično kao na Recruiting tabu.',
            ]
          },
          en: {
            title: 'Manual Invoices tab',
            content: [
              'Shows manual invoices with status Draft, Ready or Sent.',
              'Filters: Search (client, invoice number, description), Legal Entity, Type (Invoice / Credit Note / Debit Note), Status (Sent to BC).',
              'Actions and Send to BC work identically to the Recruiting tab.',
            ]
          }
        }
      ]
    },
    {
      id: 'sales-invoices',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'text-rose-600 dark:text-rose-400',
      open: false,
      sr: { title: 'Manual Invoices (stranica)' },
      en: { title: 'Manual Invoices (page)' },
      subsections: [
        {
          sr: {
            title: 'Kreiranje fakture',
            content: [
              'Kliknite "New Invoice" (gornji desni ugao) da otvorite formu za kreiranje.',
              'Obavezna polja: Legal Entity, klijent, valuta, datum fakture i bar jedna linija sa opisom i iznosom.',
              'Faktura se kreira u statusu Draft.',
            ]
          },
          en: {
            title: 'Creating an invoice',
            content: [
              'Click "New Invoice" (top right) to open the creation form.',
              'Required fields: Legal Entity, client, currency, invoice date and at least one line with a description and amount.',
              'The invoice is created with Draft status.',
            ]
          }
        },
        {
          sr: {
            title: 'Filteri i pretraga',
            content: [
              'Search — pretraga po imenu klijenta, broju fakture ili opisu.',
              'Status — All / Draft / Ready / Sent.',
              'Kliknite "Search" ili pritisnite Enter. Kliknite "Clear" da resetujete.',
            ]
          },
          en: {
            title: 'Filters and search',
            content: [
              'Search — search by client name, invoice number or description.',
              'Status — All / Draft / Ready / Sent.',
              'Click "Search" or press Enter. Click "Clear" to reset.',
            ]
          }
        },
        {
          sr: {
            title: 'Statusi i workflow',
            content: [
              'Draft — faktura u pripremi. Može se menjati i brisati.',
              'Ready — finalizovana, vidljiva na Invoices stranici za slanje u BC. Ne može se menjati.',
              'Sent — poslata u Business Central.',
              'Kliknite "Mark as Ready" da prebacite fakturu iz Draft u Ready.',
              'Kliknite "Revert to Draft" da vratite fakturu iz Ready u Draft radi izmene.',
            ]
          },
          en: {
            title: 'Statuses and workflow',
            content: [
              'Draft — invoice in preparation. Can be edited and deleted.',
              'Ready — finalized, visible on the Invoices page for sending to BC. Cannot be edited.',
              'Sent — sent to Business Central.',
              'Click "Mark as Ready" to move the invoice from Draft to Ready.',
              'Click "Revert to Draft" to move the invoice back to Draft for editing.',
            ]
          }
        },
        {
          sr: {
            title: 'Credit Note / Debit Note',
            content: [
              'Kliknite "KO" pored fakture da kreirate Credit Note, "KZ" za Debit Note.',
              'Forma za kreiranje kopira linije originalne fakture — možete ih menjati pre potvrde.',
              'Unesite datume (Issue Date, Transaction Date, Payment Due Days).',
              'Opcija "Mark as Ready" u dijalogu kreira notu odmah u Ready statusu i obaveštava finansije.',
              'Finansije završavaju obradu klikom na "Complete" — unose Ref. Invoice No. i komentar za BC.',
            ]
          },
          en: {
            title: 'Credit Note / Debit Note',
            content: [
              'Click "KO" next to an invoice to create a Credit Note, "KZ" for a Debit Note.',
              'The creation form copies the original invoice lines — you can edit them before confirming.',
              'Enter the dates (Issue Date, Transaction Date, Payment Due Days).',
              '"Mark as Ready" option in the dialog creates the note directly in Ready status and notifies finance.',
              'Finance completes processing by clicking "Complete" — entering Ref. Invoice No. and a comment for BC.',
            ]
          }
        }
      ]
    },
    {
      id: 'audit',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 17h.01',
      color: 'text-slate-600 dark:text-slate-400',
      open: false,
      sr: { title: 'Audit Log' },
      en: { title: 'Audit Log' },
      subsections: [
        {
          sr: {
            title: 'Pregled loga',
            content: [
              'Svaki zapis prikazuje: entitet, akciju (CREATE / UPDATE / DELETE), korisnika i datum.',
              'Kliknite na red da razvijete detalje — videćete koje polje je promenjeno, staru i novu vrednost.',
              'Ikona kopiranja (gornji desni ugao reda) kopira raw JSON izmene u clipboard.',
            ]
          },
          en: {
            title: 'Log overview',
            content: [
              'Each entry shows: entity, action (CREATE / UPDATE / DELETE), user and date.',
              'Click on a row to expand details — you will see which field changed, old and new value.',
              'The copy icon (top right of the row) copies the raw JSON changes to clipboard.',
            ]
          }
        },
        {
          sr: {
            title: 'Filteri',
            content: [
              'Entity — tip entiteta (Deal, Client, Invoice, User...).',
              'Action — akcija (CREATE, UPDATE, DELETE).',
              'From / To — filter po datumu, primenjuje se automatski na promenu datuma.',
              'Search — pretraga po opisu akcije.',
              'Entity ID — filter po ID-ju konkretnog zapisa (npr. svi logovi za Deal ID 42).',
            ]
          },
          en: {
            title: 'Filters',
            content: [
              'Entity — entity type (Deal, Client, Invoice, User...).',
              'Action — action (CREATE, UPDATE, DELETE).',
              'From / To — date filter, applied automatically on date change.',
              'Search — search by action description.',
              'Entity ID — filter by specific record ID (e.g. all logs for Deal ID 42).',
            ]
          }
        }
      ]
    },
    {
      id: 'utils',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      color: 'text-violet-600 dark:text-violet-400',
      open: false,
      sr: { title: 'Utils' },
      en: { title: 'Utils' },
      subsections: [
        {
          sr: {
            title: 'Salary Calculator',
            content: [
              'Dostupan klikom na "Utils" u navigacionoj traci → "Salary Calculator".',
              'Unesite iznos i izaberite tip plate: Monthly Net, Monthly Gross, Monthly Grand Gross, Annual Net, Annual Gross ili Annual Grand Gross.',
              'Rezultat prikazuje sve varijante u RSD, EUR i USD.',
              'Konverzija se vrši na osnovu trenutnog zvaničnog NBS kursa.',
            ]
          },
          en: {
            title: 'Salary Calculator',
            content: [
              'Accessible by clicking "Utils" in the navigation bar → "Salary Calculator".',
              'Enter the amount and select the salary type: Monthly Net, Monthly Gross, Monthly Grand Gross, Annual Net, Annual Gross or Annual Grand Gross.',
              'The result shows all variants in RSD, EUR and USD.',
              'Conversion is done using the current official NBS exchange rate.',
            ]
          }
        },
        {
          sr: {
            title: 'NBS Exchange Rate',
            content: [
              'Dostupan klikom na "Utils" → "NBS Exchange Rate".',
              'Prikazuje zvanični kurs Narodne banke Srbije za izabrani datum.',
              'Kurs koji se prikaže koristi se automatski u kalkulacijama naknada i faktura.',
            ]
          },
          en: {
            title: 'NBS Exchange Rate',
            content: [
              'Accessible by clicking "Utils" → "NBS Exchange Rate".',
              'Shows the official National Bank of Serbia exchange rate for the selected date.',
              'The displayed rate is automatically used in fee and invoice calculations.',
            ]
          }
        }
      ]
    },
    {
      id: 'admin',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      color: 'text-gray-600 dark:text-gray-400',
      open: false,
      sr: { title: 'Admin Panel' },
      en: { title: 'Admin Panel' },
      subsections: [
        {
          sr: {
            title: 'Users',
            content: [
              'Kreiranje, izmena i deaktivacija korisničkih naloga.',
              'Svakom korisniku se dodeljuje Permission Template ili individualne permisije.',
              'Deaktivacija onemogućava pristup bez brisanja podataka i istorije.',
            ]
          },
          en: {
            title: 'Users',
            content: [
              'Create, edit and deactivate user accounts.',
              'Each user is assigned a Permission Template or individual permissions.',
              'Deactivation blocks access without deleting data or history.',
            ]
          }
        },
        {
          sr: {
            title: 'Permission Templates',
            content: [
              'Template je skup permisija koji se može dodeliti više korisnika odjednom.',
              'Izmena Template-a automatski ažurira permisije svih korisnika koji ga koriste.',
            ]
          },
          en: {
            title: 'Permission Templates',
            content: [
              'A Template is a set of permissions that can be assigned to multiple users at once.',
              'Editing a Template automatically updates permissions for all users who use it.',
            ]
          }
        },
        {
          sr: {
            title: 'Legal Entities',
            content: [
              'Pravna lica kompanije koja se koriste pri kreiranju faktura i Deal-ova.',
              'Za svako pravno lice se definiše koji tipovi dokumenta su dozvoljeni.',
            ]
          },
          en: {
            title: 'Legal Entities',
            content: [
              'Company legal entities used when creating invoices and Deals.',
              'For each legal entity, the allowed document types are defined.',
            ]
          }
        },
        {
          sr: {
            title: 'Services & Subservices i Cost Centers',
            content: [
              'Services (VU) — business line-ovi koji se koriste pri kreiranju faktura.',
              'Cost Centers (MT) — centri troškova koji se koriste pri kreiranju Deal-ova i faktura.',
              'Oba odgovaraju dimenzijama VU i MT u Business Central-u.',
            ]
          },
          en: {
            title: 'Services & Subservices and Cost Centers',
            content: [
              'Services (VU) — business lines used when creating invoices.',
              'Cost Centers (MT) — cost centers used when creating Deals and invoices.',
              'Both correspond to the VU and MT dimensions in Business Central.',
            ]
          }
        },
        {
          sr: {
            title: 'Approvals i Documents',
            content: [
              'Approval Template definiše ko i kojim redosledom odobrava određeni tip entiteta.',
              'Documents — konfiguracija tipova dokumenata koji se koriste u flow-ovima.',
            ]
          },
          en: {
            title: 'Approvals and Documents',
            content: [
              'Approval Template defines who approves what entity type and in which order.',
              'Documents — configuration of document types used in flows.',
            ]
          }
        },
        {
          sr: {
            title: 'BC Environments',
            content: [
              'Konfiguracija Business Central integracije: Tenant ID, Client ID, Secret, Environment Name, Company ID.',
              'Samo jedan Environment može biti aktivan u isto vreme (zelena ivica = aktivan).',
              'Kliknite "Activate" da postavite Environment kao aktivan.',
              'Promena aktivnog Environment-a odmah utiče na sve naredne BC transakcije.',
            ]
          },
          en: {
            title: 'BC Environments',
            content: [
              'Business Central integration config: Tenant ID, Client ID, Secret, Environment Name, Company ID.',
              'Only one Environment can be active at a time (green border = active).',
              'Click "Activate" to set an Environment as active.',
              'Changing the active Environment immediately affects all subsequent BC transactions.',
            ]
          }
        },
        {
          sr: {
            title: 'Settings i Flows',
            content: [
              'Settings — key-value podešavanja sistema (npr. početni broj sekvence faktura). Izmene se primenjuju odmah.',
              'Flows — kreiranje i izmena custom flow-ova. Svaki korak ima naziv, dostupne akcije i uslove prelaza.',
            ]
          },
          en: {
            title: 'Settings and Flows',
            content: [
              'Settings — key-value system configuration (e.g. invoice sequence starting number). Changes apply immediately.',
              'Flows — create and edit custom flows. Each step has a name, available actions and transition conditions.',
            ]
          }
        }
      ]
    },
    {
      id: 'profile',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      color: 'text-indigo-600 dark:text-indigo-400',
      open: false,
      sr: { title: 'Profil i podešavanja' },
      en: { title: 'Profile and settings' },
      subsections: [
        {
          sr: {
            title: 'Profile i Change Password',
            content: [
              'Kliknite na vaše ime u gornjem desnom uglu da otvorite meni.',
              '"Profile" otvara vašu profilnu stranu — možete promeniti profilnu sliku.',
              '"Change Password" — unesite trenutnu lozinku i novu (minimum 8 karaktera).',
              '"Log Out" odjavljuje vas iz aplikacije.',
            ]
          },
          en: {
            title: 'Profile and Change Password',
            content: [
              'Click on your name in the top right corner to open the menu.',
              '"Profile" opens your profile page — you can change your profile picture.',
              '"Change Password" — enter your current password and new one (minimum 8 characters).',
              '"Log Out" signs you out of the application.',
            ]
          }
        },
        {
          sr: {
            title: 'Dark mode i notifikacije',
            content: [
              'Ikona sunca/meseca u navigacionoj traci prebacuje između Light i Dark moda. Podešavanje se čuva lokalno.',
              'Zvonce prikazuje broj nepročitanih notifikacija (crveni badge).',
              'Klik na zvonce otvara panel — svaka notifikacija je klikljiva i vodi na odgovarajući entitet.',
              'Notifikacije stižu za: odobrenja koja čekaju vas, promene statusa i blizak istek Project-a.',
            ]
          },
          en: {
            title: 'Dark mode and notifications',
            content: [
              'The sun/moon icon in the navigation bar switches between Light and Dark mode. The setting is saved locally.',
              'The bell shows the number of unread notifications (red badge).',
              'Click the bell to open the panel — each notification is clickable and leads to the relevant entity.',
              'Notifications arrive for: approvals awaiting your action, status changes and upcoming Project expiry.',
            ]
          }
        }
      ]
    }
  ];

  get t() {
    return {
      title: this.lang === 'sr' ? 'Uputstvo za korišćenje' : 'User Guide',
      subtitle: this.lang === 'sr' ? 'Pregled funkcionalnosti OneSpot aplikacije' : 'Overview of OneSpot application features',
      expandAll: this.lang === 'sr' ? 'Razvij sve' : 'Expand all',
      collapseAll: this.lang === 'sr' ? 'Skupi sve' : 'Collapse all',
      footer: this.lang === 'sr' ? 'Za tehničku podršku obratite se administratoru sistema.' : 'For technical support, contact the system administrator.',
    };
  }

  toggle(section: HelpSection) {
    section.open = !section.open;
  }

  expandAll() {
    this.sections.forEach(s => s.open = true);
  }

  collapseAll() {
    this.sections.forEach(s => s.open = false);
  }
}
