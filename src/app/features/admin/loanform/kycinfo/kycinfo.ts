import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Uploadbtn, UploadConfig, UploadResult } from '../../../systemdesign/uploadbtn/uploadbtn';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { Datepicker } from '../../../systemdesign/datepicker/datepicker';
import { Datepickernew } from '../../../systemdesign/datepickernew/datepickernew';
import { Checkbox } from '../../../systemdesign/checkbox/checkbox';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { Uploadkyc } from "../../customer/uploadkyc/uploadkyc";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-kycinfo',
  imports: [CommonModule, Uploadbtn, Inputfield, Datepickernew, Checkbox, ReactiveFormsModule, Buttons],
  standalone: true,
  templateUrl: './kycinfo.html',
  styleUrl: './kycinfo.scss'
})
export class Kycinfo {
  kycdetailsID: any;
  openIndex: number[] = [0];
  accordions = [
    { title: 'Identity & Residency ', alwaysOpen: true },
    { title: 'Permanent Address ', alwaysOpen: false },
    { title: 'Current Address ', alwaysOpen: false },
  ];
  kycdocumentsForm!: FormGroup

  ispassport: boolean = false;
  uploadedFiles: Record<string, File | null> = {};
  files: any = {};

  basicConfig: UploadConfig = {
    accept: '.svg, .png, .jpg, .jpeg, .pdf',
    maxSize: 10,
    helperText: 'JPG, JPEG, PDF, PNG,SVG (max. 10 MB)'
  };


  isPermanentMailingChecked = false;
  isCurrentMailingChecked = false;

  aadhaarFrontUrl: string = '';
  aadhaarFrontFileName: string = '';

  aadhaarBackUrl: string = '';
  aadhaarBackFileName: string = '';

  panUrl: string = '';
  panFileName: string = '';

  passportUrl: string = '';
  passportFileName: string = '';

  otherDocumentUrl: string = '';
  otherDocumentFileName: string = '';
  applicantId: any;
  applicationId: any;
  kycId: any;

  passportmissing: boolean = false;
  isPassportNumberMissing: boolean = false;
  passportNumberSavedOnServer = false;
  nextClicked:boolean= false;
  passportuploadfailure: boolean = false;
  selectedPassportFile: File | null = null;
  passportPreviewUrl = '';

  isSummaryLoading = false;
  summaryLoaded = false;
  aadhaarFrontDisplayName: string = '';
  aadhaarBackDisplayName: string = '';
  panDisplayName: string = '';
  passportDisplayName: string = '';
  otherDocumentDisplayName: string = '';
  isFromSummary = false;
passportnumber: any;

  constructor(private fb: FormBuilder, public stepperService: Loanstepperservice, private cd: ChangeDetectorRef, private loanformservice: Loanformservice, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.stepperService.rebuildSteps();

    let Allids = this.stepperService.getLoanId();

    this.applicantId = Allids[0];
    this.applicationId = Allids[1];
    // this.custName = Allids[2];
    // this.custARN = Allids[3];

    let ids = this.stepperService.getLoanId();
    this.kycdetailsID = ids[1] ?? this.applicationId;


    this.kycdocumentsForm = this.fb.group({


      adhaarnumber: ['', Validators.required],
      adhaarfront: ['', Validators.required],
      adhaarback: ['', Validators.required],
      pannumber: ['', Validators.required,],
      panimg: ['', Validators.required],
      passportnumber: ['', Validators.required,],
      dob: ['', Validators.required,],

      peraddressline1: ['', Validators.required],
      peraddressline2: ['', Validators.required],
      peraddressline3: ['', Validators.required],
      percountry: ['', Validators.required],
      perstate: ['', Validators.required,],
      percity: ['', Validators.required,],
      perpincode: ['', Validators.required,],
      isperMailingAddress: [false, Validators.required],

      sameAsPermanent: ['', Validators.required],
      curraddressline1: ['', Validators.required],
      curraddressline2: ['', Validators.required],
      curraddressline3: ['', Validators.required],
      currcountry: ['', Validators.required],
      currstate: ['', Validators.required,],
      currcity: ['', Validators.required,],
      currpincode: ['', Validators.required,],
      iscurrMailingAddress: [false, Validators.required],


    });

  this.kycdocumentsForm.get('passportnumber')?.valueChanges.subscribe(value => {
  this.isPassportNumberMissing = !String(value || '').trim();
});

    this.getKycData(this.kycdetailsID);
    this.kycdocumentsForm.get('isperMailingAddress')
      ?.valueChanges.subscribe(val => {
        if (val) {
          this.kycdocumentsForm.get('iscurrMailingAddress')
            ?.setValue(false, { emitEvent: false });
        }
      });

    this.kycdocumentsForm.get('iscurrMailingAddress')
      ?.valueChanges.subscribe(val => {
        if (val) {
          this.kycdocumentsForm.get('isperMailingAddress')
            ?.setValue(false, { emitEvent: false });
        }
      });

  }

