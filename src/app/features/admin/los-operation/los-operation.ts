import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { Main } from '../../../core/service/main';
import { Dropdown, DropdownOption } from '../../systemdesign/dropdown/dropdown';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Buttons } from '../../systemdesign/buttons/buttons';
import { Checkbox } from '../../systemdesign/checkbox/checkbox';
import { Inputfield } from '../../systemdesign/inputfield/inputfield';
import { TableColumn, Tables } from '../../systemdesign/tables/tables';
import { takeUntil } from 'rxjs';
import { TableData } from '../../../core/service/table-data';
import { Addcustomerservice } from '../../../core/service/addcustomerservice';

const SEARCH_FIELDS = ['firstName', 'lastName', 'mobile', 'email', 'loantype', 'disbursedAmount', 'outstandingBalance', 'loanStatus'];

interface TransformedUserData {
  // id: string;
  custId: string;
  ncId: string
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  status: string;
  kycStatus: string;
  createdAt: number[];
  userId: string;

  loanType?: string,
  disbursedAmount?: string,
  outstandingBalance?: string,
  loanStatus?: string,
  applicationId?: string,
  arn?: string,
  applicationStatus?: string,
  currentApplicationStatus?: string,
  nextStage?: string,
  applicantId?: string
}
@Component({
  selector: 'app-los-operation',
  imports: [CommonModule, FormsModule, MatTableModule, MatCheckboxModule, MatTabsModule, MatPaginatorModule,
    MatSortModule, MatIconModule, RouterModule, HttpClientModule, Inputfield, Dropdown, Buttons, Tables],
  templateUrl: './los-operation.html',
  styleUrl: './los-operation.scss'
})
export class LosOperation {

