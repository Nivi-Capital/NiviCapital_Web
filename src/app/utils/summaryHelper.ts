import { COMMON_EDUCATION_FIELDS } from "../shared/config/custdetails.config";


type Field = {
  label: string;
  value: any;
  isCurrency?: boolean; //    optional property
};

export class SummaryHelper {

  static extractcoappBasicInfo(data: any) {
    if (!data) return {};
    const course = data;
    const basicDetailsFields = [
      { label: 'First Name', value: course.firstName },
      { label: 'Middle Name', value: course.middleName },
      { label: 'Last Name', value: course.lastName },
      { label: 'Email ID', value: course.emailId },
      { label: 'Mobile Number', value: course.mobileNumber },


    ].filter(field => field.value !== null && field.value !== '');

    return { basicDetailsFields };
  }


  static extractGeneralInfo(generalInfo: any) {
    if (!generalInfo) return { currentOccupation: '', courseDetailsFields: [] };

    const currentOccupation = generalInfo.occupationInfo?.occupation || '';

    const course = generalInfo.courseDetails || {};
    const courseDetailsFields = [
      { label: 'Country', value: course.country },
      { label: 'State', value: course.state },
      { label: 'Other State', value: course.otherStateName },

      { label: 'University Name', value: course.universityName },
      { label: 'Other University Name', value: course.otherUniversityName },

      { label: 'Course Type', value: course.courseType },
      // { label: 'Duration (Years)', value: course.durationYears != null ? course.durationYears : '' },
      { label: 'Course Name', value: course.courseName },
      { label: 'Other Course Name', value: course.otherCourseName || '' },

      { label: 'Course Start Date', value: course.startDate },
      { label: 'Course End Date', value: course.endDate },
      { label: 'Do you have Assets?', value: (generalInfo.hasAssets ? 'Yes' : 'No') },
      { label: 'Lending Partner', value: course.lendingPartner }
    ].filter(field => field.value !== null && field.value !== '');

    return { currentOccupation, courseDetailsFields };
  }

  static extractcoappGeneralInfo(generalInfo: any) {
    if (!generalInfo) return { currentOccupation: '', courseDetailsFields: [] };

    const currentOccupation = generalInfo.occupationInfo?.occupation || '';

    const courseDetailsFields = [
      { label: 'Current Occupation', value: currentOccupation },
      { label: 'Annual Income', value: generalInfo.annualIncome },
      { label: 'Relation with Applicant', value: generalInfo.relationWithApplicant },
      { label: 'Do you have Assets?', value: (generalInfo.hasAssets ? 'Yes' : 'No') },

    ].filter(field => field.value !== null && field.value !== '');

    return { currentOccupation, courseDetailsFields };
  }



  static extractEstimatedExpense(estimatedExpense: any) {
    if (!estimatedExpense) {
      return {
        educationFees: null,
        livingExpenses: [],
        miscellaneousExpenses: []
      };
    }

    const livingRaw = Array.isArray(estimatedExpense.livingExpenses)
      ? estimatedExpense.livingExpenses
      : [];

    const miscRaw = Array.isArray(estimatedExpense.miscellaneousExpenses)
      ? estimatedExpense.miscellaneousExpenses
      : [];

    const isOther = (name: string) =>
      name === 'Other Expense' || name === 'Other Expenses';

    //  Living
    const otherLiving = livingRaw.filter((e: any) => isOther(e.name));
    const livingWithoutOther = livingRaw.filter((e: any) => !isOther(e.name));

    if (otherLiving.length) {
      livingWithoutOther.push({
        name: 'Other Expense',
        isGroup: true,
        children: otherLiving
      });
    }

    //  Misc
    const otherMisc = miscRaw.filter((e: any) => isOther(e.name));
    const miscWithoutOther = miscRaw.filter((e: any) => !isOther(e.name));

    if (otherMisc.length) {
      miscWithoutOther.push({
        name: 'Other Expense',
        isGroup: true,
        children: otherMisc
      });
    }

    return {
      educationFees: estimatedExpense.educationFees || null,
      livingExpenses: livingWithoutOther,
      miscellaneousExpenses: miscWithoutOther
    };
  }


