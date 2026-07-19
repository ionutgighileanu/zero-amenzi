export type Vehicle = {
  id: string;
  plate: string;
  vin: string;
  model: string;
  itp: string;
  rca: string;
  rovinieta: string;
  deleted_at: string | null;
};

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "c1",
    plate: "B 100 ABC",
    vin: "WAUZZZ8T0BA000001",
    model: "Volkswagen Golf · 2019",
    itp: "2026-10-15",
    rca: "2026-07-20",
    rovinieta: "2027-01-05",
    deleted_at: null,
  },
  {
    id: "c2",
    plate: "CJ 99 XYZ",
    vin: "WVWZZZ1K0BW000002",
    model: "Dacia Logan · 2021",
    itp: "2027-02-10",
    rca: "2026-11-20",
    rovinieta: "2026-07-25",
    deleted_at: null,
  },
];
