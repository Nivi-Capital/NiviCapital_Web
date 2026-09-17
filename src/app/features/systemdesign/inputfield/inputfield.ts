import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Buttons } from "../buttons/buttons";

@Component({
  selector: 'app-inputfield',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inputfield.html',
  styleUrls: ['./inputfield.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Inputfield),
      multi: true
    }
  ]
})
export class Inputfield implements ControlValueAccessor {
  // Text inputs
  @Input() label: string = '';
  @Input() helpTextValue: string = '';

  // Visibility toggles
  @Input() showLabel: boolean = true;
  @Input() showHelpText: boolean = true;

  //  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() helpText: string = '';
  @Input() type: 'text'  | 'password' | 'email' | 'search' | 'tel' | 'flag' | 'number' | 'parsefloat' = 'text';
  @Input() state: 'default' | 'error' | 'success' = 'default';
  @Input() showSearch: boolean = false;
  @Input() showInfo: boolean = false;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Input() required: boolean = false;
  // NEW inputs add customer 
  @Input() maxlength!: number;
  @Input() uppercase: boolean = false;

  @Input() showaustralianflagPrefix: boolean = false;  //flag

  @Input() showPhonePrefix: boolean = false;  //flag
  @Input() showPhonePrefixnumber: boolean = false;  //+91
  @Input() rightButtonText: string = '';  //sendotp btn
  @Input() rightButtonDisabled: boolean = false;
  @Input() readonly: boolean = false;

  @Input() suffix: string = '';
  
@Input() min?: number;
@Input() max?: number;
@Input() step?: number;
@Input() decimalPlaces?: number; 


private _valueslot: any = '';

@Input()
set valueslot(val: any) {
  this._valueslot = val ?? '';
  this.value = this._valueslot;
}

// NEW output
  @Output() rightButtonClick = new EventEmitter<void>();



  value: string = '';
  passwordVisible: boolean = false;
  currentType: string = '';

  private onChange: (value: string) => void = () => { };
  private onTouched: () => void = () => { };
@Input() autocomplete: string = 'off';
  ngOnInit() {
    // Initialize currentType based on the type input
    this.currentType = this.type;
  }

  get showPasswordToggle(): boolean {
    return this.type === 'password';
  }

get valueslot(): any {
  return this._valueslot;
}

  get showStateIcon(): boolean {
    return (this.state === 'error' || this.state === 'success') && !this.showPasswordToggle;
  }

  togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
    // Toggle between 'password' and 'text'
    this.currentType = this.passwordVisible ? 'text' : 'password';
    console.log('Password toggled:', this.currentType, 'Visible:', this.passwordVisible);
  }

  onInputChange(value: string): void {
 if (this.type !== 'password') {
    value = value.replace(/[<>]/g, '');

    if (this.uppercase) {
      value = value.toUpperCase();
    }
  }
    

  if (this.type === 'number' && value !== '') {
    let num = Number(value);

    if (isNaN(num)) return;

    if (this.decimalPlaces !== undefined) {
      const regex = new RegExp(
        `^\\d+(\\.\\d{0,${this.decimalPlaces}})?$`
      );
      if (!regex.test(value)) return;
    }

    if (this.min !== undefined && num < this.min) return;
    if (this.max !== undefined && num > this.max) return;
  }


    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }


  onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onRightButtonClick(): void {
    if (!this.rightButtonDisabled) {
      this.rightButtonClick.emit();
    }
  }

}