  static extractAdditionalInfo(additionalInfo: any, applicantType: 'MAIN' | 'CO_APPLICANT' = 'CO_APPLICANT') {
    const isMainApplicant = applicantType === 'MAIN';

    const labels = {
      applicantDetails: [
        { label: 'Gender', key: 'gender' },
        { label: 'Marital Status', key: 'maritalStatus' },
        { label: 'Upload Applicant Photo', key: 'fileName' },
        { label: 'Number of Dependents', key: 'numberofDependents' }
      ],
      spouse: [
        { label: 'First Name', key: 'firstName' },
        { label: 'Middle Name', key: 'middleName' },
        { label: 'Last Name', key: 'lastName' }
      ],
      father: [
        { label: 'First Name', key: 'firstName' },
        { label: 'Middle Name', key: 'middleName' },
        { label: 'Last Name', key: 'lastName' }
      ],
      mother: [
        { label: 'First Name', key: 'firstName' },
        { label: 'Middle Name', key: 'middleName' },
        { label: 'Last Name', key: 'lastName' }
      ]
    };

    // Helper function to safely get value or fallback
    const getValue = (obj: any, key: string) => {
      if (!obj) return '-';
      if (key === 'photoUrl') {
        return obj[key] ? 'Photo.jpg' : 'No Photo';
      }
      return obj[key] || '';
    };


    const applicantSource = isMainApplicant
      ? additionalInfo?.mainApplicant
      : additionalInfo?.applicantDetails;

    // Extract values for each section based on labels
    const values = {
      // mainApplicant: labels.mainApplicant.map(field => ({
      //   label: field.label,
      //   value: getValue(additionalInfo?.mainApplicant, field.key)
      // })).filter(field => field.value && field.value !== ''),

      applicantDetails: labels.applicantDetails
        .map(field => ({
          label: field.label,
          value: getValue(additionalInfo?.applicantDetails, field.key)
        }))
        .filter(field => field.value !== null && field.value !== undefined && field.value !== ''),


      spouse: labels.spouse.map(field => ({
        label: field.label,
        value: getValue(additionalInfo?.spouse, field.key)
      })).filter(field => field.value && field.value !== ''),

      father: labels.father.map(field => ({
        label: field.label,
        value: getValue(additionalInfo?.father, field.key)
      })).filter(field => field.value && field.value !== ''),

      mother: labels.mother.map(field => ({
        label: field.label,
        value: getValue(additionalInfo?.mother, field.key)
      })).filter(field => field.value && field.value !== '')
    };

    return values;
  }


  static extractKYCInfo(kyc: any) {
    if (!kyc) {
      return {
        identityAndResidency: [],
        permanentAddress: [],
        currentAddress: [],
        otherAddress: [],
        secondAddress: [],
        showOther: false
      };
    }
    const identity = kyc.identityAndResidency || {};
    const permanent = kyc.permanentAddress || {};
    const current = kyc.currentAddress || {};
    const other = kyc.otherAddress || {};

    // const isPermanentPreferred = permanent.isPreferredAddress === 1;
    const isPermanentPreferred = identity.isOtherAddress === 1;



    return {
      identityAndResidency: this.mapIdentity(kyc.identityAndResidency),

      permanentAddress: this.mapAddress(permanent, 'permanent'),



      secondAddress: isPermanentPreferred
        ? this.mapAddress(other, 'other')
        : this.mapAddress(current, 'current'),


      showOther: isPermanentPreferred


    };
  }
  static mapIdentity(identity: any) {
    if (!identity) return [];

    return [
      { label: 'Aadhaar Number', value: identity.aadhaarNumber },
      { label: 'Aadhaar Card Front', value: this.getFileName(identity.aadhaarFrontUrl,30) },
      { label: 'Aadhaar Card Back', value:  this.getFileName(identity.aadhaarBackUrl ,30)},
      { label: 'PAN Number', value: identity.panNumber },
      { label: 'PAN Card', value: this.getFileName( identity.panCardUrl,30) },
      { label: 'Passport', value: identity.passportNumber },
      { label: 'Passport ', value:  this.getFileName(identity.passportUrl,30) },
      { label: 'Date Of Birth', value: identity.dob }
    ];
  }
  static mapAddress(addr: any, type: 'permanent' | 'current' | 'other' = 'current') {
    if (!addr) return [];

    const baseFields = [
      { label: 'Address Line 1', value: addr.addressLine },
      { label: 'Address Line 2', value: addr.addressLine1 },
      { label: 'Address Line 3', value: addr.addressLine2 },
      { label: 'City', value: addr.city },
      { label: 'State', value: addr.state },
      { label: 'Country', value: addr.country },
      { label: 'Pincode', value: addr.pincode },

    ];

    const supportingDoc = {
      label: 'Supporting Document',
      value: this.getFileName(addr.supportingDocumentUrl,30)
    };



    if (type === 'permanent' || type === 'current') {
      return baseFields;
    }
    if (type === 'other') {
      return [supportingDoc, ...baseFields];
    }

    return [...baseFields, supportingDoc];



  }

