import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, input, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
import { Msgboxservice } from '../../../core/service/msgboxservice';
import { Router } from '@angular/router';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type UploadState = 'idle' | 'focus' | 'uploading' | 'success' | 'error' | 'disabled';

export interface UploadConfig {
  accept?: string;
  maxSize?: number; // in MB
  minSize?: number; // in KB
  label?: string;
  helperText?: string;
}

export interface UploadResult {
  file: File | null;
  preview?: string;
  error?: string;
}

@Component({
  selector: 'app-uploadbtn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './uploadbtn.html',
  styleUrl: './uploadbtn.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Uploadbtn),
      multi: true
    }
  ]
})
export class Uploadbtn implements OnInit, ControlValueAccessor, OnChanges {
  @Input() config: UploadConfig = {
    accept: '.svg, .png, .jpg, .jpeg, .pdf',
    maxSize: 10,
    helperText: 'JPG, JPEG, PDF, PNG, SVG(max. 10 MB)'
  };

  @Input() disabled: boolean = false;
  @Input() value: File | null = null;
  @Input() previewUrl: string = '';
  @Input() label: string = '';
  @Input() required: boolean = false;

  @Output() fileChange = new EventEmitter<UploadResult>();
  @Output() fileRemove = new EventEmitter<void>();
  @Input() fileuploadresponse: any;



  @Input() uploadViaApi: boolean = false;
  @Output() uploadStarted = new EventEmitter<UploadResult>();

  @Output() uploadingChange = new EventEmitter<boolean>();

  state: UploadState = 'idle';
  progress: number = 0;
  fileName: string = '';
  errorMessage: string = '';
  preview: string = '';
  private fileInput: HTMLInputElement | null = null;

  showHelperMessage = true;
  private helperTimer?: number;


  constructor(private router: Router, private msgBox: Msgboxservice) { }

  ngOnInit() {
    if (this.disabled) {
      this.state = 'disabled';
    }
    if (this.value) {
      this.fileName = this.value.name;
      this.state = 'success';
    }
    if (this.previewUrl) {
      this.preview = this.previewUrl;
      this.state = 'success';
    }
  }


    
ngOnChanges() {
  if (this.disabled) {
    this.state = 'disabled';
  } else if (this.state === 'disabled') {
    this.state = 'idle';
  }


  }
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processFile(file);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.state = 'idle';

    if (this.disabled) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled && this.state !== 'success') {
      this.state = 'focus';
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.state === 'focus') {
      this.state = 'idle';
    }
  }

  processFile(file: File) {
    // Validate file type
    const validTypes = this.config.accept?.split(',').map(t => t.trim()) || [];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = validTypes.some(type =>
      type === fileExt || type === file.type
    );

    if (!isValidType) {
      this.setError(`Invalid file format. Only ${this.config.accept} are accepted.`);
      return;
    }

    // Validate file size
    if (this.config.maxSize) {
      const maxSizeBytes = (this.config.maxSize || 10) * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        this.setError(`File size exceeds ${this.config.maxSize} MB`);
        return;
      }
    }

    if (this.config.minSize) {
      const minSizeBytes = this.config.minSize * 1024;

      if (file.size < minSizeBytes) {
        this.setError(`File size must be at least ${this.config.minSize} KB`);
        return;
      }
    }

    this.fileName = file.name;
    this.uploadFile(file);
  }

  uploadFile(file: File) {
    this.state = 'uploading';
    this.progress = 0;
    this.errorMessage = '';
this.uploadingChange.emit(true);
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.preview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }

    if (this.uploadViaApi) {
      this.uploadStarted.emit({
        file: file,
        preview: this.preview
      });

      this.state = 'uploading';
      this.progress = 0;

      const interval = setInterval(() => {
        this.progress += 10;
        if (this.progress >= 100) {
          clearInterval(interval);
          // console.log("Received in upload btn:", this.fileuploadresponse);

          if (this.fileuploadresponse?.status === 'success') {
            this.state = 'success';
            this.showHelperMessage = true;
           this.hideHelperMessageAfterDelay();
          } else {
            this.state = 'error';
            this.showHelperMessage = true;
          //  this.hideHelperMessageAfterDelay();
          }

         this.uploadingChange.emit(false);
        }

      }, 200);



    } else {
      const interval = setInterval(() => {
        this.progress += 10;
        if (this.progress >= 100) {
          clearInterval(interval);
          this.state = 'success';
          this.showHelperMessage = true;
          this.uploadingChange.emit(false);
          this.fileChange.emit({
            file: file,
            preview: this.preview
          });
          
          this.hideHelperMessageAfterDelay();
        }

      }, 200);
    }

  }

  checkresponse(data: any) {
    console.log("checkresponse", data)

  }
  setError(message: string) {
    this.state = 'error';
    this.errorMessage = message;
    this.showHelperMessage = true;
    this.uploadingChange.emit(false);
    this.fileChange.emit({
      file: null,
      error: message
    });
  
    // this.hideHelperMessageAfterDelay();
  }

  public setSuccess(file: File) {
    this.state = 'success';
    this.fileName = file.name;
    this.showHelperMessage = true;
    this.fileChange.emit({
      file: file,
      preview: this.preview
    });
    this.uploadingChange.emit(false);
    this.hideHelperMessageAfterDelay();
  }

  public setErrorFromApi(message: string) {
    this.state = 'error';
    this.errorMessage = message || 'Upload failed. Please try again.';
    this.showHelperMessage = true;
    this.fileChange.emit({
      file: null,
      error: this.errorMessage
    });
    // this.hideHelperMessageAfterDelay();
     this.uploadingChange.emit(false);
  }
  removeFile() {
    this.msgBox.open({
      title: 'Are you sure want to Remove',
      message: ``,
      showCancel: true, okText:'Yes',
      onOk: () => {
        this.state = 'idle';
        this.fileName = '';
        this.preview = '';
        this.progress = 0;
        this.errorMessage = '';
this.uploadingChange.emit(false);
        if (this.fileInput) {
          this.fileInput.value = '';
        }

        this.showHelperMessage = true;
        this.fileRemove.emit();
        this.fileChange.emit({ file: null });

      }
    });

  }

  triggerFileInput() {
    if (!this.disabled && this.state !== 'success') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = this.config.accept || '';
      input.onchange = (e) => this.onFileSelect(e);
      input.click();
      this.fileInput = input;
    }
  }

  getStateClass(): string {
    return `upload-${this.state}`;
  }



  private hideHelperMessageAfterDelay(delay = 5000) {
    if (this.helperTimer) {
      clearTimeout(this.helperTimer);
    }

    this.helperTimer = window.setTimeout(() => {
      this.showHelperMessage = false;
    }, delay);
  }




  onChange = (value: any) => { };
  onTouched = () => { };

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  fileSelected(event: any) {
    const file = event.target.files[0];
    this.value = file;
    this.onChange(file);
    this.onTouched();
  }
}
