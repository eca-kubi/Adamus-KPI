# Adamus KPI Portal

A dashboard application for tracking and managing Key Performance Indicators (KPIs) at Adamus Resources Limited.

## 1. Project Overview

The **Adamus KPI Portal** provides real-time monitoring and reporting of performance metrics across multiple departments, including OHS, Milling, Crushing, Mining, Engineering, and Geology.

*   **Backend**: Python FastAPI application using SQLModel (SQLAlchemy) with Alembic database migrations.
*   **Frontend**: Vanilla HTML5, CSS3, and JavaScript, served directly by FastAPI.

For details on setting up your local environment and running the application, please refer to the [Onboarding Guide](ONBOARDING.md).

---

## 2. KPI Calculation Logic: Geology Department

The Geology department tracks three primary metrics with automated calculation and cascading rules:
1.  **Exploration Drilling**
2.  **Grade Control Drilling**
3.  **Toll Geology**

### A. Outlook (a) Calculation

For all three KPIs, the **Outlook (a)** is dynamically computed using a daily cumulative approach depending on the calendar day:

#### 1. On the 1st Day of the Month
$$\text{Outlook} = (\text{Daily Actual} - \text{Daily Forecast}) + \text{Full Forecast}$$

#### 2. On Subsequent Days (Day 2 onwards)
$$\text{Outlook} = (\text{Daily Actual} - \text{Daily Forecast}) + \text{Previous Outlook}$$

*Where:*
*   **Daily Actual**: The performance achieved on the target day.
*   **Daily Forecast**: The targeted performance for the day.
*   **Full Forecast**: The monthly forecast target set in the **Fixed Inputs** for the month.
*   **Previous Outlook**: The Outlook value from the record of the immediately preceding calendar day ($\text{Day} - 1$).

---

### B. Metric-Specific Daily Derivations

While the Outlook formula is identical across these three metrics, their daily inputs are derived differently:

| Metric | Daily Actual | Daily Forecast | Full Forecast / Budget |
| :--- | :--- | :--- | :--- |
| **Exploration Drilling** | Manually entered by user. | Manually entered or selected from pre-set rig targets (e.g., `80`, `150`, `230`, `300`). | Fetched from monthly Fixed Inputs. |
| **Grade Control Drilling** | Manually entered by user. | **Auto-calculated:**<br> $\text{Rigs} \times \text{Forecast Per Rig}$<br> *(where Forecast Per Rig is set in monthly Fixed Inputs)* | Fetched from monthly Fixed Inputs. |
| **Toll Geology** | Manually entered by user (labelled "Daily Actual (Wet Tonnes)"). Dry Tonnes is auto-calculated: $\text{Daily Actual (Wet Tonnes)} \times 0.85$ | **Auto-calculated:**<br> $\frac{\text{Full Forecast}}{\text{Days in Month}}$ | Fetched from monthly Fixed Inputs. |

*   **Toll Geology Note**: The **Dry Tonnes** field is read-only and automatically computed as **85%** of the daily wet tonnes (**Daily Actual (Wet Tonnes)**) entered by the user:
    $$\text{Dry Tonnes} = \text{Daily Actual (Wet Tonnes)} \times 0.85$$
    The **MTD Actual** for Toll is computed as the month-to-date sum of the **Dry Tonnes** values.

*   **Exploration Drilling Note**: The **Number of Rigs** field is temporarily hidden in the form UI and daily records table as it is not currently used for any calculations.

---

### C. Budget Variance (Var % / var3)

For the Geology department, the third variance percentage on the dashboard (**var3**) compares the **Outlook (a)** against the **Full Forecast (b)**:

$$\text{Budget Variance \% (var3)} = \frac{\text{Outlook} - \text{Full Forecast}}{\text{Full Forecast}} \times 100$$

*(Note: For other departments, the third variance measures Full Forecast vs. Full Budget).*
