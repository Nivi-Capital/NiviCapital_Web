import { Component, EventEmitter, Input, OnInit, Output, forwardRef } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MY_DATE_FORMATS } from '../../../shared/config/date-format';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, FormsModule, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import moment from 'moment';

@Component({
  selector: 'app-datepickernew',
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, MatMomentDateModule, FormsModule],
  standalone: true,
  templateUrl: './datepickernew.html',
  styleUrl: './datepickernew.scss',
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Datepickernew),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => Datepickernew),
      multi: true
    }
  ]
})
export class Datepickernew implements OnInit, ControlValueAccessor, Validator {

 validatorChange = () => {};

registerOnValidatorChange(fn: () => void): void {
  this.validatorChange = fn;
}
  selectedDate: Date | null = null;
  @Input() label: string = '';
  @Input() disabled: boolean = false;

  @Input() required: boolean = false;

  @Input() disablePastDates: boolean = false;
  @Input() disablefutureDates: boolean = false;
  @Input() disableMinYears: boolean = false;
  @Input() minDate: Date | null = null;
  @Input() minyear: number = 1960;

  @Input() maxDate: Date | null = null;
  rawDateValue: string = '';

  
  @Output() dateChanged = new EventEmitter<any>();

  @Input() allowPastYears: number | null = null;

  onChange = (_: any) => { };
  onTouched = () => { };


  ngOnInit() {

    const minYearDate = new Date(this.minyear, 0, 1); // 01-01-1960
    // minYearDate.setHours(0, 0, 0, 0);


    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // yesterday.setHours(23, 59, 59, 999);


    if (this.disablePastDates) {
       if (this.allowPastYears) {
      const minAllowedDate = new Date();
      minAllowedDate.setFullYear(
        minAllowedDate.getFullYear() - this.allowPastYears
      );
      minAllowedDate.setHours(0, 0, 0, 0);

      this.minDate =
        minAllowedDate > minYearDate
          ? minAllowedDate
          : minYearDate;

    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      this.minDate = today > minYearDate ? today : minYearDate;
    } 
  }
    if (this.disablefutureDates) {
      this.maxDate = yesterday;
    } 
    if(this.disableMinYears){
      this.minDate = minYearDate;
    }


  }


writeValue(value: any): void {
  this.selectedDate = value;

  if (value) {
    this.rawDateValue = moment(value).format('DD/MM/YYYY');
  } else {
    this.rawDateValue = '';
  }

  setTimeout(() => {
    this.validatorChange();
  });
}
writeValue2(value: any): void {
  this.selectedDate = value;

  this.rawDateValue =
    value && moment(value).isValid()
      ? moment(value).format('DD/MM/YYYY')
      : '';
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


  allowOnlyDate(event: KeyboardEvent): void {
  const navigationKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End'
  ];

  if (
    navigationKeys.includes(event.key) ||
    event.ctrlKey ||
    event.metaKey
  ) {
    return;
  }

  if (!/[0-9/]/.test(event.key)) {
    event.preventDefault();
  }
}
 validate(control: AbstractControl): ValidationErrors | null {
  const value = this.rawDateValue;

  if (this.required && (!value || value.trim() === '')) {
    return { required: true };
  }

  if (!value) return null;

  const validFormat = moment(value, 'DD/MM/YYYY', true).isValid();

  if (!validFormat) {
    return { invalidDate: true };
  }

  const enteredDate = moment(value, 'DD/MM/YYYY', true).toDate();
  enteredDate.setHours(0, 0, 0, 0);

  if (this.minDate) {
    const min = new Date(this.minDate);
    min.setHours(0, 0, 0, 0);

    if (enteredDate < min) {
      return { invalidDate: true };
    }
  }

  if (this.maxDate) {
    const max = new Date(this.maxDate);
    max.setHours(0, 0, 0, 0);

    if (enteredDate > max) {
      return { invalidDate: true };
    }
  }

  return null;
}
onManualInput1(event: any) {
  
  
const input = event.target as HTMLInputElement;
let value = input.value;  

const isDelete =
  event.inputType === 'deleteContentBackward' ||
  event.inputType === 'deleteContentForward';


  // // allow only numbers and slash
  // value = value.replace(/[^0-9/]/g, '');

  // // max DD/MM/YYYY length
  // if (value.length > 10) {
  //   value = value.substring(0, 10);
  // }
  
  // Remove everything except digits

  if (!isDelete) {
    value = value.replace(/\D/g, '').substring(0, 9);

    // Add slashes automatically
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }

    if (value.length > 5) {
      value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }


    event.target.value = value;
    this.rawDateValue = value;

    if (!value) {
      this.selectedDate = null;
      this.onChange(null);
      this.validatorChange();
      return;
    }

    const parsed = moment(value, 'DD/MM/YYYY', true);

    if (parsed.isValid()) {
      const date = parsed.toDate();

      this.selectedDate = date;

      // ✅ this is important
      // sends typed date to parent ngModel
      this.onChange(date);
    } else {
      this.selectedDate = null;
      this.onChange(null);
    }

    this.onTouched();
    this.validatorChange();
  }
}