  columns = [



    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'email', label: 'Email ID' },
    { key: 'loantype', label: 'Loan Type' },
    { key: 'disbursedAmount', label: 'Disbursed Amount' },
    { key: 'outstandingBalance', label: 'Outstanding Balance' },
    {
      key: 'loanStatus',
      label: 'Loan Status',
      class: 'status',
      classFn: (row: any) => this.getStatusClass(row.loanStatus).class,
      transform: (row: any) => this.getStatusClass(row.loanStatus).text
    },



  ];

  pageSize = 6;
  currentPage = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  totalPagesArray: (number | string)[] = [];
  fullData: any[] = [];
  fullData1: any[] = [];

  AlluserData: any[] = [];
  AlluserData1: any[] = [];


  allLosData: any;
  destroy$ = new EventEmitter<void>();
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  tableData: any[] = [];
  allApplicants: any[] = [];
  selecteduser: any;

  filteredData: any[] = [];

  searchText: string = "";

  selectedOption1: string = '';
  selectedOption2: string = '';
  selectedOption3: string = '';

  AllTypes: string = 'All';

  occupation: string = 'Current Occupation';
  Kycstatus: DropdownOption[] = [
    { label: 'All', value: 'All' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Document Issue', value: 'Document Issue' }
  ];

  kycCompleted: number | null = null;


  cards = Array(4)
  nodata: boolean = false;
  isLoading: boolean = false;
  hidepagination: boolean = false;

    searchcharlimit: boolean = false;
   errormsg:string = '';

  constructor(public http: HttpClient, public router: Router, private service: Main, private cdr: ChangeDetectorRef, private tableDataService: TableData, private addcustomerservice: Addcustomerservice) { }
  // 
  ngOnInit(): void {
    this.loadallusers();
    this.updateVisiblePages();

  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    setTimeout(() => {
      this.updateVisiblePages();
    }, 100);
  }

  private hasData(data: any): boolean {
    return this.tableDataService.hasData(data);
  }



  //-----------get table data from api----------------------------

  private loadallusers(): void {
    const page = this.currentPage - 1;
    this.service.getAllLoanUsers(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let resdate = response.data.content;
          this.totalItems = response.data.totalElements;
          this.totalPages = response.data.totalPages;
          this.AlluserData = resdate;
          this.fullData = this.tableDataService.transformUserData(resdate);
          this.filteredData = this.fullData;

          this.kycCompleted = this.tableDataService.calculateKycMetrics(resdate, this.totalItems);
          this.dataSource.sort = this.sort;
          this.updatePagedData();

          this.tableData = this.fullData; // Initialize tableData for filters
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching users:', error);
        }
      });
  }

  allLoandata(): void {
    // this.hidepagination = false;

    this.service.AllLoan_Users()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {

          let resdate = response.data.content;
          this.AlluserData1 = resdate;
          this.fullData1 = this.tableDataService.transformUserData(resdate);

        },
        error: (error) => {
          console.error('Error fetching users:', error);
        }
      });
  }

  getStatusClass(status: string) {
    return this.tableDataService.getStatus_Class(status);
  }

  formatDateOnly(dateArr: number[] | null | undefined): string {
    return this.tableDataService.formatDateOnly(dateArr);
  }

  //pagination
  updatePagedData(): void {

    this.dataSource.data = this.filteredData;
  }

  onPageChange(page: any): void {
    if (page === '...') return;
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page as number;
    this.loadallusers()
  }
  updateVisiblePages(): void {
    const total = this.totalPages;
    this.totalPagesArray = this.tableDataService.getVisiblePages(this.currentPage, total);
  }

  getkyc(id: any) {
    this.service.selectedUserId = id;
    this.service.getKycDetails(id).subscribe({
      next: (response) => {
        this.router.navigate(['/admin/losdetails']);
      },
      error: (error) => {
        console.error('Error fetching kyc details:', error);
      }
    });

    this.selecteduser = this.allApplicants.find(
      item => item.userId === this.service.selectedUserId
    );
    if (this.selecteduser) {
      this.service.docofselectedUser = this.selecteduser;
      localStorage.setItem('los--selecteduserDetails', JSON.stringify(this.selecteduser));
    }
  }

  //dropdown filter
  getkycstatuslos(value: string) {
    const filterValue = value.toLowerCase();

    const statusMap: any = {
      "completed": "verified",
      "pending": "pending",
      "document issue": "document issue"
    };

    const apiStatus = statusMap[filterValue];


    if (value === "All") {
      this.filteredData = this.tableData;
    } else if (value === "Completed") {

      this.filteredData = this.tableData.filter(
        item => item.status.toLowerCase() === apiStatus
      );
    }
    else if (value === "Pending") {

      let pendingdata = this.tableData.filter(
        item => item.status.toLowerCase() === apiStatus
      );

      this.filteredData = pendingdata;
    }
    else if (value === "Document Issue") {

      this.filteredData = this.tableData.filter(
        item => item.status.toLowerCase() === apiStatus
      );
    } else {
      this.filteredData = this.tableData;
    }
    this.cdr.detectChanges(); // Trigger change detection for filter
  }

  //search from table
  onSearchChange(value: string): void {
    this.searchText = value.toLowerCase();
    var type;

    if (this.searchText.length === 0) {
      this.nodata = false;
      this.hidepagination = false;
      this.currentPage = 1;
      this.filteredData = [];
      this.loadallusers();      // reload paginated list
       this.searchcharlimit = false;
        this.errormsg ='';
      this.cdr.detectChanges();
      return;
    }


    if (this.searchText.includes('@')) {
      type = 'EMAIL'

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(this.searchText)) {
        return; // stop if invalid email
      }

    } else if (this.searchText.startsWith('nc')) {
      type = 'NCID'
    }
    else if (this.searchText.startsWith('cust')) {
      type = 'CUST_ID'
    }
    else if (/^\d+$/.test(this.searchText)) {
      type = 'MOBILE'
      const mobile = this.searchText.trim();
      const mobileRegex = /^[0-9]{10}$/;

      if (!mobileRegex.test(mobile)) {
        return;
      }

    } else {
      type = "NAME"
    }

    let input = {
      identifier: this.searchText,
      type: type,
      isSearch: true,
      "applicantType": "PRIMARY", //// PRIMARY / CO_APPLICANT
      "coApplicantIndex": 0,

    }
    this.addcustomerservice.customersearch(input).subscribe({
      next: (res) => {
        console.log(res);
         let respdata = res?.data 
        this.filteredData = respdata.map(
                (item: any): TransformedUserData => ({
          custId: item.custId ?? '-',
          ncId: item.ncId ?? '-',
          firstName: item.firstName ?? '-',
          lastName: item.lastName ?? '-',
          mobile: item.mobile ?? '-',
          email: item.email ?? '-',
          status: item.status ?? '-',
          kycStatus: item.kycStatus ?? '-',
          createdAt: item.custId ?? '-',
          userId: item.userInitiateId ?? '-'
       
})
    );

  this.searchcharlimit = false;
        this.errormsg ='';


        this.nodata = false;
        this.hidepagination = true;   // hide pagination in search
        this.cdr.detectChanges();


        console.log('Search API Result displayed in table:', this.filteredData);

      },
      error: (err) => {
        console.error("error msg", err);
         this.searchcharlimit = true;
        this.errormsg = err?.error?.message ?? 'An error occurred while searching.';
        this.cdr.detectChanges();
      }
    })


  }


  onSearchChange1(value: string) {
    this.searchText = value.toLowerCase();
    if (!this.searchText) {
      this.currentPage = 1;
      this.loadallusers();
      return;
    }


    if (!this.fullData1 || this.fullData1.length === 0) {
      this.allLoandata();
    }


    this.filteredData = this.tableDataService.filterBySearch(
      this.fullData1,
      value, SEARCH_FIELDS
    );

    this.totalItems = this.filteredData.length;
    this.currentPage = 1;
    this.updateVisiblePages();
    this.updatePagedData();
  }

  //redirection to loan details page
  getloandetails(id: string): void {
    this.service.selectedUserId = id;
    this.service.getLosDetails(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('getLosDetails:', response);
          this.allLosData = response.applications;
          this.service.set_los_Data(this.allLosData);
          this.router.navigate(['/admin/losdetails']);
        },
        error: (error) => {
          console.error('Error fetching KYC details:', error);
        }
      });

    this.selecteduser = this.allApplicants.find(
      item => item.userId === this.service.selectedUserId
    );
    if (this.selecteduser) {
      this.service.docofselectedUser = this.selecteduser;
      localStorage.setItem('selecteduserDetails', JSON.stringify(this.selecteduser));
    }
  }

  getkyc_type(value: any): void {
    // Implement type filtering logic
    const statusMap: { [key: string]: string } = {
      'completed': 'approved',
      'pending': 'pending',
      'document issue': 'document issue'
    };

    this.filteredData = this.tableDataService.filterByStatus(this.fullData, value, statusMap);
    this.totalItems = this.filteredData.length;
    this.currentPage = 1;
    this.updateVisiblePages();
    this.updatePagedData();

  }

  applyLoan() {
    this.router.navigate(['/admin/losoperation/newloan']);
  }

  //disable edit btn from row
  disableEditCondition = (row: any) => {
    //  console.log("edit-----",row)
    return false;


  };
}
