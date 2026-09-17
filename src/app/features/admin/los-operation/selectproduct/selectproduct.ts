import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Dropdown, DropdownOption } from '../../../systemdesign/dropdown/dropdown';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { FormsModule } from '@angular/forms';
import { Checkbox } from "../../../systemdesign/checkbox/checkbox";
import { Radiobuttons } from '../../../systemdesign/radiobuttons/radiobuttons';
import { ActivatedRoute, Router } from '@angular/router';
import { Successbox } from '../../customer/successbox/successbox';
import { Addcustomerservice } from '../../../../core/service/addcustomerservice';
import { LocationStrategy } from '@angular/common';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Main } from '../../../../core/service/main';

@Component({
  selector: 'app-selectproduct',
  imports: [CommonModule, Dropdown, Buttons, FormsModule, Radiobuttons, Successbox],
  standalone: true,
  templateUrl: './selectproduct.html',
  styleUrl: './selectproduct.scss'
})
export class Selectproduct implements OnInit {
  //dropdown--------------------
  @Input() avatarUrl = '';
  @Input() hasAvatar = false;

  product: string = 'Select Product';
  selectedproduct: string = '';
  product_: string = '';
  selectProduct: DropdownOption[] = [
    //SG  8085
    // { label: 'Loan', value: '289AD3A7489A47A6B2C6642E922DFE78', icon: '' },
    //RP
    { label: 'Loan', value: '4B8B6F9FD511555BE0635A01A8C03D66', icon: '' },

  ];


  loantype: string = 'Select Loan Type';
  selectedloantype: string = '';
  loantype_: string = '';
  seleactloantype: DropdownOption[] = [
    { label: 'New Loan', value: 'NEW_LOAN', icon: '', disabled: false },
    { label: 'Balance Transfer', value: 'BALANCE_TRANSFER', icon: '', disabled: true },
  ]

  selectedsegment: string = '';
  segment: string = 'Select Segment';
  segment_: string = '';
  selectSegment: DropdownOption[] = [
    { label: 'Retail', value: 'RETAIL', icon: '', disabled: false },
    { label: 'Corporate', value: 'CORPORATE', icon: '', disabled: true },
    { label: 'MSME', value: 'MSME', icon: '', disabled: true },
  ];

  seleactedcategory: string = '';
  catagory: string = 'Select Category';
  catagory_: string = '';
  seleactCategory: DropdownOption[] = [
    { label: 'Education Loan', value: 'EDUCATION', icon: '' },
  ]
  formData: any = {};
  custId: string = '';
  custName: string = '';
  //checkbox-------------------
  isChecked_rb: boolean = false;
  SecurityTypechecked: string = '';

  //successbox-------------------

  arnid: string = '';
  applicantId: string = '';
  applicationId: string = '';
  issuccess: boolean = false;


  constructor(private router: Router,private main: Main, private apiService: Addcustomerservice, private route: ActivatedRoute,private stepperService: Loanstepperservice, private cd: ChangeDetectorRef, private locationStrategy: LocationStrategy) { }
  ngOnInit(): void {

    const flowState = this.main.getState();
    if (!flowState) {

      return;
    }
       this.custId = flowState.custId ?? '';
        this.custName = flowState.fname +''+flowState.lname;
          localStorage.setItem('custId', this.custId)
     
    
    // this.route.queryParams.subscribe(params => {
    //   if (params['custId']) {
    //     this.custId = params['custId'];
    //     this.custName = params['custName'];
    //     localStorage.setItem('custId', this.custId)
    //   }
    // });
  }

  onSelectionChange(selectedkey: string, value: any) {
    this.formData[selectedkey] = value;
    console.log('Changed:', selectedkey, value);
  }

  onCheckboxChange(value: boolean, label: string) {
    console.log(label, value);
  }
  ontypechecked(value: string) {
    this.SecurityTypechecked = value;
    console.log('Security Typechecked:', this.SecurityTypechecked);
  }
  goToloandashboard() {
    this.router.navigate(['admin/losoperation']);

  }

  tosuccess() {
    // console.log(this.formData,);

    let input = {
      "productId": this.formData.product,
      "module": "LOS",
      "segment": this.formData.segment,
      "catagory": this.formData.catagory,
      "loanType": this.formData.loantype,
      "isSecured": this.SecurityTypechecked == 'Secured' ? true : false,
      "selectedCifId": this.custId,
      "source": "WEB"
    }
    this.apiService.selectproduct(input).subscribe({
      next: (res) => {
        console.log(res);

        this.arnid = res?.data?.arn ?? '';
        this.applicationId = res?.data?.applicationId ?? '';
        this.applicantId = res?.data?.applicantId ?? '';
        // this.issuccess = true;
        this.handleSuccessAction('letsstart')
        this.cd.detectChanges();
      },
      error: (err) => {
        this.issuccess = false;
        console.error(err);
      }
    });




  }

  handleSuccessAction(action: string) {
    if (action === 'letsstart') {

      
 const payload = {
      applicantId: this.applicantId,
      applicationId: this.applicationId,
      custName: this.custName,
      custARN: this.arnid
    };

    sessionStorage.setItem('loanContextData', JSON.stringify(payload));


      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/loanform/loaninfo'],
         
        )
      );
       


      const finalUrl = this.locationStrategy.prepareExternalUrl(url);

      window.open(window.location.origin + finalUrl, '_blank');
    }
  }
}