  static extractQualificationInfo(qualificationDetail: any) {
    const labels = {
      QualificationDetails: [
        { label: 'Last Qualification', key: 'lastQualification' },
        { label: 'Other Qualification', key: 'otherQualification' },
        { label: 'Last Institution Name', key: 'lastInstitution' },
        { label: 'Other Institution ', key: 'otherInstitutionName' },
        { label: 'Other Institution Name', key: 'InstitutionName' },

      ],
    };
    const getValue = (data: any, key: string) => {
      if (!data) return '-';

      const obj = Array.isArray(data) ? data[0] : data;

      if (!obj) return '-';

      return obj[key] || '';
    };
    const values = {
      QualificationDetails: labels.QualificationDetails.map(field => ({
        label: field.label,
        value: getValue(qualificationDetail, field.key)
      })).filter(field => field.value && field.value !== ''),

    };

    return values;

  }

  static extractEducationInfo(educationDetails: any) {
    const labels = {

      tenth: COMMON_EDUCATION_FIELDS,
      twelfth: COMMON_EDUCATION_FIELDS,
      diploma: COMMON_EDUCATION_FIELDS,
      bachelors: COMMON_EDUCATION_FIELDS,
      postgraduate: COMMON_EDUCATION_FIELDS,
      others: COMMON_EDUCATION_FIELDS,
      ieltsPte: [
        { label: 'Score', key: 'score' },
        { label: 'Certificate', key: 'marksheetUrl' },

      ],
      offerLetter: [
               { label: '', key: 'fileName' },


      ],

    };



    const getValue = (data: any, key: string) => {
      if (!data) return '-';


      if (typeof data === 'string') {
        return key === 'offerLetter' ? data : '';
      }


      // Handle array case
      if (Array.isArray(data)) {

        if (key === 'marksheetUrl') {

          if (data[0]?.type === 'UPLOAD_CERTIFICATE') {
            return data[0]?.marksheetUrl || '';
          }

          const marksheets = data
            .filter(d => d.type === 'MARKSHEET')
            .map(d => d.marksheetUrl)
            .filter(Boolean);






          //  For 10th & 12th → return single string
          if (marksheets.length <= 1) {
            return marksheets[0] || '';
          }
          console.log("marksheets-------", marksheets)
          //  For diploma/UG/PG → return array
          // return marksheets;
          return marksheets;
        }

        //  Handle leaving certificate
        if (key === 'leavingCertificateUrl') {
          const lc = data.find(d => d.type === 'SCHOOL_LEAVING_CERT');
          return lc?.marksheetUrl || '';
        }

        if (key === 'otherDocumentUrl') {
          const lc = data.find(d => d.type === 'OTHER');
          return lc?.marksheetUrl || '';



        }


        if (key === 'title') {
          const otherDoc = data.find(d => d.type === 'OTHER');
          return otherDoc?.title || '';



        }

        //  Handle other fields (take first item)
        const obj = data[0];
        return obj?.[key] || '';
      }

      // Handle single object
      return data[key] || '';
    };

const buildEducationFields = (
  sectionData: any,
  sectionLabels: any[]
): any[] => {
  const documents = Array.isArray(sectionData)
    ? sectionData
    : sectionData
      ? [sectionData]
      : [];

  const normalFields = sectionLabels
    .filter(field =>
      field.key !== 'title' &&
      field.key !== 'otherDocumentUrl'
    )
    .map(field => ({
      label: field.label,
      key: field.key,
      value: getValue(
        documents,
        field.key
      )
    }))
    .filter(field =>
      field.value !== null &&
      field.value !== undefined &&
      field.value !== '' &&
      field.value !== '-'
    );

  const otherFields = documents
    .filter((document: any) =>
      String(document?.type || '')
        .trim()
        .toUpperCase() === 'OTHER'
    )
    .flatMap((document: any, index: number) => [
      {
        label: 'Other Document Name',
        key: `otherDocumentTitle_${index}`,
        value:
          document?.title ||
          `Other Document ${index + 1}`
      },
      {
        label: 'Other Document',
        key: `otherDocumentUrl`,
        value:
          document?.fileName ||
          document?.marksheetUrl ||
          document?.otherDocumentUrl ||
          '',
        viewUrl:
          document?.viewUrl ||
          document?.fileUrl ||
          '',
        documentId:
          document?.documentId ||
          ''
      }
    ])
    .filter(field =>
      field.value !== null &&
      field.value !== undefined &&
      field.value !== ''
    );

  return [
    ...normalFields,
    ...otherFields
  ];
};

    // Extract values for each section based on labels
    const values1 = {

      tenth: labels.tenth.map(field => ({
        label: field.label, key: field.key,
        value: getValue(educationDetails?.tenth, field.key)
      })).filter(field => field.value && field.value !== '' && field.value !== '-'),

      twelfth: labels.twelfth.map(field => ({
        label: field.label, key: field.key,
        value: getValue(educationDetails?.twelfth, field.key)
      })).filter(field => field.value && field.value !== '' && field.value !== '-'),

      diploma: labels.diploma.map(field => ({
        label: field.label, key: field.key,
        value: getValue(educationDetails?.diploma, field.key)
      })).filter(field => field.value && field.value !== '' && field.value !== '-'),

      bachelors: labels.bachelors.map(field => ({
        label: field.label, key: field.key,
        value: getValue(educationDetails?.bachelors, field.key)
      })).filter(field => field.value && field.value !== '' && field.value !== '-'),

      postgraduate: labels.postgraduate.map(field => ({
        label: field.label, key: field.key,
        value: getValue(educationDetails?.postgraduate, field.key)
      })).filter(field => field.value && field.value !== '' && field.value !== '-'),
      others: labels.others.map(field => ({
        label: field.label, key: field.key,
        value: getValue(educationDetails?.others, field.key)
      })).filter(field => field.value && field.value !== '' && field.value !== '-'),
      ieltsPte: labels.ieltsPte.map(field => ({
        label: field.label, key: field.key,
        value: getValue(educationDetails?.ieltsPte, field.key)
      })),
      offerLetter: labels.offerLetter.map(field => ({
        label: field.label, key: field.key,
        value: getValue(educationDetails?.offerLetter, field.key)
      })),

    };
    const values = {
  tenth: buildEducationFields(
    educationDetails?.tenth,
    labels.tenth
  ),

  twelfth: buildEducationFields(
    educationDetails?.twelfth,
    labels.twelfth
  ),

  diploma: buildEducationFields(
    educationDetails?.diploma,
    labels.diploma
  ),

  bachelors: buildEducationFields(
    educationDetails?.bachelors,
    labels.bachelors
  ),

  postgraduate: buildEducationFields(
    educationDetails?.postgraduate,
    labels.postgraduate
  ),

  others: buildEducationFields(
    educationDetails?.others,
    labels.others
  ),

  ieltsPte: labels.ieltsPte
    .map(field => ({
      label: field.label,
      key: field.key,
      value: getValue(
        educationDetails?.ieltsPte,
        field.key
      )
    }))
    .filter(field =>
      field.value !== null &&
      field.value !== undefined &&
      field.value !== '' &&
      field.value !== '-'
    ),

  offerLetter: labels.offerLetter
    .map(field => ({
      label: field.label,
      key: field.key,
      value: getValue(
        educationDetails?.offerLetter,
        field.key
      )
    }))
    .filter(field =>
      field.value !== null &&
      field.value !== undefined &&
      field.value !== '' &&
      field.value !== '-'
    )
};

    return values;

  }
  static extractLiabilitiesInfo(liabilities: any) {
    if (!liabilities) return [];

    const sections: any[] = [];

    /* ================= EXISTING LOANS ================= */
    if (liabilities.existingLoans?.length) {
      sections.push({
        sectionLabel: 'Existing Loans',
        cards: liabilities.existingLoans.map((loan: any, i: number) => {
          // title: `Home Loan ${i + 1}`,
          // title: `${loan.liabilityTypeText || 'Loan'} Loan`,

          const fields: Field[] = [
            {
              label: 'Bank / Lender',
              // value: loan.bankLender
              value: loan.bankLender
            },
          ]

          if (loan.bankLender === 'Other') {
            fields.push({
              label: 'Other Bank Name',
              value: loan.title
            });
          }

          fields.push(
            {
              label: 'Outstanding Balance (INR)',
              value: loan.outstandingBalanceInr,
              isCurrency: true
            },
            {
              label: 'EMI Amount (INR)',
              value: loan.emiAmountInr,
              isCurrency: true
            },
            {
              label: 'Remaining Tenure (Months)',
              value: loan.remainingTenureMonths
            });

          // ]

          return {
            title: `${loan.liabilityTypeText || 'Loan'} Loan`,
            fields
          };

        })
      });
    }

    /* ================= CREDIT CARD OUTSTANDING ================= */
    if (liabilities.creditCardOutstanding?.length) {
      sections.push({
        sectionLabel: 'Credit Card Outstanding',
        cards: liabilities.creditCardOutstanding.map((cc: any, i: number) => {
          // title: `Credit Card ${i + 1}`,
          const fields: Field[] = [
            {
              label: 'Bank Name',
              // value: cc.bankName === 'Other' ? cc.title : cc.bankName
              value: cc.bankName
            },
          ];

          if (cc.bankName === 'Other') {
            fields.push({
              label: 'Other Bank Name',
              value: cc.title
            });
          }
          fields.push(
            {
              label: 'Outstanding Balance (INR)',
              value: cc.outstandingBalanceInr,
              isCurrency: true
            },
            {
              label: 'Credit Limit (INR)',
              value: cc.creditLimitInr,
              isCurrency: true
            })

          return {
            title: `Credit Card ${i + 1}`,
            fields
          };


        })
      });
    }

    /* ================= BNPL ================= */
    if (liabilities.bnpl?.length) {
      sections.push({
        sectionLabel: 'Buy Now Pay Later (BNPL)',
        cards: liabilities.bnpl.map((b: any, i: number) => {
          // title: `BNPL ${i + 1}`,
          const fields: Field[] = [
            { label: 'Lender Name', value: b.lenderName },]


          if (b.lenderName === 'Other') {
            fields.push({
              label: 'Other Lender Name',
              value: b.title
            });
          }

          fields.push({
            label: 'Outstanding Balance (INR)',
            value: b.outstandingBalanceInr,
            isCurrency: true
          },
            {
              label: 'Credit Limit (INR)',
              value: b.creditLimitInr,
              isCurrency: true
            },
            {
              label: 'Monthly EMI (INR)',
              value: b.monthlyEmiInr,
              isCurrency: true
            });

          return {
            title: `BNPL ${i + 1}`,
            fields
          };

        })
      });
    }

    /* ================= OTHER LIABILITIES ================= */
    if (liabilities.otherLiabilities?.length) {
      sections.push({
        sectionLabel: 'Other Liabilities',
        cards: liabilities.otherLiabilities.map((o: any, i: number) => ({
          title: `Liability ${i + 1}`,
          fields: [
            { label: 'Liability Type', value: o.liabilityType },
            {
              label: 'Amount (INR)',
              value: o.amountInr,
              isCurrency: true
            },
            {
              label: 'Monthly Repayment (INR)',
              value: o.monthlyRepaymentInr,
              isCurrency: true
            }
          ]
        }))
      });
    }

    return sections;
  }


