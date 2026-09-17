import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Dropdown, DropdownOption } from "../../../systemdesign/dropdown/dropdown";
import { CommonModule } from '@angular/common';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { Main } from '../../../../core/service/main';
import { FormsModule } from '@angular/forms';
import { Tables } from "../../../systemdesign/tables/tables";
import { Buttons } from "../../../systemdesign/buttons/buttons";
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Addcustomerservice } from '../../../../core/service/addcustomerservice';
import { TableData } from '../../../../core/service/table-data';
import { MatTableDataSource } from '@angular/material/table';


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
  // createdAt: number[];
  // Id: string;
}

@Component({
  selector: 'app-newloan',
  standalone: true,
  imports: [CommonModule, Dropdown, Inputfield, FormsModule, Tables, Buttons],
  templateUrl: './newloan.html',
  styleUrl: './newloan.scss'
})
export class Newloan implements OnInit {
  @Input() avatarUrl = '';
  @Input() hasAvatar = false;
  selectedOption: string = '';
  searchOptions: DropdownOption[] = [
    { label: 'Mobile Number', value: 'Mobile', icon: '' },
    { label: 'NCID', value: 'NCID', icon: '' },
    { label: 'CUSTID', value: 'CUSTID', icon: '' },
    { label: 'PAN Number', value: 'PAN', icon: '' },
    { label: 'Aadhaar Number', value: 'Aadhaar', icon: '' },
    { label: 'Email', value: 'Email', icon: '' },
    { label: 'Passport', value: 'Passport', icon: '' },
  ];

  searchby: string = 'Select by';
  searchedvalue: any;


  columns = [
    {
      key: 'custId',
      label: 'CUSTID',
      class: 'cifstyle',
      clickable: true,
    },
    { key: 'ncId', label: 'NCID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      class: 'status',
      // classFn: (row: any) => this.getStatusClass(row.status).class,
      // transform: (row: any) => this.getStatusClass(row.status).text
    },

    {
      key: 'kycStatus',
      label: 'KYC Status',
      class: 'status',
      // classFn: (row: any) => this.getStatusClass(row.kycStatus).class,
      // transform: (row: any) => this.getStatusClass(row.kycStatus).text
    },
    // { key: 'registrationDate', label: 'Registration Date' },

  ];

  selectedRows: any[] = [];
  filteredData: TransformedUserData[] = [];
  dataSource = new MatTableDataSource<any>([]);

  isdata: boolean = false;
  private mobileSubject = new Subject<string>();

  constructor(public service: Main, private router: Router, private apiService: Addcustomerservice, private cd: ChangeDetectorRef) { }
  ngOnInit(): void {
    this.mobileSubject
      .pipe(
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (value.length === 10) {
          this.searchMobile(value);
        }
      });
  }

  onMobileInput(event: any) {
    const value = event.target.value;
    this.mobileSubject.next(value);
  }

  searchMobile(mobile: string) {
    let input = {
      identifier: mobile,
      type: "MOBILE",
        "applicantType": "PRIMARY", //// PRIMARY / CO_APPLICANT
      "coApplicantIndex": 0,

    }

    this.apiService.customersearch(input).subscribe(res => {
       let respdata= res.data[0];
      if (res.message.includes('Existing customer found')) {


        this.isdata = true;
        this.cd.detectChanges();

        let fullData: TransformedUserData[] = [{
          custId: respdata.custId ?? "-",
          firstName: respdata.firstName ?? "-",
          lastName: respdata.lastName ?? "-",
          mobile: respdata.mobile ?? "-",
          email: respdata.email ?? '-',
          kycStatus: respdata.kycStatus ?? "-",
          status: respdata.status ?? "-",
          ncId: respdata.ncId ?? "-",
        }]
        // this.filteredData = [fullData];
        this.filteredData = [...fullData];
        console.log('search mobile Result:', fullData);
      } else {
        this.isdata = false;
      }
    });
  }



  onchecboxChange(rows: any[]) {
    this.selectedRows = rows;
    console.log('Received in Parent:', rows);
  }
  onSelectionChange(value: any) {
    console.log('Selected:1', value);
  }

  onValueChange(value: string) {
    console.log('Selected:2', value);
  }

  toProductscreen() {
     this.service.setState({
      phone: this.selectedRows[0].mobile ?? '',
      userId: this.selectedRows[0].userId ?? '',
      currentStep: 0,
       custId: this.selectedRows[0].custId,
       fname: this.selectedRows[0].firstName,
            lname: this.selectedRows[0].lastName
    });

    this.router.navigate(["/admin/losoperation/selectproduct"],
      {
        queryParams: {
          // custId: this.selectedRows[0].custId,
          // custName: this.selectedRows[0].firstName + " "+this.selectedRows[0].lastName

        }
      }
    );
  }


}
