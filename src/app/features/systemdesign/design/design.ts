import { Component, Input } from '@angular/core';
import { Buttons } from '../buttons/buttons'
import { CommonModule } from '@angular/common';
import { Charts } from '../charts/charts';
import { Checkbox } from '../checkbox/checkbox';
import { Dropdown, DropdownOption } from '../dropdown/dropdown';
import { Inputfield } from '../inputfield/inputfield';
import { Radiobuttons } from '../radiobuttons/radiobuttons';
import { Uploadbtn, UploadConfig, UploadResult } from '../uploadbtn/uploadbtn';
import { Areacharts, AreaDataset } from '../areacharts/areacharts';
import { Barcharts } from '../barcharts/barcharts'
import { ActivatedRoute } from '@angular/router';
import { Datepicker } from "../datepicker/datepicker";
import { FormsModule } from '@angular/forms';
import { Datepickernew } from '../datepickernew/datepickernew';



@Component({
  selector: 'app-design',
  standalone: true,
  imports: [CommonModule, Buttons, Checkbox, Charts, Dropdown, Inputfield, Radiobuttons, Uploadbtn, Areacharts, Barcharts, Datepicker,FormsModule,Datepickernew],
  templateUrl: './design.html',
  styleUrls: ['./design.scss']
})
export class Design {
activeSection: string = 'buttons';
myDate: Date | null = null;

 constructor(private route: ActivatedRoute) {
  this.route.data.subscribe(data => {
    this.activeSection = data['section'] || 'buttons';
  });
}


  

//-------------------------checkbox---------------------------------
  isChecked: boolean = false;
  isCheckedDefault = false;
  isCheckedChecked = true;

  onCheckboxChange(value: boolean, label: string) {
    console.log(label, value);
    // Update local state if you want two-way binding
    if (label === 'Default') this.isCheckedDefault = value;
    if (label === 'Checked') this.isCheckedChecked = value;
  }


  checkselectedOption = 'option2';

  
//-------------------------bar charts---------------------------------
@Input() datasets: any;
   // Define data in the component class for cleaner templates
  monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  barDatasets = [
    { values: [78, 60, 118, 50, 78, 42], color: '#EF4444' },
    { values: [48, 80, 75, 40, 35, 100], color: '#1E40AF' }
  ];

  weekLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  
  areaDatasets = [
    {
      data: [60, 40, 50, 70, 75, 85, 80, 85, 70, 90],
      fillColor: 'rgba(96, 165, 250, 0.4)',
      strokeColor: '#3B82F6'
    },
    {
      data: [20, 40, 65, 70, 60, 45, 60, 65, 75, 100],
      fillColor: 'rgba(248, 113, 113, 0.4)',
      strokeColor: '#EF4444'
    }
  ];
//================================charts===============================================

  // Chart 1 Data
  chartData1 = [
    { label: 'Legend', value: 30, color: '#3B82F6' },
    { label: 'Legend', value: 25, color: '#10B981' },
    { label: 'Legend', value: 20, color: '#EF4444' },
    { label: 'Legend', value: 15, color: '#F59E0B' },
    { label: 'Legend', value: 10, color: '#EC4899' }
  ];

  // Chart 2 Data
  chartData2 = [
    { label: 'Legend', value: 35, color: '#3B82F6' },
    { label: 'Legend', value: 25, color: '#F59E0B' },
    { label: 'Legend', value: 20, color: '#EF4444' },
    { label: 'Legend', value: 12, color: '#EC4899' },
    { label: 'Legend', value: 8, color: '#6366F1' }
  ];

  // Chart 3 Data
  chartData3 = [
    { label: 'Legend', value: 40, color: '#3B82F6' },
    { label: 'Legend', value: 30, color: '#10B981' },
    { label: 'Legend', value: 20, color: '#EF4444' },
    { label: 'Legend', value: 10, color: '#EC4899' }
  ];

  // Chart 4 Data
  chartData4 = [
    { label: 'Legend', value: 28, color: '#EF4444' },
    { label: 'Legend', value: 26, color: '#EC4899' },
    { label: 'Legend', value: 22, color: '#F59E0B' },
    { label: 'Legend', value: 24, color: '#6366F1' }
  ];


  /// area and line charts

  // Chart 1: Weekly Disbursement (Area Chart with Fill)
  weekLabelsarea = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  
  areaDatasetsarea: AreaDataset[] = [
    {
      data: [65, 45, 35, 75, 25, 90, 75, 65, 55, 100],
      fillColor: '#e8b4b8',
      strokeColor: '#d63447',
    },
    {
      data: [20, 40, 30, 40, 90, 70, 80, 70, 60, 50],
      fillColor: '#b8d4e8',
      strokeColor: '#4a90d9',
    }
  ];

