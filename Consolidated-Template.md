# ✅ PERSONAL FINANCIAL PLANNING SHEET — CONSOLIDATED TEMPLATE + FORMULAS

## Sheet Structure (Recommended Tabs)

Use 4 tabs for clarity:

1. **Profile & Goals**
2. **Assets & Liabilities**
3. **Monthly Cash Flow**
4. **Retirement Planning**

(You can also keep everything in one sheet, but tabs make it clean and easier to maintain.)

---

# 1) PROFILE & GOALS

## 1.1 FAMILY DETAILS (Input Section)

| Name    | Date of Birth | PAN | Age | Expected Retirement Age |
| ------- | ------------- | --- | --: | ----------------------: |
| ABC     | 04/03/1986    |     |  40 |                      60 |
| CBA     | 07/07/1993    |     |  33 |                         |
| Child 1 | 10/08/2019    |     |   6 |                         |
| Child 2 | 08/08/2021    |     |   4 |                         |
| Father  |               |     |     |                         |
| Mother  |               |     |     |                         |

### ✅ Age Formula (if DOB exists)

If DOB is in **B2**, Age in **D2**:

```excel
=IF(B2="","",DATEDIF(B2,TODAY(),"Y"))
```

### ✅ Expected Retirement Age (input)

Manual input for each earning person.

---

## 1.2 CONTACT DETAILS (Input Section)

### Address

Single merged cell or a text field.

### Contact Table

| Field        | ABC | CBA |
| ------------ | --- | --- |
| Mobile No.   |     |     |
| Email Id     |     |     |
| Designation  |     |     |
| Organisation |     |     |

(Only manual inputs.)

---

## 1.3 GOALS TO BE PLANNED FOR

| Person  | Goal                 | Current Cost | Goal By (Age/Date) | Years Left |
| ------- | -------------------- | -----------: | ------------------ | ---------: |
| Child 1 | Graduation           |       100000 | 18                 |            |
| Child 1 | PG                   |       100000 | 22                 |            |
| Child 1 | Marriage             |       100000 | 25                 |            |
| Child 2 | Graduation           |       100000 | 18                 |            |
| Child 2 | PG                   |       100000 | 22                 |            |
| Child 2 | Marriage             |       100000 | 25                 |            |
| -       | Buying House         |              | 15/06/2030         |            |
| -       | Buying/Upgrading Car |              | 15/06/2029         |            |
| -       | Specific Goals       |              | 01/01/2028         |            |

### ✅ Years Left Formula (2 types)

### A) If "Goal By" is **AGE**

Example: Child 1 current age is in Family Details table.

Let's assume:

* Child's current age is in cell **Family!D4**
* Goal age is in Goals table cell **D2**

Then Years Left:

```excel
=IF(D2="","",D2 - Family!D4)
```

### B) If "Goal By" is a **DATE**

If goal date is entered like **15/06/2030**:

```excel
=IF(D2="","",DATEDIF(TODAY(),D2,"Y"))
```

✅ Best practice: Add a column **Goal Type** = "Age" or "Date" and use:

```excel
=IF([@[Goal Type]]="Age",[@[Goal By]] - CurrentAgeCell, DATEDIF(TODAY(),[@[Goal By]],"Y"))
```

---

# 2) ASSETS & LIABILITIES

This entire block feeds into your **Net Worth** and helps planning.

---

## 2.1 REAL ESTATE ASSETS

| Name of the Asset | Present Value | Outstanding Loan | Interest Rate | Loan Till | EMI | ROI | Remarks |
| ----------------- | ------------: | ---------------: | ------------: | --------- | --: | --: | ------- |
|                   |               |                  |               |           |     |     |         |

### Totals

At bottom:

* Total Present Value

```excel
=SUM(B:B)
```

* Total Outstanding Loan

```excel
=SUM(C:C)
```

* Net Real Estate Value

```excel
=TotalPresentValue - TotalOutstandingLoan
```

---

## 2.2 ACCOUNTS & FIXED DEPOSITS

| Bank Name | Account Type | Balance | Interest Rate | Maturity | Remarks |
| --------- | ------------ | ------: | ------------: | -------- | ------- |
|           |              |         |               |          |         |

Total Bank Balance:

```excel
=SUM(C:C)
```

---

## 2.3 STOCKS, MUTUAL FUNDS, CHITS, RD, OTHERS

| Type         | Invested Amount | Current Value | SIP/Chit Amount | Start Date | End Date | Remarks |
| ------------ | --------------: | ------------: | --------------: | ---------- | -------- | ------- |
| Stocks       |                 |               |                 |            |          |         |
| Mutual Funds |                 |               |                 |            |          |         |
| RD           |                 |               |                 |            |          |         |
| Chits        |                 |               |                 |            |          |         |
| Others       |                 |               |                 |            |          |         |

