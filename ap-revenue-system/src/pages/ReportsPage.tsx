import React, { useState } from 'react';
import { FileText, Table, Download, Loader, ChevronRight, FileSpreadsheet, FileBarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  generateCitizenSummaryPDF,
  generateLandOwnershipPDF,
  generateVehicleReportPDF,
  exportCitizensToExcel,
  exportLandsToExcel,
  exportVehiclesToExcel,
  exportRationCardsToExcel,
} from '../services/reportService';
import { useAppStore } from '../store/appStore';

const DISTRICTS = ['', 'Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Guntur', 'Prakasam', 'Nellore', 'Chittoor', 'Kadapa', 'Kurnool', 'Anantapur', 'Srikakulam', 'Vizianagaram'];

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: 'pdf' | 'excel';
  hasDistrictFilter?: boolean;
  hasTypeFilter?: boolean;
}

const REPORTS: ReportCard[] = [
  {
    id: 'citizen_summary_pdf',
    title: 'Citizen Summary Report',
    description: 'District-wise citizen demographics, income distribution, and caste summary',
    icon: <FileText size={22} />,
    color: 'from-blue-500 to-ap-blue',
    category: 'pdf',
    hasDistrictFilter: true,
  },
  {
    id: 'land_ownership_pdf',
    title: 'Land Ownership Report',
    description: 'Survey-wise land ownership, land types, and market valuations',
    icon: <FileBarChart size={22} />,
    color: 'from-green-500 to-green-700',
    category: 'pdf',
    hasDistrictFilter: true,
  },
  {
    id: 'vehicle_report_pdf',
    title: 'Vehicle Distribution Report',
    description: 'Vehicle registration statistics by type, fuel, and make',
    icon: <FileText size={22} />,
    color: 'from-indigo-500 to-indigo-700',
    category: 'pdf',
    hasTypeFilter: true,
  },
  {
    id: 'citizens_excel',
    title: 'Citizens Data Export',
    description: 'Complete citizen master data in Excel spreadsheet format',
    icon: <FileSpreadsheet size={22} />,
    color: 'from-emerald-500 to-emerald-700',
    category: 'excel',
  },
  {
    id: 'lands_excel',
    title: 'Land Records Export',
    description: 'All land records with survey details and valuations',
    icon: <Table size={22} />,
    color: 'from-lime-600 to-green-700',
    category: 'excel',
  },
  {
    id: 'vehicles_excel',
    title: 'Vehicle Records Export',
    description: 'Complete vehicle registration data for all types',
    icon: <FileSpreadsheet size={22} />,
    color: 'from-violet-500 to-purple-700',
    category: 'excel',
  },
  {
    id: 'ration_cards_excel',
    title: 'Ration Cards Export',
    description: 'Ration card data with beneficiary and entitlement details',
    icon: <Table size={22} />,
    color: 'from-orange-500 to-orange-700',
    category: 'excel',
  },
];

const ReportsPage: React.FC = () => {
  const { hasPermission } = useAppStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [districtFilters, setDistrictFilters] = useState<Record<string, string>>({});

  const canExport = hasPermission('export');

  const runReport = async (report: ReportCard) => {
    if (!canExport) { toast.error('You do not have permission to generate reports'); return; }
    setLoading(report.id);
    try {
      const district = districtFilters[report.id] || undefined;
      switch (report.id) {
        case 'citizen_summary_pdf': await generateCitizenSummaryPDF(district ? { district } : undefined); break;
        case 'land_ownership_pdf': await generateLandOwnershipPDF(district ? { district } : undefined); break;
        case 'vehicle_report_pdf': await generateVehicleReportPDF(); break;
        case 'citizens_excel': await exportCitizensToExcel(); break;
        case 'lands_excel': await exportLandsToExcel(); break;
        case 'vehicles_excel': await exportVehiclesToExcel(); break;
        case 'ration_cards_excel': await exportRationCardsToExcel(); break;
      }
      toast.success(`${report.title} generated successfully`);
    } catch (e) {
      toast.error('Report generation failed. Please try again.');
    }
    setLoading(null);
  };

  const pdfReports = REPORTS.filter(r => r.category === 'pdf');
  const excelReports = REPORTS.filter(r => r.category === 'excel');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports & Exports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate PDF reports or export data to Excel for offline analysis</p>
      </div>

      {!canExport && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 text-yellow-800 text-sm">
          <span className="text-xl">⚠️</span>
          <span>Your role does not have permission to generate reports. Please contact your administrator.</span>
        </div>
      )}

      {/* PDF Reports */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-ap-blue" />
          <h2 className="text-lg font-semibold text-gray-700">PDF Reports</h2>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium ml-1">PDF</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pdfReports.map(report => (
            <div key={report.id} className="gov-card hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center text-white mb-3`}>
                {report.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{report.title}</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{report.description}</p>

              {report.hasDistrictFilter && (
                <select
                  className="gov-input text-sm mb-3"
                  value={districtFilters[report.id] || ''}
                  onChange={e => setDistrictFilters(prev => ({ ...prev, [report.id]: e.target.value }))}
                >
                  <option value="">All Districts</option>
                  {DISTRICTS.filter(Boolean).map(d => <option key={d}>{d}</option>)}
                </select>
              )}

              <button
                onClick={() => runReport(report)}
                disabled={loading === report.id || !canExport}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-ap-blue text-white font-medium text-sm hover:bg-ap-blue/90 transition-colors disabled:opacity-50"
              >
                {loading === report.id ? (
                  <><Loader size={14} className="animate-spin" /> Generating...</>
                ) : (
                  <><Download size={14} /> Generate PDF</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Excel Exports */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Table size={18} className="text-green-600" />
          <h2 className="text-lg font-semibold text-gray-700">Excel Data Exports</h2>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium ml-1">XLSX</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {excelReports.map(report => (
            <div key={report.id} className="gov-card hover:shadow-md transition-shadow flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center text-white flex-shrink-0`}>
                {report.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{report.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{report.description}</p>
              </div>
              <button
                onClick={() => runReport(report)}
                disabled={loading === report.id || !canExport}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading === report.id ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Export
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Guide */}
      <div className="gov-card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-3">Report Usage Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
          {[
            { icon: '📄', text: 'PDF reports are formatted for official submission and include department letterhead.' },
            { icon: '📊', text: 'Excel exports contain raw data suitable for further analysis in spreadsheet tools.' },
            { icon: '🔒', text: 'All reports are marked confidential and generated with a timestamp.' },
            { icon: '⏬', text: 'Files are downloaded directly to your device — no data leaves the local system.' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span>{tip.icon}</span>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
