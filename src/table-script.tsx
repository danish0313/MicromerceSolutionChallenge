import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useMemo } from "react";
import sourceData from "./source-data.json";
import type { SourceDataType, TableDataType } from "./types";

/**
 * Helper function to get the cost for a specific month
 */
const getCostForMonth = (
  costsByMonth: any,
  monthString: string
): number => {
  if (!costsByMonth) return 0;

  // Check if it's potentialEarningsByMonth (array)
  if (
    Array.isArray(costsByMonth.potentialEarningsByMonth) &&
    costsByMonth.potentialEarningsByMonth.length > 0
  ) {
    const monthData = costsByMonth.potentialEarningsByMonth.find(
      (item: any) => item.month === monthString
    );
    return monthData ? parseFloat(monthData.costs) || 0 : 0;
  }

  // Check if it's costsByMonth (array for externals)
  if (
    Array.isArray(costsByMonth.costsByMonth) &&
    costsByMonth.costsByMonth.length > 0
  ) {
    const monthData = costsByMonth.costsByMonth.find(
      (item: any) => item.month === monthString
    );
    return monthData ? parseFloat(monthData.costs) || 0 : 0;
  }

  return 0;
};

/**
 * Helper function to calculate utilization rate from string (decimal format)
 */
const formatUtilizationRate = (rate: string | number | undefined): string => {
  if (rate === undefined || rate === null || rate === "NaN") {
    return "-";
  }

  const numRate = typeof rate === "string" ? parseFloat(rate) : rate;
  if (isNaN(numRate)) {
    return "-";
  }

  return `${(numRate * 100).toFixed(0)}%`;
};

/**
 * Helper function to format currency
 */
const formatCurrency = (value: number): string => {
  if (value === 0 || !value) {
    return "-";
  }
  return `${value.toFixed(0)} EUR`;
};

/**
 * Example of how a tableData object should be structured.
 *
 * Each `row` object has the following properties:
 * @prop {string} person - The full name of the employee.
 * @prop {number} past12Months - The value for the past 12 months.
 * @prop {number} y2d - The year-to-date value.
 * @prop {number} may - The value for May.
 * @prop {number} june - The value for June.
 * @prop {number} july - The value for July.
 * @prop {number} netEarningsPrevMonth - The net earnings for the previous month.
 */

const tableData: TableDataType[] = (
  sourceData as unknown as SourceDataType[]
)
  .filter((dataRow) => {
    // Only include active employees and externals
    const employee = dataRow.employees;
    const external = dataRow.externals;

    if (employee && employee.status === "active") {
      return true;
    }
    if (external && external.status === "active") {
      return true;
    }

    return false;
  })
  .map((dataRow) => {
    const employee = dataRow.employees;
    const external = dataRow.externals;

    const person = employee || external;

    if (!person) {
      return null;
    }

    // Get utilization rates
    const utilisation = person.workforceUtilisation;
    const past12MonthsRate = utilisation?.utilisationRateLastTwelveMonths;
    const y2dRate = utilisation?.utilisationRateYearToDate;

    // Get monthly utilization rates from lastThreeMonthsIndividually
    // Note: The months are typically ["August", "July", "June"] based on data
    const monthlyRates = utilisation?.lastThreeMonthsIndividually || [];
    const julyRate =
      monthlyRates.find((m: any) => m.month === "July")?.utilisationRate ||
      "-";
    const juneRate =
      monthlyRates.find((m: any) => m.month === "June")?.utilisationRate ||
      "-";
    const mayRate =
      monthlyRates.find((m: any) => m.month === "May")?.utilisationRate ||
      "-";

    // Get previous month earnings (December 2024)
    const prevMonthCost = getCostForMonth(
      person.costsByMonth,
      "2024-12"
    );

    const row: TableDataType = {
      person: person.name,
      past12Months: formatUtilizationRate(past12MonthsRate),
      y2d: formatUtilizationRate(y2dRate),
      may: formatUtilizationRate(mayRate),
      june: formatUtilizationRate(juneRate),
      july: formatUtilizationRate(julyRate),
      netEarningsPrevMonth: formatCurrency(prevMonthCost),
    };

    return row;
  })
  .filter((row): row is TableDataType => row !== null);

const Example = () => {
  const columns = useMemo<MRT_ColumnDef<TableDataType>[]>(
    () => [
      {
        accessorKey: "person",
        header: "Person",
      },
      {
        accessorKey: "past12Months",
        header: "Past 12 Months",
      },
      {
        accessorKey: "y2d",
        header: "Y2D",
      },
      {
        accessorKey: "may",
        header: "May",
      },
      {
        accessorKey: "june",
        header: "June",
      },
      {
        accessorKey: "july",
        header: "July",
      },
      {
        accessorKey: "netEarningsPrevMonth",
        header: "Net Earnings Prev Month",
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: tableData,
  });

  return <MaterialReactTable table={table} />;
};

export default Example;