  toggle(index: number) {
    if (this.openIndex.includes(index)) {
      this.openIndex = this.openIndex.filter(i => i !== index);
    } else {
      this.openIndex.push(index);
    }
    this.cd.detectChanges();
  }

  submit() {

  }

  viewImage(url: string): void {
    window.open(url, '_blank');
  }

  downloadImage(url: string, filename: string): void {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {

        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.click();

        window.URL.revokeObjectURL(blobUrl);

      });

  }

  getKycId(event: any) {
    console.log(event);

  }

  setSameAddress(value: boolean) {
    this.kycdocumentsForm.get('sameAsPermanent')?.setValue(value);

    if (value) {
      this.copyPermanentToCurrent();
    }
  }
  copyPermanentToCurrent() {
    this.kycdocumentsForm.patchValue({
      curraddressline1: this.kycdocumentsForm.get('peraddressline1')?.value,
      curraddressline2: this.kycdocumentsForm.get('peraddressline2')?.value,
      curraddressline3: this.kycdocumentsForm.get('peraddressline3')?.value,
      currcountry: this.kycdocumentsForm.get('percountry')?.value,
      currstate: this.kycdocumentsForm.get('perstate')?.value,
      currcity: this.kycdocumentsForm.get('percity')?.value,
      currpincode: this.kycdocumentsForm.get('perpincode')?.value,
    });
  }

  back() {
    this.stepperService.previous();
  }
  next() {
    this.nextClicked =true
    
    const passportNumberControl = this.kycdocumentsForm.get('passportnumber');

    const passportNumber = String(passportNumberControl?.value || '' ).trim();
  const hasPassportNumber = !!passportNumber;

  const hasPassportDocument =!!this.selectedPassportFile || !!this.passportUrl;

  // Validate both fields before returning.
  this.isPassportNumberMissing = !hasPassportNumber;
  this.passportmissing = !hasPassportDocument;

     if (!hasPassportNumber) {
    passportNumberControl?.markAsTouched();
    passportNumberControl?.setErrors({
      ...(passportNumberControl.errors || {}),
      required: true
    });
  }

  
    // Show both error messages together.
  if (!hasPassportNumber || !hasPassportDocument) {
    this.cd.detectChanges();
    return;
  }

  this.isPassportNumberMissing = false;
  this.passportmissing = false;
  this.passportuploadfailure = false;
    this.passportmissing = false;

   const needsFileUpload   = !!this.selectedPassportFile;
  const needsNumberUpdate = !this.passportNumberSavedOnServer;
  // Nothing to save — proceed directly.
  if (!needsFileUpload && !needsNumberUpdate) {
    this.stepperService.markStepCompleted('kycinfo');
    this.stepperService.next();
    return;
  }
  // Both file and number need saving — upload file first, then number.
  if (needsFileUpload && needsNumberUpdate) {
    this.updatepassportno();
    return;
  }
  // Only a new file was selected.
  if (needsFileUpload) {
    this.updatepassport();
    return;
  }
  // Only the number needs saving (doc already on server).
  this.updatepassportno();

  }