onManualInput(event: Event): void {
  const inputEvent = event as InputEvent;
  const input = inputEvent.target as HTMLInputElement;

  const isDeleting =
    inputEvent.inputType === 'deleteContentBackward' ||
    inputEvent.inputType === 'deleteContentForward' ||
    inputEvent.inputType === 'deleteByCut';

  let value = input.value;

  if (!isDeleting) {
    const cursorPosition =
      input.selectionStart ?? value.length;

    const digitsBeforeCursor = value
      .substring(0, cursorPosition)
      .replace(/\D/g, '')
      .length;

    const digits = value
      .replace(/\D/g, '')
      .substring(0, 8);

    value = digits;

    if (digits.length > 4) {
      value =
        digits.substring(0, 2) +
        '/' +
        digits.substring(2, 4) +
        '/' +
        digits.substring(4);
    } else if (digits.length > 2) {
      value =
        digits.substring(0, 2) +
        '/' +
        digits.substring(2);
    }

    input.value = value;

    let newCursorPosition = digitsBeforeCursor;

    if (digitsBeforeCursor > 2) {
      newCursorPosition++;
    }

    if (digitsBeforeCursor > 4) {
      newCursorPosition++;
    }

    setTimeout(() => {
      input.setSelectionRange(
        newCursorPosition,
        newCursorPosition
      );
    });
  }

  this.rawDateValue = input.value;

  // Completely empty input
  if (!this.rawDateValue) {
    this.selectedDate = null;
    this.onChange(null);
    this.dateChanged.emit(null);
    this.onTouched();
    this.validatorChange();
    return;
  }

  // Incomplete date: keep exactly what the user typed.
  if (this.rawDateValue.length !== 10) {
    this.onTouched();
    this.validatorChange();
    return;
  }

  const parsedDate = moment(
    this.rawDateValue,
    'DD/MM/YYYY',
    true
  );

  // Keep invalid text visible for correction.
  if (!parsedDate.isValid()) {
    this.onTouched();
    this.validatorChange();
    return;
  }

  if (parsedDate.isValid()) {
  const date = parsedDate.toDate();
  date.setHours(0, 0, 0, 0);

  this.selectedDate = date;

  this.onChange(date);
  this.dateChanged.emit(date);

  this.onTouched();
  this.validatorChange();
}

  const date = parsedDate.toDate();
  date.setHours(0, 0, 0, 0);

  this.selectedDate = date;

  // Update parent only for a complete valid date.
  this.onChange(date);
  this.dateChanged.emit(date);
  this.onTouched();
  this.validatorChange();
}

onDateChange(value: Date | null): void {
  if (!value || !moment(value).isValid()) {
    this.selectedDate = null;
    this.rawDateValue = '';

    this.onChange(null);
    this.dateChanged.emit(null);
    this.onTouched();
    this.validatorChange();
    return;
  }

  const date = moment(value).toDate();
  date.setHours(0, 0, 0, 0);

  this.selectedDate = date;
  this.rawDateValue =
    moment(date).format('DD/MM/YYYY');

  this.onChange(date);
  this.dateChanged.emit(date);
  this.onTouched();
  this.validatorChange();
}

onDateChange2(val: any) {
  this.selectedDate = val;

  if (val) {
    this.rawDateValue = moment(val).format('DD/MM/YYYY');
    this.onChange(val);
  } else {
    this.onChange(null);
  }

  this.onTouched();
  this.validatorChange();
}
  onPickerOpen() {
    setTimeout(() => {
      const overlay = document.querySelector('.cdk-overlay-pane .mat-datepicker-content');
      if (overlay && this.selectedDate) {
        const formatted = new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          month: 'short',
          day: '2-digit'
        }).format(this.selectedDate);

        overlay.setAttribute('data-selected', formatted);
      }
    });
  }

  onValueChange(value: any) {
    this.rawDateValue = value;
    this.dateChanged.emit(value); // send changed value to parent
  }

}