  static extractAssetsInfo(assets: any) {
    if (!assets) return [];

    const sections: any[] = [];

    /* ---------- GOLD ---------- */
    if (assets.gold?.length) {
      sections.push({
        sectionLabel: 'Gold',
        cards: [
          {
            fields: [
              { label: 'Value (INR)', value: assets.gold[0].valueInr, isCurrency: true }
            ]
          }
        ]
      });
    }

    /* ---------- LIQUID ASSETS ---------- */
    if (assets.liquidAssets?.length) {
      sections.push({
        sectionLabel: 'Liquid Assets',
        cards: [
          {
            fields: assets.liquidAssets.map((l: any) => ({
              label: `${l.assetType} `,
              value: l.amountInr,
              isCurrency: true
            }))
          }
        ]
      });
    }

    /* ---------- PROPERTY ---------- */
    if (assets.properties?.length) {
      sections.push({
        sectionLabel: 'Property / Land Assets',
        cards: assets.properties.map((p: any, i: number) => ({
          title: `Property ${i + 1}`,
          fields: [
            { label: 'Property Type', value: p.propertyType },
            { label: 'Ownership Type', value: p.ownershipType },
            { label: 'Market Value (INR)', value: p.marketValueInr, isCurrency: true },
            { label: 'Location / Address', value: p.location, fullRow: true }
          ]
        }))
      });
    }

    /* ---------- FIXED DEPOSIT ---------- */
    if (assets.fixedDeposits?.length) {
      sections.push({
        sectionLabel: 'Fixed Deposit',
        cards: assets.fixedDeposits.map((fd: any, i: number) => {
          // title: `FD ${i + 1}`,
          const fields: Field[] = [
            {
              label: 'Bank Name',
              value: fd.bankName
            },
          ];

          if (fd.bankName === 'Other') {
            fields.push({
              label: 'Other Bank Name',
              value: fd.description
            });
          }
          fields.push(

            // { label: 'Bank Name', value: fd.bankName },
            { label: 'Amount (INR)', value: fd.amountInr, isCurrency: true },
            { label: 'Maturity Date', value: fd.maturityDate })

          return {
            title: `FD ${i + 1}`,
            fields
          };

        })
      });
    }

    /* ---------- INVESTMENTS ---------- */
    if (assets.investments?.length) {
      sections.push({
        sectionLabel: 'Investments',
        cards: assets.investments.map((inv: any, i: number) => ({
          title: `Investments ${i + 1}`,
          fields: [
            { label: 'Select Type', value: inv.type },
            { label: `${inv.type} (INR)`, value: inv.valueInr, isCurrency: true }
          ]
        }))
      });
    }
    /* ---------- OTHERS ---------- */
    if (assets.otherAssets?.length) {
      sections.push({
        sectionLabel: 'Other Assets',
        cards: assets.otherAssets.map((oa: any, i: number) => ({
          title: `Asset ${i + 1}`,
          fields: [
            // { label: 'Asset Type', value: oa.type },
            // { label: `${oa.type} (INR)`, value: oa.valueInr, isCurrency: true }

            { label: 'Asset Type', value: oa.assetType ?? oa.type ?? '-' },
            { label: 'Value (INR)', value: this.getAmount(oa), isCurrency: true }]
        }))
      });
    }

    return sections;
  }