### Totals

Total Invested:

```excel
=SUM(B:B)
```

Total Current Value:

```excel
=SUM(C:C)
```

Total Monthly SIP/Chit:

```excel
=SUM(D:D)
```

---

## 2.4 INSURANCE POLICIES

| Policy Name | Policy Type | Sum Assured | Premium | PPT | Start Date | End Date | Maturity Amount |
| ----------- | ----------- | ----------: | ------: | --: | ---------- | -------- | --------------: |
|             |             |             |         |     |            |          |                 |

Total Premium (Annual/Monthly depends on input type):

```excel
=SUM(D:D)
```

---

## 2.5 LIABILITIES

| Type of Loan  | Total Loan Amount | Outstanding | Interest Rate | Term (Months) | EMI |
| ------------- | ----------------: | ----------: | ------------: | ------------: | --: |
| Home Loan     |                   |             |               |               |     |
| Car Loan      |                   |             |               |               |     |
| Personal Loan |                   |             |               |               |     |
| Other Loans   |                   |             |               |               |     |
| **Total**     |                   |             |               |               |     |

Totals:

```excel
TotalLoanAmount = SUM(B:B)
TotalOutstanding = SUM(C:C)
TotalEMI = SUM(F:F)
```

✅ **Interconnection:**
This **TotalEMI** must flow into Monthly Cashflow → **Total EMIs**.

---

# 3) MONTHLY CASH INFLOWS & OUTFLOWS (Main Calculation Engine)

This is where you compute:

* total inflow
* total outflow
* expense % split
* leftover

---

## 3.1 MONTHLY INFLOWS

| Inflow Type              | Amount |
| ------------------------ | -----: |
| Monthly Income           |        |
| Additional Income        |        |
| Rental Income            |        |
| Spouse's Income          |        |
| **Total Monthly Inflow** |        |

Total Monthly Inflow formula:

```excel
=SUM(B2:B5)
```

---

## 3.2 MONTHLY OUTFLOWS

### A) Essential Expenses

| Essential Expense            | Amount |
| ---------------------------- | -----: |
| House Rent & Maintenance     |        |
| Property Tax                 |        |
| Utilities                    |        |
| Groceries                    |        |
| Transportation               |        |
| Medical Expenses             |        |
| Children School Fees         |        |
| Insurance Premiums           |        |
| **Total Essential Expenses** |        |

Formula:

```excel
=SUM(B2:B9)
```

---

### B) Lifestyle Expenses

| Lifestyle Expense            | Amount |
| ---------------------------- | -----: |
| Maid Expense                 |        |
| Shopping                     |        |
| Travel Expenses              |        |
| Dine & Entertainment         |        |
| **Total Lifestyle Expenses** |        |

Formula:

```excel
=SUM(B2:B5)
```

---

### C) EMIs (Auto-linked from Liabilities)

| EMI Type          | Amount |
| ----------------- | -----: |
| Home Loan EMI     |        |
| Car Loan EMI      |        |
| Personal Loan EMI |        |
| Other EMIs        |        |
| **Total EMIs**    |        |

✅ Best Link:

```excel
=Liabilities!TotalEMI_Cell
```

---

### D) Investments

| Investment Type       | Amount |
| --------------------- | -----: |
| Mutual Fund SIP       |        |
| Stock SIP             |        |
| Recurring Deposit     |        |
| Others                |      0 |
| **Total Investments** |        |

Formula:

```excel
=SUM(B2:B5)
```

✅ Best Link (optional):
You can also link Total Investments from Assets → "SIP/Chit Amount Total":

```excel
=Investments!TotalSIP_Cell
```

---

## 3.3 Total Outflows + Leftover

### Monthly Expenses (Non-EMI)

```excel
MonthlyExpenses = TotalEssentialExpenses + TotalLifestyleExpenses
```

### Total Outflows

```excel
TotalOutflows = MonthlyExpenses + TotalEMIs + TotalInvestments
```

### Leftout for the Month

```excel
Leftout = TotalMonthlyInflow - TotalOutflows
```

---

## 3.4 Outflow Percentage Split (Auto calculated)

| Parameter                | Expense | % of Inflow |
| ------------------------ | ------: | ----------: |
| Total Essential Expenses |         |             |
| Total Lifestyle Expenses |         |             |
| Total EMIs               |         |             |
| Total Investments        |         |             |
| Leftout For the Month    |         |             |

### ✅ % Formula (each row)

If inflow total is in **B6**:

```excel
=IF($B$6=0,"",ExpenseCell/$B$6)
```

Format as Percentage.

✅ This ensures:

* Essential %
* Lifestyle %
* EMI %
* Investment %
* Savings/Leftover %