updatepassport(){
const fd = new FormData();

    // text fields
    fd.append('docType', 'PASSPORT');
    fd.append('file', this.selectedPassportFile as File);

    this.loanformservice.uploadpassport(fd, this.kycId).subscribe({
      next: (data) => {
        console.log(data);
        this.stepperService.markStepCompleted('kycinfo');
        this.stepperService.next();
      },
      error: (error) => {
        console.log(error);
        this.passportuploadfailure = true
      }
    });
}
//update passport number
updatepassportno(){
  const passportNo = String(
    this.kycdocumentsForm.get('passportnumber')?.value || ''
  ).trim();

  const object={
      "kycId": this.kycId,
  "passportNo": passportNo,
  "isSubmit": true

  }
     this.loanformservice.updatepassportNumber(object).subscribe({
      next: (data) => {
        console.log(data);
         this.passportNumberSavedOnServer = true;
        this.stepperService.markStepCompleted('kycinfo');
        this.stepperService.next();
      },
      error: (error) => {
        console.log(error);
        this.passportuploadfailure = true
      }
    });
}
 

  onFileChange(result: UploadResult, key: string) {
    if (!result.file) {
      this.passportmissing = false;
      return;
    }

    this.selectedPassportFile = result.file;
    if (this.selectedPassportFile) {
      this.passportmissing = false;
    }

    this.passportFileName = result.file.name;
    this.passportDisplayName = this.getFileName(result.file.name, 30);

    if (this.passportPreviewUrl) {
      URL.revokeObjectURL(this.passportPreviewUrl);
    }

    this.passportPreviewUrl =
      URL.createObjectURL(result.file);

    this.passportmissing = false;
    this.passportuploadfailure = false;
    this.cd.detectChanges();
  }
  getFileName(filename: any, maxLength: number = 22): string {
    const fileName = filename || '';
    if (fileName.length <= maxLength) {
      return fileName;
    }
    return `${fileName.substring(0, maxLength)}...`;
  }
  getKycData(id: any) {
    this.isSummaryLoading = true;
    this.summaryLoaded = false;

    this.loanformservice.getKycDetails(id).subscribe({
      next: (res) => {
        try {
          let formdata = res.data;
          this.kycId = res.data.kycId;
          const documents = formdata.documents;

          const aadhaarFront = documents.find((d: { docType: string; }) => d.docType === 'AADHAAR_FRONT');
          const aadhaarBack = documents.find((d: { docType: string; }) => d.docType === 'AADHAAR_BACK');
          const panDoc = documents.find((d: { docType: string; }) => d.docType === 'PAN');
          const passportDoc = documents.find((d: { docType: string; }) => d.docType === 'PASSPORT');
          const otherDoc = documents.find((d: { docType: string; }) => d.docType === 'UTILITY_BILL');

          const passportNumber = String(
          formdata.passportNumber ??
          formdata.passportNo ??
          ''
        ).trim();

         this.isPassportNumberMissing = passportNumber.length === 0;
         this.passportNumberSavedOnServer = passportNumber.length > 0; 
          this.aadhaarFrontUrl = aadhaarFront?.url || '';
          this.aadhaarFrontFileName = aadhaarFront?.fileName || '';
          this.aadhaarFrontDisplayName =
            this.getFileName(this.aadhaarFrontFileName, 21);
          this.aadhaarBackUrl = aadhaarBack?.url || '';
          this.aadhaarBackFileName = aadhaarBack?.fileName || '';
          this.aadhaarBackDisplayName =
            this.getFileName(this.aadhaarBackFileName, 21);
          this.panUrl = panDoc?.url || '';
          this.panFileName = panDoc?.fileName || '';
          this.panDisplayName =
            this.getFileName(this.panFileName, 30);

          this.passportUrl = passportDoc?.url || '';
          this.passportFileName = passportDoc?.fileName || '';
          this.passportDisplayName =
            this.getFileName(this.passportFileName, 30);
          this.ispassport = !!passportDoc;
          if (this.passportUrl !== '' && this.passportUrl !== null) {
            this.passportmissing = false;
          }

          this.otherDocumentUrl = otherDoc?.url || '';
          this.otherDocumentFileName = otherDoc?.fileName || '';
          this.otherDocumentDisplayName =
            this.getFileName(this.otherDocumentFileName, 30);
         
          this.kycdocumentsForm.patchValue({
            adhaarnumber: formdata.aadhaarNumber,
            adhaarfront: aadhaarFront?.fileName,
            adhaarback: aadhaarBack?.fileName,
            pannumber: formdata.panNumber,
            panimg: panDoc?.fileName,
            passportnumber: formdata.passportNumber,
            dob: formdata.dateOfBirth,

            sameAsPermanent: formdata.sameAsPermanent,
            peraddressline1: formdata.permanentAddress.addressLine,
            peraddressline2: formdata.permanentAddress.addressLine1,
            peraddressline3: formdata.permanentAddress.addressLine2,
            percountry: formdata.permanentAddress.country,
            perstate: formdata.permanentAddress.state,
            percity: formdata.permanentAddress.city,
            perpincode: formdata.permanentAddress.zipCode,
            isperMailingAddress: formdata.permanentAddress.isMailingAddress == 0 ? false : true,

            curraddressline1: formdata.otherAddress == null ? formdata.currentAddress.addressLine : formdata.otherAddress.addressLine,
            curraddressline2: formdata.otherAddress == null ? formdata.currentAddress.addressLine1 : formdata.otherAddress.addressLine1,
            curraddressline3: formdata.otherAddress == null ? formdata.currentAddress.addressLine2 : formdata.otherAddress.addressLine2,
            currcountry: formdata.otherAddress == null ? formdata.currentAddress.country : formdata.otherAddress.country,
            currstate: formdata.otherAddress == null ? formdata.currentAddress.state : formdata.otherAddress.state,
            currcity: formdata.otherAddress == null ? formdata.currentAddress.city : formdata.otherAddress.city,
            currpincode: formdata.otherAddress == null ? formdata.currentAddress.zipCode : formdata.otherAddress.zipCode,
            iscurrMailingAddress: formdata.sameAsPermanent == 0 ? true : false,
          });
          this.kycdocumentsForm.disable({ emitEvent: false });



          if (!String(passportNumber).trim()) {
            this.kycdocumentsForm
              .get('passportnumber')
              ?.enable({ emitEvent: false });
          }

          console.log(this.kycdocumentsForm.get('dob')?.disabled);
          this.stepperService.setStepData('kycinfo', formdata);
          this.summaryLoaded = true;
        } catch (error) {
          console.error('KYC data binding error:', error);
          this.summaryLoaded = false;
        } finally {
          this.isSummaryLoading = false;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        this.summaryLoaded = false;
        this.isSummaryLoading = false;
        this.cd.detectChanges();
        console.error("error msg", err);
      }

    });
  }

}