  // Chart 2: Simple Line Chart (No Fill)
  lineLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  
  lineDatasets: AreaDataset[] = [
    {
      data: [20, 35, 38, 42, 48, 52, 55, 60, 63, 65],
      fillColor: 'transparent',
      strokeColor: '#4a90d9',
      label: 'Series 1'
    },
    {
      data: [15, 28, 32, 35, 40, 42, 45, 48, 50, 52],
      fillColor: 'transparent',
      strokeColor: '#d63447',
      label: 'Series 2'
    }
  ];

  // Chart 3: Overlay/Wave Chart (Multiple Curves)
  overlayLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  
  overlayDatasets: AreaDataset[] = [
    {
      data: [30, 25, 35, 28, 32, 26, 30, 25, 28, 50],
      fillColor: 'transparent',
      strokeColor: '#d63447',
      label: 'Wave 1'
    },
    {
      data: [20, 35, 28, 38, 30, 35, 28, 32, 25, 45],
      fillColor: 'transparent',
      strokeColor: '#4a90d9',
      label: 'Wave 2'
    }
  ];

  //---------------------------dropdown-------------------------------

    @Input() avatarUrl='https://i.pravatar.cc/40?img=12';
  @Input() hasAvatar = false;
  
  selectedOption: string = '';
  myOptions: DropdownOption[] = [
    { label: 'Download in .PDF', value: 'pdf', icon: '/assets/images/icons/note.svg' },
    { label: 'Download in .Excel', value: 'excel', icon: '/assets/images/icons/note.svg' },
    { label: 'Download in .JSON', value: 'json', icon: '/assets/images/icons/note.svg' },
    { label: 'Others', value: 'others', icon: '/assets/images/icons/note.svg' }
  ];


  selectedOption2: string = '';
  myOptions2: DropdownOption[] = [
    { label: 'Loan', value: 'pdf', icon: '/assets/images/icons/note.svg' },
    { label: 'Forex', value: 'excel', icon: '/assets/images/icons/note.svg' },
    { label: 'Insurance', value: 'json', icon: '/assets/images/icons/note.svg' },
    { label: 'Others', value: 'others', icon: '/assets/images/icons/note.svg' }
  ];

  selectedOption3: string = '';
  largeOptions: DropdownOption[] = Array.from({ length: 50 }).map((_, i) => ({
    label: `Option ${i + 1}`,
    value: `option_${i + 1}`
  }));

  selectedOption4: string = '';
  largeOptionsdata: DropdownOption[] = Array.from({ length: 50 }).map((_, i) => ({
    label: `Option ${i + 1}`,
    value: `option_${i + 1}`
  }));


  onSelectionChange(value: any) {
    console.log('Selected:1', value);
  }

  onSelectionChange2(value: any) {
    console.log('Selected:2', value);
  }
  onSelectionChange3(value: any) {
    console.log('Selected:3', value);
  }
  onSelectionChange4(value: any) {
    console.log('Selected:4', value);
  }

  //-------------------radiobuttons-------------------------------------------------

  isChecked_rb: boolean = false;
  isCheckedDefault_rb = false;
  isCheckedChecked_rb = true;

  checkselectedOption_rb = 'option2';

  //--------------------------upload buttons--------------------------------------------


basicConfig: UploadConfig = {
    maxSize: 10,
    label: 'Upload File',
    accept: '.svg, .png, .jpg, .jpeg, .pdf',
    helperText: 'JPG, JPEG, PDF, PNG, SVG (max. 10 MB)'
  };

  customConfig: UploadConfig = {
    label: 'School Logo',
    accept: '.svg, .png, .jpg, .jpeg, .pdf',
    maxSize: 10,
    helperText: 'JPG, JPEG, PDF, PNG,  SVG (max. 10 MB)'
  };

  pdfConfig: UploadConfig = {
    accept: '.pdf',
    maxSize: 20,
    label: 'Upload Document',
    helperText: 'PDF (max. 20 MB)'
  };

  // Example: Pre-existing file
  existingFile: File | null = null;
  existingPreview: string = 'https://example.com/school-logo.png';

  // File storage
  uploadedFiles: { [key: string]: UploadResult } = {};

  onFileChange(result: UploadResult, uploadId: string) {
    if (result.error) {
      console.error(`Upload ${uploadId} error:`, result.error);
    } else if (result.file) {
      console.log(`Upload ${uploadId} success:`, result.file.name);
      this.uploadedFiles[uploadId] = result;
      
      // this.uploadService.uploadFile(result.file).subscribe(...);
    }
  }

  onFileRemove(uploadId: string) {
    console.log(`File removed from ${uploadId}`);
    delete this.uploadedFiles[uploadId];
  }

}