---

# 4) RETIREMENT PLANNING (Fully Linked)

This section uses:

✅ **Monthly Expenses** from Cashflow
✅ **Years left to retire** from Family table
✅ Inflation, Return assumptions (manual inputs)

---

## 4.1 Retirement Planning (Input + Derived)

| Name | Current Age | Age @ Retirement | Pension till Age |
| ---- | ----------: | ---------------: | ---------------: |
| ABC  |          40 |               60 |               85 |
| CBA  |          33 |                  |                  |

### Years Left to Retire (Derived)

For ABC:

```excel
=IF(C2="","",C2-B2)
```

---

## 4.2 Future Value of Present Expenses

| Parameter                       |        Value |
| ------------------------------- | -----------: |
| Current Monthly Expenses        |     (linked) |
| Inflation                       |           6% |
| Years Left to Retire            |    (derived) |
| Expense at Retirement (Monthly) | (calculated) |

✅ Link current monthly expenses:

```excel
=Cashflow!MonthlyExpenses_Cell
```

✅ Expense at retirement formula:

```excel
=CurrentMonthlyExpenses * (1 + Inflation) ^ YearsLeft
```

---

## 4.3 Retirement Corpus Calculation

| Parameter                       | Value |
| ------------------------------- | ----: |
| Expense at Retirement (Monthly) |       |
| Pension Required for Months     |   300 |
| Inflation                       |    6% |
| Expected Return on Corpus       |    8% |
| Corpus Required                 |       |

### ✅ Corpus Required Formula (Practical Sheet Approach)

Since retirement needs inflation adjustment and corpus return, the simplest usable approximation is:

**Option 1 (Simple):**

```excel
=ExpenseAtRetirement * PensionMonths
```

**Option 2 (Better): Real Return Approximation**
Use Real Return (post inflation):

```excel
RealReturn = ((1+ReturnOnCorpus)/(1+Inflation))-1
CorpusRequired = ExpenseAtRetirement * (1 - (1+RealReturn)^(-PensionMonths)) / RealReturn
```

Excel:

```excel
=ExpenseAtRetirement * (1 - (1 + (((1+ReturnOnCorpus)/(1+Inflation))-1))^(-PensionMonths)) / (((1+ReturnOnCorpus)/(1+Inflation))-1)
```

---

## 4.4 Monthly Investment Required (to reach corpus)

| Parameter                   | Value |
| --------------------------- | ----: |
| Corpus Required             |       |
| Months Left to Retire       |       |
| Return on Investment        |   12% |
| Monthly Investment Required |       |

✅ Monthly rate:

```excel
MonthlyRate = ROI/12
```

✅ SIP required (PMT formula)
If ROI annual is in B3:

```excel
=PMT(ROI/12, MonthsLeft, 0, -CorpusRequired, 0)
```

(Excel returns negative by default, so use negative CorpusRequired.)

---

## 4.5 Money Required to Retire Now (Optional)

A clean and practical formula:

```excel
MoneyToRetireNow = CorpusRequired / (1 + ROI) ^ YearsLeft
```

Or monthly compounding:

```excel
=CorpusRequired / (1 + ROI/12) ^ MonthsLeft
```

---

# ✅ FULL INTERCONNECTION MAP (Very Important)

### From **Liabilities → Monthly Cashflow**

* Total EMIs in cashflow should pull from:
  * Liabilities → EMI column sum

### From **Monthly Cashflow → Retirement**

* Current Monthly Expenses should pull from:
  * Essential + Lifestyle totals (not EMI)

### From **Family Details → Retirement**

* Years left should come from:
  * Retirement Age – Current Age

### From **Investments Section → Cashflow**

* Mutual fund SIP / Total SIP can pull from:
  * Stocks/MF/Chits table SIP amounts sum

---

# ✅ FINAL OUTPUT METRICS (Dashboard Row)

At top of the sheet, create a summary:

| Metric                 | Value |
| ---------------------- | ----: |
| Total Monthly Inflow   |       |
| Total Monthly Outflows |       |
| Leftover / Savings     |       |
| Savings Rate %         |       |
| EMI Burden %           |       |
| Investment Rate %      |       |

Formulas:

```excel
SavingsRate% = Leftout / TotalInflow
EMIBurden%   = TotalEMIs / TotalInflow
InvestRate%  = TotalInvestments / TotalInflow
```

---

# ✅ Quality Checks (to avoid errors)

Use these validations:

1. If any total shows `#VALUE!`
   ✅ Ensure cells are numeric (not formatted as text)

2. Date fields must be real dates (not "dd/mm/yyyy")
   ✅ Use Excel Date format

3. % values should always refer to **Total Inflow**, not Total Outflow
   ✅ Otherwise percentages become misleading
