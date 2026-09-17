import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Checkbox } from '../checkbox/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Loanstepperservice } from '../../../core/service/loanstepperservice';
import { Main } from '../../../core/service/main';


export interface TableColumn {
  key: string;
  label: string;
  class?: string;
  clickable?: boolean;
  transform?: (row: any) => string;
  classFn?: (row: any) => string;
  onClick?: (row: any) => void;
}



@Component({
  selector: 'app-tables',
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatTableModule, MatPaginatorModule, Checkbox],
  standalone: true,
  templateUrl: './tables.html',
  styleUrl: './tables.scss'
})
export class Tables implements OnChanges {

  //  @Input() apiUrl!: string;               
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() pageSize: number = 6;

  @Input() isLoading = false;
  @Input() hidepagination = false;

  @Output() rowClick = new EventEmitter<any>();

  dataSource = new MatTableDataSource<any>();
  totalRows = 0;
  displayedColumnKeys: string[] = [];

  currentPage = 1;
  totalPagesArray: (number | string)[] = [];
  pagedData: any[] = [];

  selection: any[] = [];

  @Output() selectionChange = new EventEmitter<any[]>();
  @Input() totalPages: number = 1;
  @Output() pageChange = new EventEmitter<number>();
  @Input() disableEditFn?: (row: any) => boolean;





  STAGE_ROUTE_MAP: Record<string, string> = {
    LOAN_INFO: 'loaninfo',


    GENERAL_INFO: 'genralinfo',

    ESTIMATED_EXPENSE: 'expense',
    SAVE_EXPENSE: 'expense',

    PERSONAL_INFO: 'additionalinfo',

    FETCH_KYC: 'kycinfo',
    SAVE_KYC: 'kycinfo',
    SAVE_LAST_QUALIFICATION: 'educationDetails',
    EDUCATIONAL_DETAILS: 'educationDetails',
    INCOME: 'incomeinfo',

    SAVE_ASSETS: 'assetsinfo',

    SAVE_LIABILITIES: 'liabilitiesinfo',

    SAVE_MONTHLY_EXPENSES: 'monthlyexpinfo',

    SAVE_REFERENCES: 'referenceinfo',

    COAPPLICANT: 'co-applicantdetails',

    SUMMARY: 'summaryinfo'
  };
  constructor(private http: HttpClient, private router: Router, private stepperservice: Loanstepperservice,private main:Main) { }

  ngOnInit() {
    this.displayedColumnKeys = ['select', ...this.columns.map(c => c.key), 'actions'];
    if (this.data && this.data.length > 0) {
      this.updatePagedData();
    }
  }

  //*********************** pagination ***************************** 
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      // this.currentPage = 1;
      if (this.data && this.data.length > 0) {
        this.updatePagination();
        this.updatePagedData();
      } else {
        this.pagedData = [];
        this.totalPagesArray = [];
      }
    }
  }


  get totalPagesCount() {
    return this.totalPages;
  }

  updatePagination() {
    const totalPages = this.totalPages;

    const total = totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {

      pages.push(1);
      pages.push(2);


      if (current > 4) pages.push('...');
      const start = Math.max(3, current - 1);
      const end = Math.min(total - 2, current + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (current < total - 3) pages.push('...');

      if (!pages.includes(total)) pages.push(total);
    }

    this.totalPagesArray = pages;
    this.updatePagedData();
  }

  updatePagedData() {

    this.pagedData = this.data;

  }

  onPageChange(page: any) {

    if (page === '...') return;
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page as number;
    this.pageChange.emit(this.currentPage);

  }

  onCellClick(col: TableColumn, row: any) {
    if (col.clickable && col.onClick) col.onClick(row);
    this.rowClick.emit(row);
  }
  // **************** checkbox  ****************************

  toggleRow(row: any) {
    const exists = this.selection.includes(row);
    if (exists) {
      this.selection = this.selection.filter(r => r !== row);
    } else {
      this.selection.push(row);
    }
    this.selectionChange.emit(this.selection);
  }

  toggleAllRows(checked: boolean) {
    if (checked) {
      this.selection = [...this.pagedData];
    } else {
      this.selection = [];
    }
    this.selectionChange.emit(this.selection);
  }

  isAllSelected(): boolean {
    return this.selection.length === this.pagedData.length && this.selection.length > 0;
  }

  isSomeSelected(): boolean {
    return this.selection.length > 0 && !this.isAllSelected();
  }

  //--------------status (pending/completed)---------------------------

  getStatusClass(status: string) {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'verified':
        return { text: 'Completed', class: 'status-completed' };
      case 'pending':
        return { text: 'Pending', class: 'Pending' };
      case 'active':
        return { text: 'Active', class: 'activebtn' };

      case 'document issue':
        return { text: 'Document Issue', class: 'Document-Issue' };
      default:
        return { text: '-', class: '' };
    }
  }

  isEditDisabled(row: any): boolean {
    return this.disableEditFn ? this.disableEditFn(row) : false;
  }

  getRouteFromStage(stage: string | null | undefined): string {
    if (!stage) {
      return 'loaninfo';
    }

    return this.STAGE_ROUTE_MAP[stage] || 'loaninfo';
  }
  onEdit(row: any) {
    console.log("Edit", row);
    this.main.setState({
      phone: row.mobile,
      userId: row.userId,
      currentStep: 0,
       custId: row.custId,
       fname: row.firstName,
            lname: row.lastName
    });

    if (row.custId == "-" || row.custId == null) {
      this.router.navigate(
        ['/admin/customer/addcustomer'],
        {
          queryParams: {
            step: 0,
            edit: true,
            // phone: row.mobile,
            // id: row.userId


          }
        }
      );
    }
    else if (row.kycStatus == "PENDING") {
      this.router.navigate(
        ['/admin/customer/addcustomer'],
        {
          queryParams: {
            step: 2,
            edit: true,
            // custId: row.custId,
            // fname: row.firstName,
            // lname: row.lastName
          }
        }
      );
    }

    if (row.applicationStatus === 'DRAFT' || row.loanStatus === 'In Progress') {
      const targetRoute = this.stepperservice.getRouteFromStage(row.nextStage || row.currentApplicationStatus);


      const editContext = {
        edit: true,
        applicantId: row.applicantId,
        applicationId: row.applicationId,
        custId: row.custId,
        custName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
        custARN: row.arn,
        currentApplicationStatus: row.currentApplicationStatus,
        nextStage: row.nextStage
      };

      sessionStorage.setItem('loanContextData', JSON.stringify(editContext));

      this.router.navigate(['/loanform', targetRoute]);

      return;


    }
    else {

    }

  }

  onDelete(row: any) {
    console.log("Delete", row);

  }



}