  public static getAmount(x: any) {
    return Number(x?.valueInr ?? x?.valueINR ?? x?.amountInr ?? 0);
  }

  static extractReferenceInfo(references: any[]) {
    if (!Array.isArray(references)) return [];
    const labels = [
      { label: 'First Name', key: 'firstName' },
      { label: 'Middle Name', key: 'middleName' },
      { label: 'Last Name', key: 'lastName' },
      { label: 'Email Id', key: 'emailId' },
      { label: 'Mobile Number', key: 'mobileNumber' },
      { label: 'Address Line 1', key: 'addressLine1' },
      { label: 'Address Line 2', key: 'addressLine2' },
      { label: 'Address Line 3', key: 'addressLine3' },
      { label: 'Country', key: 'country' },
      { label: 'State', key: 'state' },
      { label: 'City', key: 'city' },
      { label: 'Pincode', key: 'pincode' }
    ];

    const getValue = (obj: any, key: string) => {
      return obj?.[key] || '-';
    };

    return references.map((ref, index) => ({
      title: `Reference ${index + 1}`,
      fields: labels.map(field => ({
        label: field.label,
        value: getValue(ref, field.key)
      })).filter(field => field.value && field.value !== ''),
    }));
  }

  static toTitleCase(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_\-]/g, ' ')
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
      .trim();
  }


      static getFileName(filename:any,maxLength: number = 5): string {
  const fileName = filename || '';
    if (fileName.length <= maxLength) {
          return fileName; 
        }
            return `${fileName.substring(0, maxLength)}...`;
}
}
